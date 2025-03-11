// libs/common/src/filters/http-exception.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
  
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();
  
      const error = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message: errorResponse['message'] || exception.message || 'Internal server error',
        ...(Array.isArray(errorResponse['message'])
          ? { errors: errorResponse['message'] }
          : {}),
      };
  
      this.logger.error(
        `${request.method} ${request.url} ${status}: ${JSON.stringify(error)}`,
        exception.stack,
      );
  
      response.status(status).json(error);
    }
  }