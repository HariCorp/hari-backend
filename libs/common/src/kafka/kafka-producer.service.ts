// libs/common/src/kafka/kafka-producer.service.ts
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  KafkaMessage,
  MessageMetadata,
} from './interfaces/kafka-message.interface';
import { KafkaSerializer } from './serialization/kafka-serializer';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly defaultRequestTimeout = 10000; // 10 seconds
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  // Common topics that will be pre-subscribed
  private readonly commonTopics = [
    // Auth service topics
    'ms.auth.register',
    'ms.auth.login',
    'ms.auth.refresh',
    'ms.auth.validate',
    'ms.auth.logout',
    'ms.auth.changePassword',

    // User service topics
    'ms.user.create',
    'ms.user.findAll',
    'ms.user.findById',
    'ms.user.findByUsername',
    'ms.user.findByEmail',
    'ms.user.update',
    'ms.user.delete',
    'ms.user.authenticate',
    'ms.user.verifyCredentials',
    'ms.user.findUserWithAuth',
    'ms.user.verifyUserPassword',
    'ms.user.updatePassword',

    // Product service topics
    'ms.product.create',
    'ms.product.findAll',
    'ms.product.findById',
    'ms.product.update',
    'ms.product.delete',
    'ms.product.findByCategory',
    'ms.product.findByUser',
    'ms.product.toggleActive',
    'ms.product.findByIds',

    // Category service topics
    'ms.category.create',
    'ms.category.findAll',
    'ms.category.findById',
    'ms.category.update',
    'ms.category.delete',
    'ms.category.getDirectChildren',

    // Event topics
    'ms.user.created',
    'ms.product.created',
    'ms.order.created',
    'ms.payment.completed',

    //AI service topics
    'ms.apiKey.create',
    'ms.ai.getCompletion',
    'ms.aimodel.create',
    'ms.aimodel.update',

    // File service topics
    'ms.file.upload',
    'ms.file.delete',
    'ms.file.findAll',

    //Cart service topics
    'ms.cart.findUserCart',
    'ms.cart.addItem',
    'ms.cart.removeItem',
    'ms.cart.updateItem',
    'ms.cart.clearCart',
    'ms.cart.findById',

    'ms.order.create',
    'ms.order.findByUser',
    'ms.order.findById',
    'ms.order.findByUser',
    'ms.order.delete',
    'ms.order.findAll',
    'ms.order.update',
    'ms.order.updateStatus',

    'ms.review.create',
    'ms.review.findAll',
    'ms.review.findByProductId',
    'ms.review.findOne',
    'ms.review.update',
    'ms.review.delete',
  ];

  // Track subscribed topics and connected status
  private subscribedTopics = new Set<string>();
  private isConnected = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly serializer: KafkaSerializer,
  ) {}

  /**
   * Initialize Kafka connection and pre-subscribe to common topics
   */
  async onModuleInit() {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    return this.initPromise;
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Pre-subscribe to common topics before connecting
      for (const topic of this.commonTopics) {
        this.kafkaClient.subscribeToResponseOf(topic);
        this.subscribedTopics.add(topic);
        this.logger.debug(`Pre-subscribed to response of topic: ${topic}`);
      }

      // Connect after subscribing to all topics
      await this.kafkaClient.connect();
      this.isConnected = true;
      this.logger.log(
        `Kafka producer connected and subscribed to ${this.subscribedTopics.size} topics`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Kafka producer: ${error.message}`,
      );
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    return this.initPromise;
  }

  /**
   * Subscribe to response of a topic if not already subscribed
   * @param topic Topic to subscribe to
   */
  async subscribeToResponseOf(topic: string): Promise<void> {
    // If already in common topics or already subscribed, do nothing
    if (this.subscribedTopics.has(topic)) {
      return;
    }

    try {
      // If already connected, need to disconnect and reconnect after subscribing
      const wasConnected = this.isConnected;

      if (wasConnected) {
        this.logger.warn(`Adding new topic ${topic} requires reconnection`);
        // No direct way to disconnect in ClientKafka, but we can track our own state
        this.isConnected = false;
      }

      this.kafkaClient.subscribeToResponseOf(topic);
      this.subscribedTopics.add(topic);
      this.logger.debug(`Subscribed to response of topic: ${topic}`);

      // Reconnect if we were connected before
      if (wasConnected) {
        await this.kafkaClient.connect();
        this.isConnected = true;
        this.logger.debug('Reconnected after subscribing to new topic');
      }
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic ${topic}: ${error.message}`,
      );
      throw error;
    }
  }

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
      // Ensure initialized
      await this.ensureInitialized();

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
      this.logger.error(
        `Failed to send message to topic ${topic}: ${error.message}`,
      );
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
      // Ensure service is initialized and topic is subscribed
      await this.ensureInitialized();

      // Check if we need to subscribe to this topic
      if (!this.subscribedTopics.has(topic)) {
        await this.subscribeToResponseOf(topic);
        // Reconnect to apply subscription
        await this.kafkaClient.connect();
        this.isConnected = true;
      }

      const messageKey = key || this.generateMessageKey();
      const metadata = this.createMetadata(messageKey);

      const kafkaMessage: KafkaMessage<T> = {
        key: messageKey,
        value: message,
        metadata,
      };

      this.logger.debug(
        `Sending request to topic ${topic} with key ${messageKey}`,
      );

      const response = await firstValueFrom(
        this.kafkaClient
          .send<R, KafkaMessage<T>>(topic, kafkaMessage)
          .pipe(timeout(responseTimeout)),
      );

      return response;
    } catch (error) {
      if (error.name === 'TimeoutError') {
        this.logger.error(
          `Request to ${topic} timed out after ${responseTimeout}ms`,
        );
        throw new Error(`Request to ${topic} timed out`);
      }
      this.logger.error(
        `Failed to send request to topic ${topic}: ${error.message}`,
      );
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
      await firstValueFrom(
        this.kafkaClient.emit(topic, { ...message, headers }),
      );
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Failed to emit message to ${topic}. Retrying (${retryCount + 1}/${this.maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
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

  /**
   * Get list of subscribed topics
   */
  getSubscribedTopics(): string[] {
    return Array.from(this.subscribedTopics);
  }

  /**
   * Check if connected to Kafka
   */
  isKafkaConnected(): boolean {
    return this.isConnected;
  }
}
