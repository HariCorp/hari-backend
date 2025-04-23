import { KafkaProducerService } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from 'apps/api-gateway/src/order/order.schema';
import { Model } from 'mongoose';

@Injectable()
export class OrderServiceService {
  private readonly logger = new Logger(OrderServiceService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async createOrder(createOrderDto) {
    try {
      return await this.orderModel.create(createOrderDto);
    } catch (error) {
      throw error;
    }
  }
}
