import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaDeserializer {
  private readonly logger = new Logger(KafkaDeserializer.name);

  /**
   * Deserialize message
   * @param value Dữ liệu cần deserialize
   * @returns Dữ liệu đã được deserialize
   */
  deserialize<T>(value: Buffer | string): T {
    try {
      if (Buffer.isBuffer(value)) {
        value = value.toString('utf8');
      }
      
      if (typeof value !== 'string') {
        throw new Error('Data must be a string or buffer');
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to deserialize message: ${error.message}`);
      throw new Error(`Deserialization error: ${error.message}`);
    }
  }
}