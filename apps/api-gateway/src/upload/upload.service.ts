import { KafkaProducerService } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { FileType } from 'apps/upload-service/schemas/uploaded-file.schema';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  /**
   * Upload file lên Cloudinary qua Kafka
   * @param fileData Dữ liệu file cần upload
   * @returns Thông tin file đã upload
   */
  async uploadFile(fileData: {
    fileName: string;
    originalName: string;
    buffer: string;
    fileType: FileType;
    size: number;
    mimeType: string;
    userId?: string;
    folder?: string;
  }) {
    const command = {
      data: fileData,
      metadata: {
        id: `upload-${Date.now()}`,
        correlationId: `upload-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    try {
      this.logger.log(
        `Gửi yêu cầu upload file: ${fileData.originalName}, kích thước: ${fileData.size} bytes`,
      );
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.file.upload',
        command,
        60000, // Timeout 60 giây cho file lớn
      );

      if (response.status === 'error') {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Lỗi upload file: ${error.message}`);
      throw new Error(`Không thể upload file: ${error.message}`);
    }
  }

  /**
   * Xóa file từ Cloudinary
   * @param publicId PublicId của file cần xóa
   * @returns Kết quả xóa
   */
  async deleteFile(publicId: string) {
    const message = {
      publicId,
      metadata: {
        id: `delete-${Date.now()}`,
        correlationId: `delete-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    try {
      this.logger.log(`Gửi yêu cầu xóa file với publicId: ${publicId}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.file.delete',
        message,
      );

      if (response.status === 'error') {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Lỗi xóa file: ${error.message}`);
      throw new Error(`Không thể xóa file: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách file theo điều kiện
   * @param filter Điều kiện lọc (userId, fileType, folder)
   * @returns Danh sách file
   */
  async findAllFiles(filter: {
    userId?: string;
    fileType?: FileType;
    folder?: string;
  }) {
    const query = {
      ...filter,
      metadata: {
        id: `list-${Date.now()}`,
        correlationId: `list-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    try {
      this.logger.log(`Gửi yêu cầu lấy danh sách files: ${JSON.stringify(filter)}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.file.findAll',
        query,
      );

      if (response.status === 'error') {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách files: ${error.message}`);
      throw new Error(`Không thể lấy danh sách files: ${error.message}`);
    }
  }
} 