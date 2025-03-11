// libs/common/src/index.ts - Updated to export new features
export * from './common.module';
export * from './common.service';

// Export Kafka module and services
export * from './kafka/kafka.module';
export * from './kafka/kafka-producer.service';
export * from './kafka/kafka-consumer.service';
export * from './kafka/kafka-explorer.service';
export * from './kafka/admin/kafka-admin.service';
export * from './kafka/decorators/kafka-message-handler.decorator';
export * from './kafka/decorators/kafka-topic.decorator';
export * from './kafka/interfaces/kafka-message.interface';
export * from './kafka/interfaces/message-patterns.interface';
export * from './kafka/constants/message-types.constant';
export * from './kafka/constants/topics.constant';
export * from './kafka/serialization/kafka-serializer';
export * from './kafka/serialization/kafka-deserializer';

// Export validation
export * from './validation/validation.pipe';
export * from './validation/kafka-validation.pipe';
export * from './validation/decorators/kafka-validate.decorator';
export * from './validation/interceptors/kafka-validation.interceptor';

// Export filters
export * from './filters/http-exception.filter';
export * from './filters/all-exceptions.filter';
export * from './filters/kafka-exception.filter';

// Export bootstrap helpers
export * from './bootstrap';

// Export DTOs
export * from './dto';