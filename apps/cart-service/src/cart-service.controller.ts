import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CartServiceService } from './cart-service.service';
import { CreateCartItemDto, UpdateCartItemDto } from '@app/common';
import { OrderServiceService } from './order-service.service';
import { OrderStatus } from '@app/common/enums';

@Controller()
export class CartServiceController {
  constructor(
    private readonly cartServiceService: CartServiceService,
    private readonly OrderServiceService: OrderServiceService,
  ) {}

  @MessagePattern('ms.cart.addItem')
  async addToCart(command: { data: CreateCartItemDto }) {
    try {
      const cartItem = await this.cartServiceService.addItem(command.data);
      return { status: 'success', data: cartItem };
    } catch (error) {
      console.log(`Failed to add item to cart: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'ADD_TO_CART_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.cart.findUserCart')
  async findUserCart(command) {
    try {
      const filter = command.filter;
      const response = await this.cartServiceService.findUserCart(filter);
      return { status: 'success', data: response };
    } catch (error) {
      console.log(`Find user cart failed: ${error.message}`, error.stack);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_CART_ERROR',
          message: error.message,
          details: error.stack,
        },
      };
    }
  }

  @MessagePattern('ms.cart.findById')
  async findOne(command: { data: { id: string; userId: string } }) {
    try {
      const { id, userId } = command.data;
      const cartItem = await this.cartServiceService.findOne(id, userId);
      return { status: 'success', data: cartItem };
    } catch (error) {
      console.log(
        `Failed to find cart item by ID: ${JSON.stringify(command.data)}`,
      );
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_CART_ITEM_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.cart.updateItem')
  async update(command: {
    id: string;
    data: UpdateCartItemDto;
    userId: string;
  }) {
    try {
      const cartItem = await this.cartServiceService.update(
        command.id,
        command.data,
        command.userId,
      );
      return { status: 'success', data: cartItem };
    } catch (error) {
      console.log(`Failed to update cart item: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_CART_ITEM_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.cart.removeItem')
  async remove(command: { id: string; userId: string }) {
    try {
      const result = await this.cartServiceService.remove(
        command.id,
        command.userId,
      );
      return { status: 'success', data: result };
    } catch (error) {
      console.log(`Failed to remove cart item: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'REMOVE_CART_ITEM_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.cart.clearCart')
  async clearCart(command: { userId: string }) {
    try {
      const result = await this.cartServiceService.clearCart(command.userId);
      return { status: 'success', data: result };
    } catch (error) {
      console.log(`Failed to clear cart: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'CLEAR_CART_ERROR',
          message: error.message,
        },
      };
    }
  }

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

  @MessagePattern('ms.order.findAll')
  async findAllOrders(command) {
    try {
      const filter = command.data;
      const response = await this.OrderServiceService.findAll(filter);
      return { status: 'success', data: response };
    } catch (error) {
      console.log(`Failed to find all orders: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_ALL_ORDERS_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.findByUser')
  async findOrdersByUser(command: { data: { userId: string; filter: any } }) {
    try {
      const { userId, filter } = command.data;
      const response = await this.OrderServiceService.findByUser(
        userId,
        filter,
      );
      return { status: 'success', data: response };
    } catch (error) {
      console.log(`Failed to find orders for user: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_USER_ORDERS_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.findById')
  async findOrderById(command: { data: { id: string } }) {
    try {
      const { id } = command.data;
      const order = await this.OrderServiceService.findOne(id);
      return { status: 'success', data: order };
    } catch (error) {
      console.log(`Failed to find order by ID: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_ORDER_BY_ID_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.update')
  async updateOrder(command: { data: { id: string; updateData: any } }) {
    try {
      const { id, updateData } = command.data;
      const order = await this.OrderServiceService.update(id, updateData);
      return { status: 'success', data: order };
    } catch (error) {
      console.log(`Failed to update order: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_ORDER_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.updateStatus')
  async updateOrderStatus(command: {
    data: {
      id: string;
      status: OrderStatus;
      note?: string;
      updatedBy?: string;
    };
  }) {
    try {
      const { id, status, note, updatedBy } = command.data;
      const order = await this.OrderServiceService.updateStatus(
        id,
        status,
        note,
        updatedBy,
      );
      return { status: 'success', data: order };
    } catch (error) {
      console.log(`Failed to update order status: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_ORDER_STATUS_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.cancel')
  async cancelOrder(command: {
    data: { id: string; reason: string; userId: string };
  }) {
    try {
      const { id, reason, userId } = command.data;
      const order = await this.OrderServiceService.cancelOrder(
        id,
        reason,
        userId,
      );
      return { status: 'success', data: order };
    } catch (error) {
      console.log(`Failed to cancel order: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'CANCEL_ORDER_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.order.delete')
  async deleteOrder(command: { data: { id: string } }) {
    try {
      const { id } = command.data;
      const result = await this.OrderServiceService.delete(id);
      return { status: 'success', data: result };
    } catch (error) {
      console.log(`Failed to delete order: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'DELETE_ORDER_ERROR',
          message: error.message,
        },
      };
    }
  }
}
