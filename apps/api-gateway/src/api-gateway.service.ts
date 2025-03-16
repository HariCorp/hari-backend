// apps/api-gateway/src/api-gateway.service.ts
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka
  ) {}
  
  async onModuleInit() {
    // Đăng ký tất cả các topics mà API Gateway cần lắng nghe phản hồi
    this.kafkaClient.subscribeToResponseOf('ms.auth.register');
    this.kafkaClient.subscribeToResponseOf('ms.auth.login');
    this.kafkaClient.subscribeToResponseOf('ms.auth.refresh');
    this.kafkaClient.subscribeToResponseOf('ms.auth.validate');
    this.kafkaClient.subscribeToResponseOf('ms.auth.logout');
    
    // Đăng ký các topics liên quan đến user service nếu cần
    this.kafkaClient.subscribeToResponseOf('ms.user.create');
    this.kafkaClient.subscribeToResponseOf('ms.user.findAll');
    this.kafkaClient.subscribeToResponseOf('ms.user.findById');
    this.kafkaClient.subscribeToResponseOf('ms.user.update');
    this.kafkaClient.subscribeToResponseOf('ms.user.delete');
    
    await this.kafkaClient.connect();
    this.logger.log('API Gateway Kafka client connected and subscribed to response topics');
  }
  
  getHello(): string {
    return 'Hello from API Gateway!';
  }
}