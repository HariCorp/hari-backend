/**
 * Loại message
 */
export enum MessageType {
    COMMAND = 'command',
    EVENT = 'event',
    QUERY = 'query',
  }
  
  /**
   * Các loại error code
   */
  export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    TIMEOUT = 'TIMEOUT',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  }