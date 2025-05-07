// apps/review-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ReviewModule } from './review.module';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ReviewService');
  const app = await NestFactory.create(ReviewModule);
  
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
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'review-service-group'),
        allowAutoTopicCreation: true
      },
    },
  });
  
  // Setup global filters and error handling
  setupMicroserviceApp(app);
  
  // Start the microservice
  await app.startAllMicroservices();
  
  // Log that the service is running
  logger.log(`Review Service Kafka microservice is running`);
  logger.log(`Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`);
  logger.log(`Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'review-service-group')}`);
}

bootstrap();