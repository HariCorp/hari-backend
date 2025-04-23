import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OrderServiceService } from './order-service.service';

@Controller()
export class OrderServiceController {
  constructor(private readonly OrderServiceService: OrderServiceService) {}

  @MessagePattern('ms.order.create')
  async createOrder(command) {
    try {
      const createOrderDto = command.data;
      const order = await this.OrderServiceService.createOrder(createOrderDto);
      return { status: 'success', data: order };
    } catch (error) {
      return {
        status: 'error',
        error: {
          code: error.name || 'ADD_TO_CART_ERROR',
          message: error.message,
        },
      };
    }
  }
}
