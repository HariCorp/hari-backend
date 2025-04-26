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

  /**
   * Create a new order
   * @param createOrderDto Order creation data
   * @returns Created order
   */
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
        `Creating order with data: ${JSON.stringify({
          userId: createOrderDto.userId,
          sellerId: createOrderDto.sellerId,
          itemCount: createOrderDto.items.length,
          totalAmount: createOrderDto.totalAmount,
        })}`,
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

  /**
   * Find all orders with optional filtering
   * @param filterDto Filter criteria
   * @returns List of orders matching criteria
   */
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
      const filterSummary = {
        ...filterDto,
        userId: filterDto.userId
          ? `${filterDto.userId.substring(0, 8)}...`
          : undefined,
        sellerId: filterDto.sellerId
          ? `${filterDto.sellerId.substring(0, 8)}...`
          : undefined,
      };

      this.logger.log(
        `Finding orders with filters: ${JSON.stringify(filterSummary)}`,
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
      this.logger.error(`Find orders failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find orders failed: ${error.message}`);
    }
  }

  /**
   * Find orders for a specific user
   * @param userId User ID
   * @param filterDto Additional filter criteria
   * @returns User's orders
   */
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
      this.logger.log(`Finding orders for user: ${userId}`);

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.order.findByUser',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(response.error.message);
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Find user orders failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find user orders failed: ${error.message}`);
    }
  }

  /**
   * Find a specific order by ID
   * @param id Order ID
   * @returns Order details
   */
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
      this.logger.log(`Finding order with ID: ${id}`);

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
      this.logger.error(`Find order failed: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find order failed: ${error.message}`);
    }
  }

  /**
   * Update an order
   * @param id Order ID
   * @param updateOrderDto Updated data
   * @returns Updated order
   */
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
      this.logger.log(`Updating order ${id}`);

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

  /**
   * Update order status
   * @param id Order ID
   * @param status New status
   * @param note Optional note about status change
   * @param updatedBy ID of user updating status
   * @returns Updated order
   */
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
      this.logger.log(`Updating order ${id} status to ${status}`);

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

  /**
   * Cancel an order
   * @param id Order ID
   * @param reason Cancellation reason
   * @param userId ID of user cancelling order
   * @returns Cancelled order
   */
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
      this.logger.log(`Cancelling order ${id} with reason: ${reason}`);

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

  /**
   * Delete an order (admin only)
   * @param id Order ID
   * @returns Deleted order
   */
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
      this.logger.log(`Deleting order ${id}`);

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
