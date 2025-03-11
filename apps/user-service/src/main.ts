// apps/user-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('UserService');
  const app = await NestFactory.create(UserServiceModule);
  
  // Lấy ConfigService từ ứng dụng
  const configService = app.get(ConfigService);
  
  // Setup Kafka microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'user-service-group'),
      },
    },
  });
  
  // Setup global filters cho microservice
  setupMicroserviceApp(app);
  
  // Khởi động chỉ Kafka microservice
  await app.startAllMicroservices();
  
  logger.log('\x1b[32m\x1b[1mUser Service Kafka microservice đang chạy');
}

bootstrap();