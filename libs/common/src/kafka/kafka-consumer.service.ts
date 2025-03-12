import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaDeserializer } from './serialization/kafka-deserializer';
import { SpecialTopic } from './constants/topics.constant';
import { firstValueFrom } from 'rxjs';

export interface KafkaSubscribeOptions {
  topic: string;
  fromBeginning?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface MessageHandler {
  handler: (data: any, context: any) => Promise<any>;
  maxRetries: number;
  retryDelay: number;
}

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly messageHandlers = new Map<string, MessageHandler>();
  private isConnected = false;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly deserializer: KafkaDeserializer,
  ) {}

  async onModuleInit() {
    // Không kết nối ở đây, sẽ kết nối sau khi tất cả handlers được đăng ký
    this.logger.log('KafkaConsumerService initialized');
  }

  /**
   * Connect to Kafka after all handlers are registered
   */
  async connect() {
    if (this.isConnected) {
      return;
    }
    
    // Register all message handlers with Kafka client
    const topics = Array.from(this.messageHandlers.keys());
    
    if (topics.length === 0) {
      this.logger.warn('No Kafka message handlers registered');
      return;
    }
    
    this.logger.log(`Subscribing to ${topics.length} Kafka topics: ${topics.join(', ')}`);
    
    for (const topic of topics) {
      this.kafkaClient.subscribeToResponseOf(topic);
    }
    
    await this.kafkaClient.connect();
    this.isConnected = true;
    this.logger.log('Kafka consumer connected successfully');
  }

  /**
   * Subscribe to a Kafka topic
   * @param options Subscription options
   * @param handler Message handler function
   */
  subscribe<T>(
    options: KafkaSubscribeOptions,
    handler: (data: T, context: any) => Promise<any>,
  ): void {
    const { topic, maxRetries = 3, retryDelay = 1000 } = options;

    this.messageHandlers.set(topic, {
      handler,
      maxRetries,
      retryDelay,
    });

    this.logger.log(`Registered handler for Kafka topic: ${topic}`);
    
    // We don't subscribe to the topic here anymore, it's done in connect()
  }

  /**
   * Handle an incoming Kafka message
   */
  async handleMessage(topic: string, value: any, partition: number, offset: number, timestamp: number): Promise<void> {
    const handler = this.messageHandlers.get(topic);
    
    if (!handler) {
      this.logger.warn(`No handler registered for topic ${topic}`);
      return;
    }

    try {
      // Create context
      const context = {
        topic,
        partition,
        offset,
        timestamp,
      };
      
      // Deserialize message
      const deserializedMessage = this.deserializer.deserialize(value);
      
      // Handle message
      await handler.handler(deserializedMessage, context);
    } catch (error) {
      await this.handleMessageError(topic, value, handler, error, 0);
    }
  }

  /**
   * Handle message processing error with retry
   */
  private async handleMessageError(
    topic: string,
    message: any,
    handler: MessageHandler,
    error: Error,
    retryCount: number
  ): Promise<void> {
    if (retryCount < handler.maxRetries) {
      this.logger.warn(
        `Error handling message from ${topic}. Retrying (${retryCount + 1}/${handler.maxRetries})...`,
        error.stack,
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, handler.retryDelay));
      
      try {
        const deserializedMessage = this.deserializer.deserialize(message);
        await handler.handler(deserializedMessage, { topic });
      } catch (retryError) {
        await this.handleMessageError(topic, message, handler, retryError, retryCount + 1);
      }
    } else {
      this.logger.error(
        `Failed to process message from ${topic} after ${handler.maxRetries} retries: ${error.message}`,
        error.stack,
      );
      
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(topic, message, error);
    }
  }

  /**
   * Send a message to the dead letter queue
   */
  private async sendToDeadLetterQueue(topic: string, message: any, error: Error): Promise<void> {
    const deadLetterTopic = `${topic}.${SpecialTopic.DEAD_LETTER}`;
    try {
      const deadLetterMessage = {
        originalTopic: topic,
        originalMessage: message,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
      };
      
      // Use producer service to send to dead letter topic
      await firstValueFrom(this.kafkaClient.emit(deadLetterTopic, deadLetterMessage));
      
      this.logger.warn(`Message sent to dead letter queue: ${deadLetterTopic}`);
    } catch (dlqError) {
      this.logger.error(`Failed to send message to dead letter queue: ${dlqError.message}`);
    }
  }
}