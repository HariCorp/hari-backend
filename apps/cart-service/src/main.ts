// apps/cart-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { CartServiceModule } from './cart-service.module';

async function bootstrap() {
  const app = await NestFactory.create(CartServiceModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('CartService');

  // Configure microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'cart-service-client'),
        brokers: configService
          .get<string>('KAFKA_BROKERS', 'localhost:9092')
          .split(','),
      },
      consumer: {
        groupId: configService.get<string>(
          'KAFKA_GROUP_ID',
          'cart-service-consumer-group',
        ),
      },
    },
  });

  await app.startAllMicroservices();
  logger.log(`Cart Service Kafka microservice is running`);
  logger.log(
    `Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`,
  );
  logger.log(
    `Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'cart-service-group')}`,
  );
}
bootstrap();
