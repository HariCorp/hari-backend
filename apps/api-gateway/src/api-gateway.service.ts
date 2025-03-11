// apps/api-gateway/src/api-gateway.service.ts
import { Injectable } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';

@Injectable()
export class ApiGatewayService {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}
  
  getHello(): string {
    return 'Hello from API Gateway!';
  }
}