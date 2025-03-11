import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(ApiGatewayModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:9092'], // Đảm bảo khớp với Kafka broker của bạn
      },
      consumer: {
        groupId: 'gateway-consumer-group', // Consumer group cho api-gateway
      },
    },
  });

  await app.listen();
  console.log('API Gateway is running as Kafka microservice');
}
bootstrap();