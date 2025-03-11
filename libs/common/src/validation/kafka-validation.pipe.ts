// libs/common/src/validation/kafka-validation.pipe.ts
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../kafka/constants/message-types.constant';

@Injectable()
export class KafkaValidationPipe {
  private readonly logger = new Logger(KafkaValidationPipe.name);

  // Đơn giản hóa, bỏ generic type
  async validateMessage(messageType: any, message: any): Promise<any> {
    // Convert the message payload to our DTO class
    const messageObject = plainToInstance(messageType, message);

    // Validate the instance
    const errors = await validate(messageObject);

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : ['Invalid value'];
          
        return {
          property: error.property,
          messages: constraints,
          value: error.value,
        };
      });

      this.logger.warn(`Kafka message validation failed: ${JSON.stringify(formattedErrors)}`);
      
      throw new RpcException({
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: formattedErrors,
      });
    }

    return messageObject;
  }
}