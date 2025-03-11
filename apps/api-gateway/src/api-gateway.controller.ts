import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @MessagePattern('test-topic') // Lắng nghe topic test-topic
  handleMessage(@Payload() message: any) {
    console.log('API Gateway received message from test-topic:', message);
    return 'Message received by API Gateway'; // Trả về để test (dù không cần thiết nếu chỉ log)
  }
}
