import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { RbacModule } from '@app/common';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    RbacModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // Giới hạn kích thước file 10MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {} 