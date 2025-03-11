import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KafkaSerializer {
  private readonly logger = new Logger(KafkaSerializer.name);

  /**
   * Serialize message
   * @param value Dữ liệu cần serialize
   * @returns Dữ liệu đã được serialize
   */
  serialize<T>(value: T): Buffer | string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      this.logger.error(`Failed to serialize message: ${error.message}`);
      throw new Error(`Serialization error: ${error.message}`);
    }
  }
}