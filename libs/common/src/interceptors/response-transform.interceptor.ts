// libs/common/src/interceptors/response-transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface ResponseOptions {
  statusCode?: number;
  message?: string;
  requestId?: string;
}

export interface Response<T> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data?: T;
  error?: any;
  requestId: string;
}

interface ErrorResponseObject {
  message?: string;
  [key: string]: any;
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // Tạo requestId từ timestamp + random string
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Lấy thông tin về request từ context
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map(data => {
        // Kiểm tra xem data có phải là object với các thuộc tính đặc biệt không
        let statusCode = HttpStatus.OK;
        let message = 'Success';
        let responseData = data;
        let resRequestId = requestId;
        
        // Nếu controller trả về object có chứa statusCode, message, data
        if (data && typeof data === 'object') {
          if ('_statusCode' in data) {
            statusCode = data._statusCode;
            delete data._statusCode;
          }
          
          if ('_message' in data) {
            message = data._message;
            delete data._message;
          }
          
          if ('_requestId' in data) {
            resRequestId = data._requestId;
            delete data._requestId;
          }
          
          // Nếu data có trường _data thì sử dụng nó làm responseData
          if ('_data' in data) {
            responseData = data._data;
          } else {
            // Nếu không có _data, sử dụng toàn bộ data sau khi đã loại bỏ các trường đặc biệt
            responseData = data;
          }
        }
        
        // Đặt HTTP status code cho response
        response.status(statusCode);
        
        // Nếu đã là định dạng response chuẩn với status và error
        if (responseData && typeof responseData === 'object' && ('status' in responseData) && 
            (responseData.status === 'success' || responseData.status === 'error')) {
          
          if (responseData.status === 'error' && responseData.error) {
            // Nếu là error response, update statusCode
            const errorStatusCode = this.mapErrorCodeToStatusCode(
              responseData.error?.code as string | undefined
            );
            response.status(errorStatusCode);
            
            return {
              status: 'error',
              statusCode: errorStatusCode,
              message: responseData.error?.message || 'Error occurred',
              error: responseData.error,
              requestId: responseData.requestId || resRequestId
            };
          }
          
          // Nếu đã là response chuẩn, thêm statusCode và message nếu chưa có
          return {
            ...responseData,
            statusCode: (responseData as any).statusCode || statusCode,
            message: (responseData as any).message || message,
            requestId: (responseData as any).requestId || resRequestId
          };
        }
        
        // Trường hợp còn lại, bọc trong định dạng chuẩn
        return {
          status: 'success',
          statusCode,
          message,
          data: responseData,
          requestId: resRequestId
        };
      }),
      catchError(err => {
        // Xử lý lỗi và chuyển đổi thành định dạng phản hồi chuẩn
        const statusCode = err instanceof HttpException 
          ? err.getStatus() 
          : HttpStatus.INTERNAL_SERVER_ERROR;
        
        const errorResponse = err instanceof HttpException 
          ? err.getResponse() 
          : { message: err.message || 'Internal server error' };
        
        let errorMessage: string;
        let errorDetails: ErrorResponseObject;
        
        if (typeof errorResponse === 'string') {
          errorMessage = errorResponse;
          errorDetails = { message: errorMessage };
        } else {
          // Đảm bảo errorResponse là một object
          errorDetails = errorResponse as ErrorResponseObject;
          
          // Lấy message từ errorDetails nếu có
          errorMessage = errorDetails.message || 'Error occurred';
        }
        
        const errorCode = err.name || 'INTERNAL_SERVER_ERROR';
        
        return throwError(() => ({
          status: 'error',
          statusCode,
          message: errorMessage,
          error: {
            code: errorCode,
            message: errorMessage,
            details: errorDetails
          },
          requestId
        }));
      })
    );
  }
  
  // Helper method để map error code sang HTTP status code
  private mapErrorCodeToStatusCode(errorCode?: string): number {
    if (!errorCode) return HttpStatus.INTERNAL_SERVER_ERROR;
    
    const errorMap: Record<string, number> = {
      'VALIDATION_ERROR': HttpStatus.BAD_REQUEST,
      'UNAUTHORIZED': HttpStatus.UNAUTHORIZED,
      'FORBIDDEN': HttpStatus.FORBIDDEN,
      'NOT_FOUND': HttpStatus.NOT_FOUND,
      'CONFLICT': HttpStatus.CONFLICT,
      'INTERNAL_SERVER_ERROR': HttpStatus.INTERNAL_SERVER_ERROR,
    };
    
    return errorMap[errorCode] || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}