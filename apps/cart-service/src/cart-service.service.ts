import {
  CreateCartItemDto,
  FilterCartDto,
  KafkaProducerService,
  MongoErrorCode,
  UpdateCartItemDto,
} from '@app/common';
import { CartItemCreatedEvent } from '@app/common/dto/cart/cart-item-created.event';
import { DuplicateKeyException } from '@app/common/exceptions/database.exception';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CartItem,
  CartItemDocument,
} from 'apps/api-gateway/src/cart/schemas/cart-item.schema';
import { FilterQuery, Types } from 'mongoose';
import { Model } from 'mongoose';
import { KafkaResponse } from '@app/common/kafka/interfaces/kafka-message.interface';
import { ProductResponseDto } from '@app/common/dto/product/product-response.dto';

export interface FindCartResponse {
  cartItems: CartItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class CartServiceService {
  private readonly logger = new Logger(CartServiceService.name);

  constructor(
    @InjectModel(CartItem.name) private cartItemModel: Model<CartItemDocument>,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async addItem(createCartItemDto: CreateCartItemDto) {
    try {
      // Check if product is already in cart
      const existingItem = await this.cartItemModel.findOne({
        userId: createCartItemDto.userId,
        productId: createCartItemDto.productId,
      });

      if (existingItem) {
        existingItem.quantity += createCartItemDto.quantity;
        await existingItem.save();
        return existingItem;
      }

      // Ensure required product information is provided
      if (!createCartItemDto.productName || !createCartItemDto.productPrice) {
        throw new Error(
          'Product name and price are required when adding to cart',
        );
      }

      const cartItem = await this.cartItemModel.create(createCartItemDto);

      await this.kafkaProducer.send(
        'ms.cart.item.created',
        new CartItemCreatedEvent(
          cartItem._id,
          cartItem.productId,
          cartItem.userId.toString(),
          cartItem.quantity,
        ),
      );

      return cartItem;
    } catch (error) {
      if (error.code === MongoErrorCode.DuplicateKey) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        const duplicateValue = error.keyValue[duplicateField];
        throw new DuplicateKeyException(duplicateField, duplicateValue);
      }
      throw error;
    }
  }

  async findUserCart(filter: FilterCartDto = {}): Promise<FindCartResponse> {
    try {
      const { page = 1, limit = 10, userId, productId } = filter;

      this.logger.log(
        `Finding cart items with filters: ${JSON.stringify(filter)}`,
      );

      const filterQuery: FilterQuery<CartItemDocument> = {};

      if (userId) {
        filterQuery.userId = userId.toString();
      }
      if (productId) {
        filterQuery.productId = new Types.ObjectId(productId.toString());
      }

      const skip = (page - 1) * limit;

      this.logger.debug(`Filter query: ${JSON.stringify(filterQuery)}`);
      this.logger.debug(`Skip: ${skip}, Limit: ${limit}`);

      const [cartItems, total] = await Promise.all([
        this.cartItemModel.find(filterQuery).skip(skip).limit(limit).exec(),
        this.cartItemModel.countDocuments(filterQuery),
      ]);

      // Get product details for all cart items
      const productIds = cartItems.map((item) => item.productId.toString());
      const productsResponse = await this.kafkaProducer.sendAndReceive<
        { data: { productIds: string[] }; metadata: any },
        KafkaResponse<ProductResponseDto[]>
      >('ms.product.findByIds', {
        data: { productIds },
        metadata: {
          id: `cart-${Date.now()}`,
          correlationId: `cart-${Date.now()}`,
          timestamp: Date.now(),
          source: 'cart-service',
          type: 'query',
        },
      });

      if (productsResponse.status === 'error') {
        throw new Error(
          `Failed to fetch product details: ${productsResponse.error?.message}`,
        );
      }

      const products = productsResponse.data || [];
      const productMap = new Map(products.map((p) => [p._id, p]));

      // Enrich cart items with product details
      const enrichedCartItems = cartItems.map((item) => {
        const itemObj = item.toObject() as any;
        // Keep only necessary fields and product details
        const { productName, productPrice, productId, ...rest } = itemObj;
        return {
          ...rest,
          product: productMap.get(item.productId.toString())
        };
      });

      const totalPages = Math.ceil(total / limit);
      this.logger.log(
        `Found ${cartItems.length} cart items out of ${total} total`,
      );

      return {
        cartItems: enrichedCartItems,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find cart items: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const cartItem = await this.cartItemModel
        .findOne({ _id: id, userId })
        .exec();
      if (!cartItem) {
        throw new NotFoundException(`Cart item not found with id: ${id}`);
      }
      return cartItem;
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: string,
    updateCartItemDto: UpdateCartItemDto,
    userId: string,
  ) {
    try {
      const cartItem = await this.cartItemModel
        .findOneAndUpdate({ _id: id, userId }, updateCartItemDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!cartItem) {
        throw new NotFoundException(`Cart item not found with id: ${id}`);
      }

      return cartItem;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      const cartItem = await this.cartItemModel
        .findOneAndDelete({ _id: id, userId })
        .exec();

      if (!cartItem) {
        throw new NotFoundException(`Cart item not found with id: ${id}`);
      }

      return { message: 'Cart item deleted successfully', cartItem };
    } catch (error) {
      throw error;
    }
  }

  async clearCart(userId: string) {
    try {
      const result = await this.cartItemModel.deleteMany({ userId }).exec();
      return {
        message: 'Cart cleared successfully',
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw error;
    }
  }
}
