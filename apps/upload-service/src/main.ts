import { NestFactory } from '@nestjs/core';
import { UploadModule } from './upload.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('UploadService');
  
  // Tạo một ứng dụng Nest thông thường
  const app = await NestFactory.create(UploadModule);
  const configService = app.get(ConfigService);

  // Kết nối microservice với ứng dụng
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'upload-service'),
        brokers: configService
          .get<string>('KAFKA_BROKERS', 'localhost:9092')
          .split(','),
      },
      consumer: {
        groupId: configService.get<string>(
          'KAFKA_GROUP_ID',
          'upload-service-group',
        ),
        allowAutoTopicCreation: true,
      },
    },
  });

  // Thêm validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Khởi động microservice mà không mở cổng HTTP
  await app.startAllMicroservices();
  
  logger.log('Upload service microservice đã khởi động thành công');
}

bootstrap(); 