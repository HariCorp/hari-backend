// apps/api-gateway/src/product/product.service.ts
import {
  CreateProductDto,
  FilterProductDto,
  KafkaProducerService,
  UpdateProductDto,
} from '@app/common';
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

  async create(createProductDto: CreateProductDto, user: any) {
    // Set userId to the user creating the product
    createProductDto.userId = new Types.ObjectId(user.userId);

    const command = {
      data: createProductDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
        user,
      },
    };

    try {
      this.logger.log(
        `Sending create product command: ${JSON.stringify(createProductDto)}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.create',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create product',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Create product failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Create product failed: ${error.message}`);
    }
  }

  async findAll(filterDto: FilterProductDto = {}) {
    try {
      // Clean and prepare the filter object to ensure proper type conversion
      const preparedFilter = this.prepareFilterObject(filterDto);

      const query = {
        filter: preparedFilter,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(
        `Sending find all products query with filters: ${JSON.stringify(preparedFilter)}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findAll',
        query,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find products',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Find products failed: ${error.message}`);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(`Find products failed: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

      const query = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find product by ID query: ${id}`);

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findById',
        query,
      );

      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
        throw new BadRequestException(
          response.error.message || 'Failed to find product',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Find product failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(`Find product failed: ${error.message}`);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: any) {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

      // First, check if the product exists and belongs to the user
      const product = await this.findOne(id);

      // Check ownership - required for "own" permission checks
      // We also allow admins and super admins to update any product
      const isOwner = product.userId.toString() === user.userId;
      const isAdmin =
        user.roles.includes('admin') || user.roles.includes('super_admin');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'You do not have permission to update this product',
        );
      }

      // Send update product command
      const command = {
        id,
        data: updateProductDto,
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
        `Sending update product command for ID ${id}: ${JSON.stringify(updateProductDto)}`,
      );

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.update',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to update product',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Update product failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(`Update product failed: ${error.message}`);
    }
  }

  async remove(id: string, user: any) {
    try {
      // Validate ObjectId format
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

      // First, check if the product exists and belongs to the user
      const product = await this.findOne(id);

      // Check ownership - required for "own" permission checks
      // We also allow admins and super admins to delete any product
      const isOwner = product.userId.toString() === user.userId;
      const isAdmin =
        user.roles.includes('admin') || user.roles.includes('super_admin');

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'You do not have permission to delete this product',
        );
      }

      // Send delete product command
      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user,
        },
      };

      this.logger.log(`Sending delete product command for ID ${id}`);

      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.delete',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to delete product',
        );
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Delete product failed: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException(`Delete product failed: ${error.message}`);
    }
  }

  /**
   * Prepare filter object by converting types and handling special cases
   */
  private prepareFilterObject(filter: FilterProductDto): FilterProductDto {
    const prepared: FilterProductDto = {};

    // Chỉ thêm các trường nếu chúng tồn tại và không phải null
    if (filter.name !== undefined && filter.name !== null) {
      prepared.name = filter.name;
    }
    if (filter.brand !== undefined && filter.brand !== null) {
      prepared.brand = filter.brand;
    }
    if (filter.search !== undefined && filter.search !== null) {
      prepared.search = filter.search;
    }
    if (filter.minPrice !== undefined && filter.minPrice !== null) {
      prepared.minPrice = Number(filter.minPrice);
    }
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) {
      prepared.maxPrice = Number(filter.maxPrice);
    }
    if (
      filter.minDiscountPercentage !== undefined &&
      filter.minDiscountPercentage !== null
    ) {
      prepared.minDiscountPercentage = Number(filter.minDiscountPercentage);
    }
    if (filter.hasStock !== undefined && filter.hasStock !== null) {
      prepared.hasStock =
        typeof filter.hasStock === 'string'
          ? filter.hasStock === 'true'
          : filter.hasStock;
    }
    if (filter.category !== undefined && filter.category !== null) {
      prepared.category = filter.category;
    }
    if (filter.userId !== undefined && filter.userId !== null) {
      prepared.userId = filter.userId;
    }
    if (filter.closingBefore !== undefined && filter.closingBefore !== null) {
      prepared.closingBefore =
        typeof filter.closingBefore === 'string'
          ? new Date(filter.closingBefore)
          : filter.closingBefore;
    }
    if (filter.closingAfter !== undefined && filter.closingAfter !== null) {
      prepared.closingAfter =
        typeof filter.closingAfter === 'string'
          ? new Date(filter.closingAfter)
          : filter.closingAfter;
    }
    if (filter.isActive !== undefined && filter.isActive !== null) {
      prepared.isActive =
        typeof filter.isActive === 'string'
          ? filter.isActive === 'true'
          : filter.isActive;
    }
    if (filter.tags !== undefined && filter.tags !== null) {
      prepared.tags =
        typeof filter.tags === 'string'
          ? filter.tags.split(',').map((tag) => tag.trim())
          : filter.tags;
    }
    if (filter.page !== undefined && filter.page !== null) {
      prepared.page = Number(filter.page);
    }
    if (filter.limit !== undefined && filter.limit !== null) {
      prepared.limit = Number(filter.limit);
    }
    if (filter.sortBy !== undefined && filter.sortBy !== null) {
      prepared.sortBy = filter.sortBy;
    }
    if (filter.sortOrder !== undefined && filter.sortOrder !== null) {
      prepared.sortOrder = filter.sortOrder;
    }

    return prepared;
  }
}
