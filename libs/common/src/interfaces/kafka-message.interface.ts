// libs/common/src/interfaces/kafka-message.interface.ts
export interface KafkaMessage<T> {
    key: string;
    value: T;
  }
  
  export interface KafkaResponse<T> {
    status: 'success' | 'error';
    data?: T;
    error?: string;
  }