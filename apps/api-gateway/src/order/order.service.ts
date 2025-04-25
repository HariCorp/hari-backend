import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto, FilterOrderDto } from './order.dto';
import { KafkaProducerService } from '@app/common';
import { OrderStatus } from '@app/common/enums';

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
        `Sending create order command: ${JSON.stringify(createOrderDto)}`,
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
      this.logger.error(`Create order failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Create order failed: ${error.message}`);
    }
  }

  async findAll(filterDto: FilterOrderDto = {}) {
    const query = {
      data: filterDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    try {
      this.logger.log(
        `Sending get all orders query: ${JSON.stringify(filterDto)}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.findAll',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Get all orders failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Get all orders failed: ${error.message}`);
    }
  }

  async findByUser(userId: string, filterDto: FilterOrderDto = {}) {
    const query = {
      data: { ...filterDto, userId },
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    try {
      this.logger.log(
        `Sending get user orders query: ${JSON.stringify({ userId, ...filterDto })}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.findByUser',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Get user orders failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Get user orders failed: ${error.message}`);
    }
  }

  async findOne(id: string) {
    const query = {
      data: { id },
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'query',
      },
    };

    try {
      this.logger.log(`Sending get order query: ${id}`);

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.findById',
        query,
      );

      if (response.status === 'error') {
        if (response.error.message.includes('not found')) {
          throw new NotFoundException(`Order with id ${id} not found`);
        }
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Get order failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Get order failed: ${error.message}`);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const command = {
      data: { id, ...updateOrderDto },
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
        `Sending update order command: ${JSON.stringify({ id, ...updateOrderDto })}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.update',
        command,
      );

      if (response.status === 'error') {
        if (response.error.message.includes('not found')) {
          throw new NotFoundException(`Order with id ${id} not found`);
        }
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Update order failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Update order failed: ${error.message}`);
    }
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
  ) {
    const command = {
      data: { id, status, note, updatedBy },
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
        `Sending update order status command: ${JSON.stringify({ id, status, note })}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.updateStatus',
        command,
      );

      if (response.status === 'error') {
        if (response.error.message.includes('not found')) {
          throw new NotFoundException(`Order with id ${id} not found`);
        }
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Update order status failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(
            `Update order status failed: ${error.message}`,
          );
    }
  }

  async cancelOrder(id: string, reason: string, userId: string) {
    const command = {
      data: { id, reason, userId },
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
        `Sending cancel order command: ${JSON.stringify({ id, reason })}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.cancel',
        command,
      );

      if (response.status === 'error') {
        if (response.error.message.includes('not found')) {
          throw new NotFoundException(`Order with id ${id} not found`);
        }
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Cancel order failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Cancel order failed: ${error.message}`);
    }
  }

  async remove(id: string) {
    const command = {
      data: { id },
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
      },
    };

    try {
      this.logger.log(`Sending delete order command: ${id}`);

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.delete',
        command,
      );

      if (response.status === 'error') {
        if (response.error.message.includes('not found')) {
          throw new NotFoundException(`Order with id ${id} not found`);
        }
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Delete order failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Delete order failed: ${error.message}`);
    }
  }
}
