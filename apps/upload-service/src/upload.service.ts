// apps/upload-service/src/upload.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadFileDto } from '../dto/upload-file.dto';
import {
  UploadedFile,
  UploadedFileDocument,
  FileType,
} from '../schemas/uploaded-file.schema';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly ROOT_FOLDER = 'hariFood';

  constructor(
    @InjectModel(UploadedFile.name)
    private uploadedFileModel: Model<UploadedFileDocument>,
    private configService: ConfigService,
  ) {
    // Cấu hình Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  /**
   * Upload file lên Cloudinary
   * @param uploadFileDto Dữ liệu file cần upload
   * @returns Thông tin file đã upload
   */
  async uploadFile(
    uploadFileDto: UploadFileDto,
  ): Promise<UploadedFileDocument> {
    this.logger.log(`Đang upload file: ${uploadFileDto.originalName}`);

    try {
      // Decode base64 buffer
      const buffer = Buffer.from(uploadFileDto.buffer, 'base64');

      // Tạo folder path theo cấu trúc yêu cầu
      const folderPath = this.buildFolderPath(uploadFileDto);

      // Tạo một promise để upload file lên Cloudinary
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            resource_type: this.mapResourceType(uploadFileDto.fileType),
            public_id: this.generatePublicId(uploadFileDto.originalName),
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Lỗi Cloudinary: ${error.message}`);
              return reject(error);
            }
            resolve(result);
          },
        );

        // Đẩy buffer vào stream
        uploadStream.end(buffer);
      });

      // Chờ upload hoàn tất
      const uploadResult: any = await uploadPromise;
      this.logger.log(
        `Đã upload file lên Cloudinary: ${uploadResult.public_id}`,
      );

      // Lưu thông tin file vào database
      const fileMetadata = this.extractMetadata(
        uploadResult,
        uploadFileDto.fileType,
      );

      const uploadedFile = await this.uploadedFileModel.create({
        fileName: uploadFileDto.fileName,
        originalName: uploadFileDto.originalName,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileType: uploadFileDto.fileType,
        size: uploadResult.bytes || uploadFileDto.size,
        mimeType: uploadFileDto.mimeType,
        metadata: fileMetadata,
        userId: uploadFileDto.userId,
        folder: folderPath,
      });

      this.logger.log(
        `Đã lưu thông tin file vào database: ${uploadedFile._id}`,
      );
      return uploadedFile;
    } catch (error) {
      this.logger.error(`Không thể upload file: ${error.message}`);
      throw new Error(`Không thể upload file: ${error.message}`);
    }
  }

  /**
   * Xây dựng cấu trúc thư mục theo yêu cầu
   * format: hariFood/{file type}/{service name}/{user ID}/{file}
   * @param fileDto Thông tin file upload
   * @returns Đường dẫn thư mục đầy đủ
   */
  private buildFolderPath(fileDto: UploadFileDto): string {
    // Xác định loại file folder
    let fileTypeFolder = 'others';
    switch (fileDto.fileType) {
      case FileType.IMAGE:
        fileTypeFolder = 'images';
        break;
      case FileType.VIDEO:
        fileTypeFolder = 'videos';
        break;
      case FileType.AUDIO:
        fileTypeFolder = 'audios';
        break;
      case FileType.DOCUMENT:
        fileTypeFolder = 'documents';
        break;
    }

    // Xác định service folder (mặc định là 'general' nếu không cung cấp)
    const serviceFolder = fileDto.folder || 'general';

    // Xác định user ID folder (mặc định là 'anonymous' nếu không cung cấp)
    const userIdFolder = fileDto.userId || 'anonymous';

    // Tạo đường dẫn thư mục đầy đủ
    return `${this.ROOT_FOLDER}/${fileTypeFolder}/${serviceFolder}/${userIdFolder}`;
  }

  /**
   * Xóa file từ Cloudinary và database
   * @param publicId PublicId của file cần xóa
   * @returns Kết quả xóa
   */
  async deleteFile(
    publicId: string,
  ): Promise<{ deleted: boolean; publicId: string }> {
    this.logger.log(`Đang xóa file với publicId: ${publicId}`);

    try {
      // Tìm file trong database
      const file = await this.uploadedFileModel.findOne({ publicId }).exec();
      if (!file) {
        this.logger.warn(`Không tìm thấy file với publicId: ${publicId}`);
        throw new Error(`Không tìm thấy file với publicId: ${publicId}`);
      }

      // Xóa file từ Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: this.mapResourceType(file.fileType),
      });

      if (result.result !== 'ok') {
        this.logger.warn(`Cloudinary không xóa được file: ${result.result}`);
        throw new Error(`Không thể xóa file từ Cloudinary: ${result.result}`);
      }

      // Xóa thông tin file từ database
      await this.uploadedFileModel.deleteOne({ publicId }).exec();

      this.logger.log(`Đã xóa file thành công: ${publicId}`);
      return {
        deleted: true,
        publicId,
      };
    } catch (error) {
      this.logger.error(`Không thể xóa file: ${error.message}`);
      throw new Error(`Không thể xóa file: ${error.message}`);
    }
  }

  /**
   * Tìm tất cả file theo điều kiện
   * @param filter Điều kiện lọc (userId, fileType, folder)
   * @returns Danh sách file tìm thấy
   */
  async findAllFiles(filter: {
    userId?: string;
    fileType?: FileType;
    folder?: string;
  }): Promise<UploadedFileDocument[]> {
    this.logger.log(`Tìm files với filter: ${JSON.stringify(filter)}`);

    try {
      const query = {};

      if (filter.userId) {
        query['userId'] = filter.userId;
      }

      if (filter.fileType) {
        query['fileType'] = filter.fileType;
      }

      if (filter.folder) {
        query['folder'] = new RegExp(filter.folder, 'i'); // Tìm kiếm folder với regex
      }

      const files = await this.uploadedFileModel
        .find(query)
        .sort({ createdAt: -1 })
        .exec();

      this.logger.log(`Tìm thấy ${files.length} files`);
      return files;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm files: ${error.message}`);
      throw new Error(`Lỗi khi tìm files: ${error.message}`);
    }
  }

  /**
   * Map FileType sang resource_type của Cloudinary
   * @param fileType Loại file
   * @returns Resource type tương ứng với Cloudinary
   */
  private mapResourceType(
    fileType: FileType,
  ): 'image' | 'video' | 'raw' | 'auto' {
    switch (fileType) {
      case FileType.IMAGE:
        return 'image';
      case FileType.VIDEO:
        return 'video';
      case FileType.AUDIO:
        return 'video'; // Cloudinary xử lý audio dưới resource_type 'video'
      default:
        return 'raw'; // Cho các loại file document và khác
    }
  }

  /**
   * Tạo publicId duy nhất cho file
   * @param originalName Tên file gốc
   * @returns PublicId được tạo
   */
  private generatePublicId(originalName: string): string {
    const baseName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Thay thế ký tự không hợp lệ
      .replace(/_+/g, '_') // Loại bỏ nhiều dấu gạch dưới liên tiếp
      .substring(0, 30); // Giới hạn độ dài của tên base

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    return `${baseName}_${timestamp}_${randomString}`;
  }

  /**
   * Trích xuất metadata từ kết quả upload Cloudinary
   * @param result Kết quả từ Cloudinary
   * @param fileType Loại file
   * @returns Metadata được trích xuất
   */
  private extractMetadata(result: any, fileType: FileType): any {
    const metadata: any = {
      format: result.format,
    };

    // Thêm metadata dựa vào loại file
    switch (fileType) {
      case FileType.IMAGE:
        metadata.width = result.width;
        metadata.height = result.height;
        break;
      case FileType.VIDEO:
        metadata.width = result.width;
        metadata.height = result.height;
        metadata.duration = result.duration;
        break;
      case FileType.DOCUMENT:
        metadata.pages = result.pages;
        break;
    }

    return metadata;
  }
}
