// apps/api-gateway/src/upload/upload.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Query,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RBAC, RolesGuard } from '@app/common';
import { FileType } from 'apps/upload-service/schemas/uploaded-file.schema';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'file', 'any')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles() files,
    @Body('service') service?: string, // Đổi từ folder thành service
    @Body('fileType') fileType?: FileType,
    @CurrentUser() user?: any, // Lấy thông tin người dùng từ JWT
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('Không tìm thấy file', HttpStatus.BAD_REQUEST);
      }

      // Xác định loại file từ mimetype nếu không được chỉ định
      // Kiểm tra xem service có hợp lệ không
      const serviceFolder = this.validateServiceFolder(service);

      // Xử lý upload nhiều file
      const uploadPromises = files.map(file => {
        // Đọc file buffer và chuyển sang base64
        const buffer = file.buffer.toString('base64');
        const detectedFileType = fileType || this.detectFileType(file.mimetype);

        return this.uploadService.uploadFile({
          fileName: file.originalname,
          originalName: file.originalname,
          buffer: buffer,
          fileType: detectedFileType,
          size: file.size,
          mimeType: file.mimetype,
          userId: user?.userId, // Lấy userId từ thông tin người dùng
          folder: serviceFolder, // Sử dụng service folder đã xác thực
        });
      });

      // Đợi tất cả các file đều được upload
      const results = await Promise.all(uploadPromises);

      return {
        status: 'success',
        data: results,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Không thể upload file',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':publicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('delete', 'file', 'any')
  async deleteFile(@Param('publicId') publicId: string) {
    try {
      const result = await this.uploadService.deleteFile(publicId);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Không thể xóa file',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('read', 'file', 'any')
  async getFiles(
    @Query('userId') userId?: string,
    @Query('fileType') fileType?: FileType,
    @Query('service') service?: string, // Đổi từ folder thành service
    @CurrentUser() user?: any, // Lấy thông tin người dùng từ JWT
  ) {
    try {
      // Xác thực quyền: Chỉ ADMIN mới có thể xem files của người khác
      if (userId && userId !== user.userId && !this.isAdmin(user)) {
        throw new HttpException(
          'Không có quyền xem files của người dùng khác',
          HttpStatus.FORBIDDEN,
        );
      }

      // Nếu không chỉ định userId, mặc định lấy userId của người dùng hiện tại (trừ khi là admin)
      const effectiveUserId =
        userId || (this.isAdmin(user) ? undefined : user.userId);

      // Xác định service folder
      const serviceFolder = service
        ? this.validateServiceFolder(service)
        : undefined;

      const files = await this.uploadService.findAllFiles({
        userId: effectiveUserId,
        fileType,
        folder: serviceFolder,
      });

      return {
        status: 'success',
        data: files,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          message: error.message || 'Không thể lấy danh sách files',
        },
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Kiểm tra xem người dùng có phải là admin không
   */
  private isAdmin(user: any): boolean {
    return (
      user?.roles?.includes('admin') || user?.roles?.includes('super_admin')
    );
  }

  /**
   * Xác thực và chuẩn hóa tên service
   */
  private validateServiceFolder(service?: string): string {
    if (!service) {
      return 'general'; // Mặc định nếu không chỉ định
    }

    // Danh sách các service hợp lệ
    const validServices = [
      'products',
      'users',
      'categories',
      'profiles',
      'general',
    ];

    // Chuẩn hóa service name
    const normalizedService = service.toLowerCase().trim();

    // Kiểm tra xem service có hợp lệ không
    if (!validServices.includes(normalizedService)) {
      throw new HttpException(
        `Service không hợp lệ. Các service hợp lệ: ${validServices.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalizedService;
  }

  /**
   * Xác định loại file dựa vào MIME type
   */
  private detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    } else {
      return FileType.DOCUMENT;
    }
  }
}
