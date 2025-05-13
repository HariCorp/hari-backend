import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateOrderDto,
  FilterOrderDto,
  KafkaProducerService,
  Order,
  OrderDocument,
  UpdateOrderDto,
} from '@app/common';
import { OrderStatus, PaymentStatus } from '@app/common/enums';
import { v4 as uuidv4 } from 'uuid';

// Extend OrderDocument to include virtuals like canBeCancelled
interface OrderDocumentWithVirtuals extends OrderDocument {
  canBeCancelled: boolean;
}

@Injectable()
export class OrderServiceService {
  private readonly logger = new Logger(OrderServiceService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  /**
   * Create a new order
   * @param createOrderDto Data to create an order
   * @returns Created order
   */
  async createOrder(createOrderDto: CreateOrderDto) {
    try {
      this.logger.log(
        `Creating order for user: ${createOrderDto.userId}, seller: ${createOrderDto.sellerId}`,
      );

      // Generate unique order number if not provided
      const orderNumber = createOrderDto.orderNumber || uuidv4();
      createOrderDto.orderNumber = orderNumber;

      // Validate order items
      if (!createOrderDto.items || createOrderDto.items.length === 0) {
        throw new BadRequestException('Order must contain at least one item');
      }

      // Create order
      const order = await this.orderModel.create(createOrderDto);

      // Emit order created event
      await this.kafkaProducer.send('ms.order.created', {
        orderId: order._id.toString(),
        userId: order.userId,
        sellerId: order.sellerId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      });

      this.logger.log(`Order created successfully: ${order.orderNumber}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all orders with optional filtering
   * @param filterDto Filter criteria
   * @returns List of orders
   */
  async findAll(filterDto: FilterOrderDto) {
    try {
      const {
        userId,
        sellerId,
        status,
        paymentStatus,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filterDto;

      this.logger.log(
        `Finding orders with filters: ${JSON.stringify(filterDto)}`,
      );

      const filterQuery: any = {};
      if (userId) filterQuery.userId = userId;
      if (sellerId) filterQuery.sellerId = sellerId;
      if (status) filterQuery.status = status;
      if (paymentStatus) filterQuery.paymentStatus = paymentStatus;

      const skip = (page - 1) * limit;
      const sort: { [key: string]: 1 | -1 } = {
        [sortBy]: sortOrder === 'desc' ? -1 : 1,
      }; // Explicitly typed sort object

      const [orders, total] = await Promise.all([
        this.orderModel
          .find(filterQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.orderModel.countDocuments(filterQuery),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Found ${orders.length} orders out of ${total} total`);

      return {
        orders,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error(`Failed to find orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find orders for a specific user
   * @param userId User ID
   * @param filterDto Additional filters
   * @returns User's orders
   */
  async findByUser(userId: string, filterDto: FilterOrderDto) {
    try {
      this.logger.log(`Finding orders for user: ${userId}`);
      const updatedFilter = { ...filterDto, userId };
      return await this.findAll(updatedFilter);
    } catch (error) {
      this.logger.error(`Failed to find user orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find an order by ID
   * @param id Order ID
   * @returns Order details
   */
  async findOne(id: string) {
    try {
      this.logger.log(`Finding order with ID: ${id}`);
      const order = await this.orderModel.findById(id).exec();
      if (!order) {
        throw new NotFoundException(`Order with id ${id} not found`);
      }
      return order;
    } catch (error) {
      this.logger.error(`Failed to find order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an order
   * @param id Order ID
   * @param updateOrderDto Update data
   * @returns Updated order
   */
  async update(id: string, updateOrderDto: UpdateOrderDto) {
    try {
      this.logger.log(`Updating order: ${id}`);
      const order = await this.orderModel
        .findByIdAndUpdate(id, updateOrderDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!order) {
        throw new NotFoundException(`Order with id ${id} not found`);
      }

      // Emit order updated event
      await this.kafkaProducer.send('ms.order.updated', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        updatedFields: Object.keys(updateOrderDto),
      });

      this.logger.log(`Order updated successfully: ${order.orderNumber}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to update order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order status
   * @param id Order ID
   * @param status New status
   * @param note Optional note
   * @param updatedBy User ID who updated
   * @returns Updated order
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
  ) {
    try {
      this.logger.log(`Updating order ${id} status to ${status}`);
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with id ${id} not found`);
      }

      // Validate status transition
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.CREATED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELED], // Adjusted: CREATED can transition to CONFIRMED
        [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELED], // Added CONFIRMED state
        [OrderStatus.SHIPPING]: [OrderStatus.SHIPPED, OrderStatus.CANCELED],
        [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.RETURNED],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELED]: [],
        [OrderStatus.REFUNDED]: [],
        [OrderStatus.RETURNED]: [OrderStatus.REFUNDED],
        [OrderStatus.FAILED]: [],
      };

      if (
        status !== order.status &&
        !validTransitions[order.status]?.includes(status)
      ) {
        throw new BadRequestException(
          `Invalid status transition from ${order.status} to ${status}`,
        );
      }

      // Update status and add to status history
      order.status = status;
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        note: note || `Status changed to ${status}`,
        updatedBy,
      });

      // Update payment status if applicable
      if (status === OrderStatus.REFUNDED) {
        order.paymentStatus = PaymentStatus.REFUNDED;
      } else if (status === OrderStatus.COMPLETED) {
        order.paymentStatus = PaymentStatus.COMPLETED;
      }

      await order.save();

      // Emit order status updated event
      await this.kafkaProducer.send('ms.order.status.updated', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        newStatus: status,
        note,
        updatedBy,
      });

      this.logger.log(
        `Order status updated successfully: ${order.orderNumber}`,
      );
      return order;
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel an order
   * @param id Order ID
   * @param reason Cancellation reason
   * @param userId User who cancelled
   * @returns Cancelled order
   */
  async cancelOrder(id: string, reason: string, userId: string) {
    try {
      this.logger.log(`Cancelling order ${id} with reason: ${reason}`);
      const order = await this.orderModel.findById(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with id ${id} not found`);
      }

      // Access canBeCancelled virtual property
      const orderWithVirtuals = order.toObject() as OrderDocumentWithVirtuals;
      if (!orderWithVirtuals.canBeCancelled) {
        throw new BadRequestException(
          `Cannot cancel order with status: ${order.status}`,
        );
      }

      // Update status to CANCELED and add to status history
      order.status = OrderStatus.CANCELED;
      order.statusHistory.push({
        status: OrderStatus.CANCELED,
        timestamp: new Date(),
        note: `Order cancelled: ${reason}`,
        updatedBy: userId,
      });

      await order.save();

      // Emit order cancelled event
      await this.kafkaProducer.send('ms.order.cancelled', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reason,
        cancelledBy: userId,
      });

      this.logger.log(`Order cancelled successfully: ${order.orderNumber}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete an order
   * @param id Order ID
   * @returns Deletion result
   */
  async delete(id: string) {
    try {
      this.logger.log(`Deleting order ${id}`);
      const order = await this.orderModel.findByIdAndDelete(id).exec();

      if (!order) {
        throw new NotFoundException(`Order with id ${id} not found`);
      }

      // Emit order deleted event
      await this.kafkaProducer.send('ms.order.deleted', {
        orderId: id,
        orderNumber: order.orderNumber,
      });

      this.logger.log(`Order deleted successfully: ${order.orderNumber}`);
      return { message: 'Order deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete order: ${error.message}`);
      throw error;
    }
  }
}
