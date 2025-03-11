// apps/api-gateway/src/main.ts - Updated
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import { setupHttpApp, setupMicroserviceApp } from '@app/common/bootstrap';

async function bootstrap() {
  // Tạo ứng dụng HTTP thông thường
  const app = await NestFactory.create(ApiGatewayModule);
  
  // Setup global filters and pipes for HTTP
  setupHttpApp(app);
  
  // Lấy ConfigService từ ứng dụng
  const configService = app.get(ConfigService);
  
  // Lấy giá trị PORT từ env, với giá trị mặc định là 3000 nếu không tìm thấy
  const port = configService.get<number>('PORT', 3000);
  
  // Tích hợp với Kafka như một microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'gateway-consumer-group'),
      },
    },
  });
  
  // Setup global filters for microservice
  setupMicroserviceApp(app);
  
  // Khởi động cả HTTP server và kết nối Kafka
  await app.startAllMicroservices();
  await app.listen(port);
  
  console.log(`API Gateway HTTP is running on port: ${port}`);
  console.log(`API Gateway HTTP URL: ${await app.getUrl()}`);
  console.log('API Gateway Kafka microservice is running');
}

bootstrap();