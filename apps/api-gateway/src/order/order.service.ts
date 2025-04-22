import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './order.dto';
import { KafkaProducerService } from '@app/common';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(private readonly kafkaProducer: KafkaProducerService) {}
  async create(createOrderDto: CreateOrderDto) {
    const command = {
      data: createOrderDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };
    try {
      this.logger.log(
        `Sending create product command: ${JSON.stringify(createOrderDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.create',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(response.error.message);
      }
      return response.data;
    } catch (error) {
      this.logger.log(`Create order failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Create order failed: ${error.message}`);
    }
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
