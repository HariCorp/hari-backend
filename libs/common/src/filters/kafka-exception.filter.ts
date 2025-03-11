// libs/common/src/filters/kafka-exception.filter.ts
import { Catch, ArgumentsHost, Logger, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { KafkaContext } from '@nestjs/microservices';
import { ErrorCode } from '../kafka/constants/message-types.constant';
import { KafkaResponse, MessageMetadata } from '../kafka/interfaces/kafka-message.interface';

// Định nghĩa interface cho error object
interface ErrorObject {
  message?: string;
  code?: string;
  statusCode?: number;
}

// Định nghĩa interface cho message object
interface KafkaMessageValue {
  metadata?: MessageMetadata;
  [key: string]: any;
}

@Catch(RpcException)
export class KafkaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(KafkaExceptionFilter.name);

  catch(exception: RpcException | Error, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();
    const kafkaContext = ctx.getContext<KafkaContext>();
    
    let errorMessage = 'Internal server error';
    let errorCode: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let statusCode: number = 500;
    let stack: string | undefined;
    
    // Extract message and code from the exception
    if (exception instanceof RpcException) {
      const error = exception.getError();
      stack = exception.stack;
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // Type assertion for object errors
        const errorObj = error as ErrorObject;
        errorMessage = errorObj?.message || 'Internal server error';
        errorCode = errorObj?.code || ErrorCode.INTERNAL_SERVER_ERROR;
        statusCode = errorObj?.statusCode || 500;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      stack = exception.stack;
    }
    
    // Get Kafka message details if available
    let topic = 'unknown';
    let partition = -1;
    
    if (kafkaContext) {
      try {
        const message = kafkaContext.getMessage();
        topic = kafkaContext.getTopic();
        
        // Safely access partition
        partition = typeof message === 'object' && message !== null && 'partition' in message
          ? Number(message.partition)
          : -1;
        
        this.logger.error(
          `Kafka exception in topic ${topic} (partition ${partition}): ${errorMessage}`,
          stack
        );
        
        // Tạo metadata mới nếu không tìm thấy từ original message
        let originalMetadata: MessageMetadata | undefined;
        if (typeof message === 'object' && message !== null && 'value' in message) {
          const value = message.value as KafkaMessageValue;
          if (value && typeof value === 'object' && 'metadata' in value) {
            originalMetadata = value.metadata;
          }
        }
        
        // Tạo metadata mới nếu không có sẵn
        const metadata: MessageMetadata = originalMetadata || {
          id: `error-${Date.now()}`,
          correlationId: `error-${Date.now()}`, 
          timestamp: Date.now(),
          source: process.env.SERVICE_NAME || 'error-handler',
          type: 'error',
        };
        
        const errorResponse: KafkaResponse = {
          status: 'error',
          error: {
            code: errorCode,
            message: errorMessage,
            details: stack,
          },
          metadata,
        };
        
        return throwError(() => errorResponse);
      } catch (err) {
        this.logger.error(`Error processing Kafka context: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    this.logger.error(`Microservice exception: ${errorMessage}`, stack);
    
    // Tạo metadata mới cho default error response
    const defaultMetadata: MessageMetadata = {
      id: `error-${Date.now()}`,
      correlationId: `error-${Date.now()}`, 
      timestamp: Date.now(),
      source: process.env.SERVICE_NAME || 'error-handler',
      type: 'error',
    };
    
    // Default error response
    const errorResponse: KafkaResponse = {
      status: 'error',
      error: {
        code: errorCode,
        message: errorMessage,
        details: stack,
      },
      metadata: defaultMetadata,
    };
    
    return throwError(() => errorResponse);
  }
}