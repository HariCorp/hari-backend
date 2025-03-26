// apps/product-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ProductServiceModule } from './product-service.module';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ProductService');
  const app = await NestFactory.create(ProductServiceModule);
  
  const configService = app.get(ConfigService);
  
  // Configure Kafka microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME'),
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'product-service-group'),
        allowAutoTopicCreation: true
      },
    },
  });
  
  // Setup global filters and error handling
  setupMicroserviceApp(app);
  
  // Start the microservice
  await app.startAllMicroservices();
  
  // Log that the service is running
  logger.log(`Product Service Kafka microservice is running`);
  logger.log(`Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`);
  logger.log(`Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'product-service-group')}`);
}

bootstrap();