// apps/user-service/src/main.ts - Updated
import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { ConfigService } from '@nestjs/config';
import { setupHttpApp, setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(UserServiceModule);
  
  // Setup global filters and pipes for HTTP
  setupHttpApp(app);
  
  // Lấy ConfigService từ ứng dụng
  const configService = app.get(ConfigService);
  
  // Lấy giá trị PORT từ env, với giá trị mặc định là 3002 nếu không tìm thấy
  const port = configService.get<number>('PORT', 3002);
  
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
  
  // Setup global filters for microservice
  setupMicroserviceApp(app);
  
  // Khởi động cả HTTP server và kết nối Kafka
  await app.startAllMicroservices();
  await app.listen(port);
  
  console.log(`User Service is running on port: ${port}`);
  console.log(`User Service URL: ${await app.getUrl()}`);
  console.log('User Service Kafka microservice is running');
}

bootstrap();