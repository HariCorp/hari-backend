// apps/api-gateway/src/cart/cart.service.ts
import {
  CreateCartItemDto,
  FilterCartDto,
  KafkaProducerService,
  UpdateCartItemDto,
} from '@app/common';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async addToCart(createCartItemDto: CreateCartItemDto, user: any) {
    createCartItemDto.userId = new Types.ObjectId(user.userId);

    try {
      // First, get product details from product-service via Kafka
      const productQuery = {
        data: createCartItemDto.productId.toString(),
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
          user,
        },
      };

      const productResponse = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findById',
        productQuery,
      );

      if (productResponse.status === 'error') {
        throw new BadRequestException(
          productResponse.error.message || 'Failed to get product details',
        );
      }

      const product = productResponse.data;

      // Add product details to createCartItemDto
      createCartItemDto.productName = product.name;
      createCartItemDto.productPrice = product.price;
      if (product.images && product.images.length > 0) {
        createCartItemDto.productImage = product.images[0];
      }

      // Now send the command to cart service with product details
      const command = {
        data: createCartItemDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(
        `Sending add to cart command: ${JSON.stringify(createCartItemDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.addItem',
        command,
      );

      if (response.status === 'error') {
        if (response.error.code === 'DUPLICATE_KEY_ERROR') {
          throw new ConflictException(
            'Item already exists in cart. Use update to change quantity.',
          );
        }
        throw new BadRequestException(
          response.error.message || 'Failed to add item to cart',
        );
      }
      return { ...response.data, product };
    } catch (error) {
      this.logger.error(`Add to cart failed: ${error.message}`);
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Add to cart failed: ${error.message}`);
    }
  }

  async findUserCart(userId: string, filterDto: FilterCartDto = {}) {
    try {
      const query = {
        filter: { ...filterDto, userId },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find user cart query for user: ${userId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.findUserCart',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find cart items',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find cart failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find cart failed: ${error.message}`);
    }
  }

  async findCartItem(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid cart item ID format');
      }

      const query = {
        data: { id, userId: user.userId },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(
        `Sending find cart item query: ${id} for user: ${user.userId}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.findById',
        query,
      );

      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Cart item with ID ${id} not found`);
        }
        throw new BadRequestException(
          response.error.message || 'Failed to find cart item',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find cart item failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Find cart item failed: ${error.message}`);
    }
  }

  async updateCartItem(
    id: string,
    updateCartItemDto: UpdateCartItemDto,
    user: any,
  ) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid cart item ID format');
      }

      // First check if the cart item exists and belongs to the user
      await this.findCartItem(id, user);

      const command = {
        id,
        data: updateCartItemDto,
        userId: user.userId,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(
        `Sending update cart item command for ID ${id}: ${JSON.stringify(updateCartItemDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.updateItem',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to update cart item',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Update cart item failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Update cart item failed: ${error.message}`,
      );
    }
  }

  async removeCartItem(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid cart item ID format');
      }

      // First check if the cart item exists and belongs to the user
      await this.findCartItem(id, user);

      const command = {
        id,
        userId: user.userId,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(`Sending remove cart item command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.removeItem',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to remove cart item',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Remove cart item failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Remove cart item failed: ${error.message}`,
      );
    }
  }

  async clearCart(user: any) {
    try {
      const command = {
        userId: user.userId,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(`Sending clear cart command for user ${user.userId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.cart.clearCart',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to clear cart',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Clear cart failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Clear cart failed: ${error.message}`);
    }
  }
}
