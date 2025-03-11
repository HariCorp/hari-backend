// libs/common/src/validation/decorators/kafka-validate.decorator.ts
import { applyDecorators, UseInterceptors, UsePipes } from '@nestjs/common';
import { KafkaValidationInterceptor } from '../interceptors/kafka-validation.interceptor';

/**
 * Decorator to apply validation to a Kafka message handler
 * @param dto The DTO class to validate against
 */
export function KafkaValidate(dto: any) {
  return applyDecorators(
    UseInterceptors(new KafkaValidationInterceptor(dto))
  );
}