import { SetMetadata } from '@nestjs/common';

export const KAFKA_MESSAGE_HANDLER = 'KAFKA_MESSAGE_HANDLER';

export interface KafkaMessageHandlerOptions {
  topic: string;
  fromBeginning?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Decorator for Kafka message handlers
 * @param options Handler options including topic, retry settings, etc.
 */
export const KafkaMessageHandler = (options: KafkaMessageHandlerOptions) =>
  SetMetadata(KAFKA_MESSAGE_HANDLER, options);