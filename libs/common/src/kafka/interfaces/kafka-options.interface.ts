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
  // Các tùy chọn nâng cao khác có thể được thêm ở đây
}

/**
 * Tùy chọn không đồng bộ cho KafkaModule
 */
export interface KafkaModuleAsyncOptions {
  imports?: any[];
  useFactory: (...args: any[]) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  inject?: any[];
}