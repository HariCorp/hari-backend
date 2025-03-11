// apps/user-service/src/kafka-test.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { KafkaProducerService } from '@app/common/kafka';

@Controller('kafka-test') // Đảm bảo prefix là 'kafka-test'
export class KafkaTestController {
  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  @Post('send') // Đảm bảo endpoint là 'send'
  async sendMessage(@Body() message: any) {
    console.log('Received message to send:', message);
    await this.kafkaProducer.send('test-topic', message);
    return { success: true, message: 'Message sent to Kafka' };
  }

  @Get()
  getHello() {
    return { message: 'Kafka test is running' };
  }
}