/**
 * Các tùy chọn cấu hình Kafka
 */
export interface KafkaModuleOptions {
    clientId: string;
    brokers: string[];
    groupId: string;
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain';
      username: string;
      password: string;
    };
  }
  
  /**
   * Tùy chọn không đồng bộ cho KafkaModule
   */
  export interface KafkaModuleAsyncOptions {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
    inject?: any[];
  }