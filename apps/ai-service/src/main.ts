import { NestFactory } from '@nestjs/core';
import { AiServiceModule } from './ai-service.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { setupMicroserviceApp } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AiServiceModule);
  const configService = app.get(ConfigService);
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'ai-service'),
        brokers: configService
          .get<string>('KAFKA_BROKERS', 'localhost:9092')
          .split(','),
      },
      consumer: {
        groupId: configService.get<string>(
          'KAFKA_GROUP_ID',
          'ai-service-group',
        ),
        allowAutoTopicCreation: true,
      },
    },
  });
  setupMicroserviceApp(app);
  await app.startAllMicroservices();
}
bootstrap();
