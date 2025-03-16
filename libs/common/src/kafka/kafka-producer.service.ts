import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaMessage, MessageMetadata } from './interfaces/kafka-message.interface';
import { KafkaSerializer } from './serialization/kafka-serializer';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly responseTopics = [
    'ms.auth.register',
    'ms.auth.login',
    'ms.auth.refresh',
    'ms.auth.validate',
    'ms.auth.logout',
    'ms.user.findById',
    'ms.user.create',
    'ms.user.verifyCredentials',
  ];
  
  async onModuleInit() {
    this.responseTopics.forEach(topic => this.kafkaClient.subscribeToResponseOf(topic));
    await this.kafkaClient.connect();
    this.logger.log('Kafka producer subscribed to response topics and connected');
  }
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly defaultRequestTimeout = 10000; // 10 seconds
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly serializer: KafkaSerializer,
  ) {}

  /**
   * Send a message to a Kafka topic
   * @param topic The Kafka topic
   * @param message The message to send
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise that resolves when the message is sent
   */
  async send<T>(
    topic: string,
    message: T,
    key?: string,
    headers?: Record<string, any>,
  ): Promise<void> {
    try {
      const messageKey = key || this.generateMessageKey();
      const metadata = this.createMetadata(messageKey);
      
      const kafkaMessage: KafkaMessage<T> = {
        key: messageKey,
        value: message,
        metadata,
      };

      await this.emitWithRetry(topic, kafkaMessage, headers);
      this.logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to send message to topic ${topic}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send a message and wait for a response
   * @param topic The Kafka topic
   * @param message The message to send
   * @param responseTimeout Timeout for waiting response in milliseconds
   * @param key Optional message key
   * @param headers Optional message headers
   * @returns Promise with the response
   */
  async sendAndReceive<T, R>(
    topic: string,
    message: T,
    responseTimeout: number = this.defaultRequestTimeout,
    key?: string,
    headers?: Record<string, any>,
  ): Promise<R> {
    try {
      const messageKey = key || this.generateMessageKey();
      const metadata = this.createMetadata(messageKey);
      
      const kafkaMessage: KafkaMessage<T> = {
        key: messageKey,
        value: message,
        metadata,
      };

      const response = await firstValueFrom(
        this.kafkaClient
          .send<R, KafkaMessage<T>>(topic, kafkaMessage)
          .pipe(timeout(responseTimeout)),
      );

      return response;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        this.logger.error(`Request to ${topic} timed out after ${responseTimeout}ms`);
        throw new Error(`Request to ${topic} timed out`);
      }
      this.logger.error(`Failed to send message to topic ${topic}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emit a message with retry mechanism
   */
  private async emitWithRetry(
    topic: string,
    message: any,
    headers?: Record<string, any>,
    retryCount = 0,
  ): Promise<void> {
    try {
      await firstValueFrom(this.kafkaClient.emit(topic, { ...message, headers }));
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Failed to emit message to ${topic}. Retrying (${retryCount + 1}/${this.maxRetries})...`,
        );
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.emitWithRetry(topic, message, headers, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generate a unique message key
   */
  private generateMessageKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Create message metadata
   */
  private createMetadata(messageId: string): MessageMetadata {
    return {
      id: messageId,
      correlationId: messageId,
      timestamp: Date.now(),
      source: process.env.SERVICE_NAME || 'unknown',
      type: 'message',
    };
  }
}