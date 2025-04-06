import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UploadService } from './upload.service';
import { UploadFileCommand } from '../dto/upload-file.dto';
import { Logger } from '@nestjs/common';
import { FileType } from '../schemas/uploaded-file.schema';

@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) {}

  /**
   * Xử lý yêu cầu upload file lên Cloudinary qua microservice pattern
   * @param command Dữ liệu file cần upload
   * @returns Phản hồi với trạng thái và dữ liệu hoặc lỗi
   */
  @MessagePattern('ms.file.upload')
  async uploadFile(command: UploadFileCommand) {
    this.logger.log(`Nhận yêu cầu upload file: ${command.data.originalName}`);

    try {
      const result = await this.uploadService.uploadFile(command.data);
      this.logger.log(`Đã upload file thành công: ${result.publicId}`);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Không thể upload file: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'FILE_UPLOAD_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Xóa file từ Cloudinary qua microservice pattern
   * @param data Dữ liệu yêu cầu xóa (publicId)
   * @returns Phản hồi với trạng thái và kết quả hoặc lỗi
   */
  @MessagePattern('ms.file.delete')
  async deleteFile(data: { publicId: string }) {
    this.logger.log(`Yêu cầu xóa file với publicId: ${data.publicId}`);

    try {
      const result = await this.uploadService.deleteFile(data.publicId);
      this.logger.log(`Đã xóa file thành công: ${data.publicId}`);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Không thể xóa file: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'FILE_DELETE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Lấy danh sách các file đã upload
   * @param query Các tham số lọc
   * @returns Phản hồi với trạng thái và danh sách file hoặc lỗi
   */
  @MessagePattern('ms.file.findAll')
  async findAllFiles(query: { 
    userId?: string;
    fileType?: FileType;
    folder?: string;
  }) {
    this.logger.log(`Yêu cầu lấy danh sách files với query: ${JSON.stringify(query)}`);

    try {
      const files = await this.uploadService.findAllFiles(query);
      this.logger.log(`Đã lấy ${files.length} files`);
      return {
        status: 'success',
        data: files,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách files: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: 'FILE_FETCH_FAILED',
          message: error.message,
        },
      };
    }
  }
} 