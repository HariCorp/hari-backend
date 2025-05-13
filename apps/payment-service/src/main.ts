import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { setupMicroserviceApp } from '@app/common/bootstrap';
import { Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { PaymentModule } from './payment-service.module';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  const app = await NestFactory.create(PaymentModule);

  const configService = app.get(ConfigService);

  // Configure Kafka microservice
  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: configService.get('SERVICE_NAME', 'payment-service-client'),
        brokers: configService
          .get<string>('KAFKA_BROKERS', 'localhost:9092')
          .split(','),
      },
      consumer: {
        groupId: configService.get<string>(
          'KAFKA_GROUP_ID',
          'payment-service-group',
        ),
      },
    },
  });

  // Setup global filters and error handling
  setupMicroserviceApp(app);

  // Start the microservice
  await app.startAllMicroservices();

  // Log that the service is running
  logger.log(`Payment Service Kafka microservice is running`);
  logger.log(
    `Kafka Brokers: ${configService.get<string>('KAFKA_BROKERS', 'localhost:9092')}`,
  );
  logger.log(
    `Group ID: ${configService.get<string>('KAFKA_GROUP_ID', 'payment-service-group')}`,
  );
}

bootstrap();
