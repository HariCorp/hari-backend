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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RBAC, RolesGuard } from '@app/common';
import { FileType } from 'apps/upload-service/schemas/uploaded-file.schema';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'file', 'any')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file,
    @Body('folder') folder?: string,
    @Body('fileType') fileType?: FileType,
  ) {
    try {
      if (!file) {
        throw new HttpException('Không tìm thấy file', HttpStatus.BAD_REQUEST);
      }

      // Đọc file buffer và chuyển sang base64
      const buffer = file.buffer.toString('base64');

      // Xác định loại file từ mimetype nếu không được chỉ định
      const detectedFileType = fileType || this.detectFileType(file.mimetype);

      // Gọi service để upload file
      const result = await this.uploadService.uploadFile({
        fileName: file.originalname,
        originalName: file.originalname,
        buffer: buffer,
        fileType: detectedFileType,
        size: file.size,
        mimeType: file.mimetype,
        folder,
      });

      return {
        status: 'success',
        data: result,
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
    @Query('folder') folder?: string,
  ) {
    try {
      const files = await this.uploadService.findAllFiles({
        userId,
        fileType,
        folder,
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