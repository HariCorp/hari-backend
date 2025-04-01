// apps/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import { ResponseTransformInterceptor } from '@app/common';

async function bootstrap() {
  // Create HTTP application
  const app = await NestFactory.create(ApiGatewayModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Add cookie parser middleware
  app.use(cookieParser());

  app.setGlobalPrefix('api');

  // Add global interceptors
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Get Kafka configuration
  const kafkaClientId = configService.get('KAFKA_CLIENT_ID');
  const kafkaBroker = configService.get('KAFKA_BROKERS');
  const kafkaGroupId = configService.get('KAFKA_GROUP_ID');

  if (!kafkaClientId || !kafkaBroker || !kafkaGroupId) {
    throw new Error('Missing required Kafka configurationn');
  }

  // Connect to Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaClientId,
        brokers: [kafkaBroker],
      },
      consumer: {
        groupId: kafkaGroupId,
      },
    },
  });

  // Start Kafka microservice
  await app.startAllMicroservices();
  console.log('Kafka microservice is running');

  // Start HTTP server
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  console.log(`HTTP server is running on port ${port}`);
}

bootstrap();
