import { NestFactory } from '@nestjs/core';
import { UserServiceModule } from './user-service.module';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('UserService');
  const app = await NestFactory.create(UserServiceModule);
  
  const configService = app.get(ConfigService);
  
  // Cấu hình rõ ràng clientId và groupId
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'user-service-client'),
        brokers: configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
      },
      consumer: {
        groupId: configService.get<string>('KAFKA_GROUP_ID', 'user-service-group'),
        allowAutoTopicCreation: true
      },
    },
  });
  
  setupMicroserviceApp(app);
  
  await app.startAllMicroservices();
  
  // Log that the service is running
  logger.log(`User Service Kafka microservice is running`);
  logger.log(`Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`);
  logger.log(`Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'user-service-group')}`);
}

bootstrap();