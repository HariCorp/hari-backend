import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface Response<T> {
  data?: T;
  error?: any;
  status: 'success' | 'error';
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // Nếu đã là định dạng response chuẩn, kiểm tra xem có lỗi không
        if (data && typeof data === 'object' && ('status' in data)) {
          if (data.status === 'error') {
            const httpContext = context.switchToHttp();
            const response = httpContext.getResponse();
            
            // Map Kafka error code to HTTP status code
            let statusCode = HttpStatus.BAD_REQUEST;
            if (data.error?.code === 'NOT_FOUND') statusCode = HttpStatus.NOT_FOUND;
            if (data.error?.code === 'UNAUTHORIZED') statusCode = HttpStatus.UNAUTHORIZED;
            if (data.error?.code === 'FORBIDDEN') statusCode = HttpStatus.FORBIDDEN;
            
            response.status(statusCode);
          }
          
          return data;
        }
        
        // Nếu không, đóng gói trong định dạng chuẩn
        return {
          status: 'success',
          data,
        };
      }),
      catchError(err => {
        return throwError(() => new HttpException({
          status: 'error',
          error: {
            message: err.message,
            code: err.name || 'INTERNAL_SERVER_ERROR'
          }
        }, HttpStatus.INTERNAL_SERVER_ERROR));
      })
    );
  }
}