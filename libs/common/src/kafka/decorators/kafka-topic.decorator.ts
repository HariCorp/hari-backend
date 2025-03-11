import { SetMetadata } from '@nestjs/common';
import { createTopicName } from '../constants/topics.constant';

export const KAFKA_TOPIC_METADATA = 'KAFKA_TOPIC_METADATA';

export interface KafkaTopicOptions {
  /**
   * Tên topic đầy đủ. Nếu được chỉ định, các tùy chọn khác sẽ bị bỏ qua.
   */
  name?: string;

  /**
   * Tên service (ví dụ: 'user', 'order', 'payment')
   */
  service?: string;

  /**
   * Tên entity (ví dụ: 'user', 'order', 'payment')
   */
  entity?: string;

  /**
   * Hành động (ví dụ: 'created', 'updated', 'deleted')
   */
  action?: string;
}

/**
 * Decorator để định nghĩa Kafka topic cho class hoặc method
 * @param options Tùy chọn để tạo tên topic
 */
export function KafkaTopic(options: KafkaTopicOptions | string) {
  let topicName: string;

  if (typeof options === 'string') {
    topicName = options;
  } else if (options.name) {
    topicName = options.name;
  } else if (options.service && options.entity && options.action) {
    topicName = createTopicName(options.service, options.entity, options.action);
  } else {
    throw new Error('Invalid Kafka topic options. Either provide a name or service, entity and action.');
  }

  return SetMetadata(KAFKA_TOPIC_METADATA, topicName);
}

/**
 * Lấy tên topic từ metadata
 * @param target Class hoặc method có decorator KafkaTopic
 */
export function getTopicMetadata(target: any): string | undefined {
  return Reflect.getMetadata(KAFKA_TOPIC_METADATA, target);
}