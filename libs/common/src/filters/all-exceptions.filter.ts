// libs/common/src/filters/all-exceptions.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      
      // Check if we're in HTTP context
      if (ctx.getRequest) {
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        
        const status =
          exception.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;
        
        const error = {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          message: exception.message || 'Internal server error',
        };
  
        this.logger.error(
          `${request.method} ${request.url} ${status}: ${JSON.stringify(error)}`,
          exception.stack,
        );
  
        response.status(status).json(error);
      } else {
        // For non-HTTP contexts (e.g., Kafka, other microservices)
        this.logger.error(
          `Non-HTTP exception occurred: ${exception.message}`,
          exception.stack,
        );
      }
    }
  }
  