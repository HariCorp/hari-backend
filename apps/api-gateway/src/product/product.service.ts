// apps/api-gateway/src/product/product.service.ts
import { CreateProductDto, FilterProductDto, KafkaProducerService, UpdateProductDto } from '@app/common';
import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async create(createProductDto: CreateProductDto, user: any) {
    // Đảm bảo userId được đặt đúng là người đang tạo sản phẩm
    createProductDto.userId = new Types.ObjectId(user.userId);
    
    const command = {
      data: createProductDto,
      metadata: {
        id: `api-${Date.now()}`,
        correlationId: `api-${Date.now()}`,
        timestamp: Date.now(),
        source: 'api-gateway',
        type: 'command',
        user
      }
    };
    
    try {
      this.logger.log(`Sending create product command: ${JSON.stringify(createProductDto)}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.create',
        command
      );
      
      if (response.status === 'error') {
        throw new BadRequestException(response.error.message || 'Failed to create product');
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
      const query = {
        filter: filterDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query'
        }
      };
      
      this.logger.log(`Sending find all products query with filters: ${JSON.stringify(filterDto)}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findAll',
        query
      );
      
      if (response.status === 'error') {
        throw new BadRequestException(response.error.message || 'Failed to find products');
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
          type: 'query'
        }
      };
      
      this.logger.log(`Sending find product by ID query: ${id}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findById',
        query
      );
      
      if (response.status === 'error') {
        if (response.error.code === 'NOT_FOUND') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
        throw new BadRequestException(response.error.message || 'Failed to find product');
      }
      
      return response.data;
    } catch (error) {
      this.logger.error(`Find product failed: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
      
      // Kiểm tra quyền sở hữu - cần thiết cho "own" permission checks
      // Chúng ta cũng cho phép admin và super admin cập nhật bất kỳ sản phẩm nào
      const isOwner = product.userId.toString() === user.userId;
      const isAdmin = user.roles.includes('admin') || user.roles.includes('super_admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to update this product');
      }
      
      // Gửi lệnh cập nhật sản phẩm
      const command = {
        id,
        data: updateProductDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user
        }
      };
      
      this.logger.log(`Sending update product command for ID ${id}: ${JSON.stringify(updateProductDto)}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.update',
        command
      );
      
      if (response.status === 'error') {
        throw new BadRequestException(response.error.message || 'Failed to update product');
      }
      
      return response.data;
    } catch (error) {
      this.logger.error(`Update product failed: ${error.message}`);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
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
      
      // Kiểm tra quyền sở hữu - cần thiết cho "own" permission checks
      // Chúng ta cũng cho phép admin và super admin xóa bất kỳ sản phẩm nào
      const isOwner = product.userId.toString() === user.userId;
      const isAdmin = user.roles.includes('admin') || user.roles.includes('super_admin');
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to delete this product');
      }
      
      // Gửi lệnh xóa sản phẩm
      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
          user
        }
      };
      
      this.logger.log(`Sending delete product command for ID ${id}`);
      
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.delete',
        command
      );
      
      if (response.status === 'error') {
        throw new BadRequestException(response.error.message || 'Failed to delete product');
      }
      
      return response.data;
    } catch (error) {
      this.logger.error(`Delete product failed: ${error.message}`);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Delete product failed: ${error.message}`);
    }
  }
}