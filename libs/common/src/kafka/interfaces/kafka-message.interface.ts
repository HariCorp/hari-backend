/**
 * Metadata chuẩn cho tất cả Kafka messages
 */
export interface MessageMetadata {
    id: string;
    correlationId: string;
    timestamp: number;
    source: string;
    type: string;
  }
  
  /**
   * Cấu trúc chuẩn cho Kafka message
   */
  export interface KafkaMessage<T = any> {
    key: string;
    value: T;
    metadata: MessageMetadata;
    headers?: Record<string, any>;
  }
  
  /**
   * Cấu trúc response chuẩn
   */
  export interface KafkaResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    error?: {
      code: string;
      message: string;
      details?: any;
    };
    metadata?: MessageMetadata;
  }