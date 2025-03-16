// apps/auth-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AuthService');
  const app = await NestFactory.create(AuthServiceModule);
  
  const configService = app.get(ConfigService);
  
  // Configure Kafka microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'auth-service-client'),
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'auth-service-group'),
        allowAutoTopicCreation: true
      },
    },
  });
  
  // Setup global filters and error handling
  setupMicroserviceApp(app);
  
  // Start the microservice
  await app.startAllMicroservices();
  
  // Log that the service is running
  logger.log(`Auth Service Kafka microservice is running`);
  logger.log(`Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`);
  logger.log(`Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'auth-service-group')}`);
}

bootstrap();