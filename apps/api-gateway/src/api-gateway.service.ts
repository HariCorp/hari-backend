// apps/api-gateway/src/api-gateway.service.ts
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService } from '@app/common';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CreateUserDto,
  UpdateUserDto,
  FilterUserDto,
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  LoginDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  CompletionDto,
} from '@app/common/dto';

@Injectable()
export class ApiGatewayService implements OnModuleInit {
  private readonly logger = new Logger(ApiGatewayService.name);

  constructor(
    private readonly kafkaProducer: KafkaProducerService,
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log(
      'API Gateway Kafka client connected and subscribed to response topics',
    );
  }

  getHello(): string {
    return 'Hello from API Gateway!';
  }

  // User methods
  async createUser(createUserDto: CreateUserDto) {
    try {
      const command = {
        data: createUserDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending create user command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.create',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create user',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Create user failed: ${error.message}`);
      throw new BadRequestException(`Create user failed: ${error.message}`);
    }
  }

  async findAllUsers(filterDto: FilterUserDto) {
    try {
      const command = {
        data: filterDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log('Sending find all users query');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findAll',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find users',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find all users failed: ${error.message}`);
      throw new BadRequestException(`Find all users failed: ${error.message}`);
    }
  }

  async findUserById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find user by ID query for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.findById',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find user',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find user by ID failed: ${error.message}`);
      throw new BadRequestException(`Find user by ID failed: ${error.message}`);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const command = {
        id,
        data: updateUserDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Sending update user command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.update',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to update user',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Update user failed: ${error.message}`);
      throw new BadRequestException(`Update user failed: ${error.message}`);
    }
  }

  async deleteUser(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Sending delete user command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.delete',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to delete user',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Delete user failed: ${error.message}`);
      throw new BadRequestException(`Delete user failed: ${error.message}`);
    }
  }

  async authenticate(username: string, password: string) {
    try {
      const command = {
        data: { username, password },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending authenticate command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.user.authenticate',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Authentication failed',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new BadRequestException(`Authentication failed: ${error.message}`);
    }
  }

  // Auth methods
  async login(loginDto: LoginDto, res: Response) {
    try {
      const command = {
        data: loginDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending login command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.login',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Login failed',
        );
      }

      // Set cookies
      res.cookie('access_token', response.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', response.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new BadRequestException(`Login failed: ${error.message}`);
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const command = {
        data: createUserDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending register command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.register',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Registration failed',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`);
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const command = {
        data: {
          refresh_token: req.cookies.refresh_token,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending logout command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.logout',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Logout failed',
        );
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return response.data;
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
      throw new BadRequestException(`Logout failed: ${error.message}`);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const command = {
        data: {
          refresh_token: req.cookies.refresh_token,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending refresh token command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.refresh',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Token refresh failed',
        );
      }

      // Set new cookies
      res.cookie('access_token', response.data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refresh_token', response.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new BadRequestException(`Token refresh failed: ${error.message}`);
    }
  }

  async getProfile(userId: string) {
    try {
      const command = {
        id: userId,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting profile for user ID: ${userId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.auth.getProfile',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to get profile',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Get profile failed: ${error.message}`);
      throw new BadRequestException(`Get profile failed: ${error.message}`);
    }
  }

  // Product methods
  async createProduct(createProductDto: CreateProductDto, user: any) {
    try {
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

      this.logger.log(`User ${user.username} is creating a product`);
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
      throw new BadRequestException(`Create product failed: ${error.message}`);
    }
  }

  async findAllProducts(filterDto: FilterProductDto) {
    try {
      const command = {
        data: filterDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(
        `Getting all products with filters: ${JSON.stringify(filterDto)}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findAll',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find products',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find all products failed: ${error.message}`);
      throw new BadRequestException(`Find all products failed: ${error.message}`);
    }
  }

  async findOneProduct(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting product with ID: ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findById',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find product',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find product failed: ${error.message}`);
      throw new BadRequestException(`Find product failed: ${error.message}`);
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

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

      this.logger.log(`User ${user.username} is updating product ${id}`);
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
      throw new BadRequestException(`Update product failed: ${error.message}`);
    }
  }

  async removeProduct(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

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

      this.logger.log(`User ${user.username} is deleting product ${id}`);
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
      throw new BadRequestException(`Delete product failed: ${error.message}`);
    }
  }

  async findProductsByCategory(categoryId: string, filterDto: FilterProductDto) {
    try {
      const command = {
        data: {
          ...filterDto,
          category: categoryId,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting products for category: ${categoryId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findByCategory',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find products by category',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find products by category failed: ${error.message}`);
      throw new BadRequestException(
        `Find products by category failed: ${error.message}`,
      );
    }
  }

  async findProductsByUser(userId: string, filterDto: FilterProductDto) {
    try {
      const command = {
        data: {
          ...filterDto,
          userId: userId,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Getting products for user: ${userId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findByUser',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find products by user',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find products by user failed: ${error.message}`);
      throw new BadRequestException(
        `Find products by user failed: ${error.message}`,
      );
    }
  }

  async findProductsByTags(tags: string[], filterDto: FilterProductDto) {
    try {
      const command = {
        data: {
          ...filterDto,
          tags,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Searching products by tags: ${tags?.join(', ')}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.findByTags',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find products by tags',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find products by tags failed: ${error.message}`);
      throw new BadRequestException(
        `Find products by tags failed: ${error.message}`,
      );
    }
  }

  async searchProducts(query: string, filterDto: FilterProductDto) {
    try {
      const command = {
        data: {
          ...filterDto,
          search: query,
        },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Searching products with query: ${query}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.search',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to search products',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Search products failed: ${error.message}`);
      throw new BadRequestException(`Search products failed: ${error.message}`);
    }
  }

  async toggleProductActive(id: string, user: any) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid product ID format');
      }

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

      this.logger.log(
        `User ${user.username} is toggling active status for product ${id}`,
      );
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.product.toggleActive',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to toggle product active status',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Toggle product active status failed: ${error.message}`);
      throw new BadRequestException(
        `Toggle product active status failed: ${error.message}`,
      );
    }
  }

  // Category methods
  async createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      const command = {
        data: createCategoryDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending create category command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.create',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create category',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Create category failed: ${error.message}`);
      throw new BadRequestException(`Create category failed: ${error.message}`);
    }
  }

  async findAllCategories(query: any) {
    try {
      const command = {
        data: query,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log('Sending find all categories query');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.findAll',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find categories',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find all categories failed: ${error.message}`);
      throw new BadRequestException(`Find all categories failed: ${error.message}`);
    }
  }

  async getRootCategories() {
    try {
      const command = {
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log('Sending get root categories query');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.getRootCategories',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to get root categories',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Get root categories failed: ${error.message}`);
      throw new BadRequestException(`Get root categories failed: ${error.message}`);
    }
  }

  async findOneCategory(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid category ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find category by ID query for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.findById',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find category',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find category by ID failed: ${error.message}`);
      throw new BadRequestException(`Find category by ID failed: ${error.message}`);
    }
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid category ID format');
      }

      const command = {
        id,
        data: updateCategoryDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Sending update category command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.update',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to update category',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Update category failed: ${error.message}`);
      throw new BadRequestException(`Update category failed: ${error.message}`);
    }
  }

  async removeCategory(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid category ID format');
      }

      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Sending delete category command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.delete',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to delete category',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Delete category failed: ${error.message}`);
      throw new BadRequestException(`Delete category failed: ${error.message}`);
    }
  }

  async getDirectChildren(parentId?: string) {
    try {
      const command = {
        data: { parentId },
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending get direct children query for parent ID ${parentId}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.category.getDirectChildren',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to get direct children',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Get direct children failed: ${error.message}`);
      throw new BadRequestException(`Get direct children failed: ${error.message}`);
    }
  }

  // AI methods
  async createApiKey(createApiKeyDto: CreateApiKeyDto) {
    try {
      const command = {
        data: createApiKeyDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending create API key command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.createApiKey',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create API key',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Create API key failed: ${error.message}`);
      throw new BadRequestException(`Create API key failed: ${error.message}`);
    }
  }

  async findAllApiKeys() {
    try {
      const command = {
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log('Sending find all API keys query');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.findAllApiKeys',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find API keys',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find all API keys failed: ${error.message}`);
      throw new BadRequestException(`Find all API keys failed: ${error.message}`);
    }
  }

  async findOneApiKey(id: string) {
    try {
      const command = {
        id,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'query',
        },
      };

      this.logger.log(`Sending find API key by ID query for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.findOneApiKey',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to find API key',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Find API key by ID failed: ${error.message}`);
      throw new BadRequestException(`Find API key by ID failed: ${error.message}`);
    }
  }

  async updateApiKey(id: string, updateApiKeyDto: UpdateApiKeyDto) {
    try {
      const command = {
        id,
        data: updateApiKeyDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log(`Sending update API key command for ID ${id}`);
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.updateApiKey',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to update API key',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Update API key failed: ${error.message}`);
      throw new BadRequestException(`Update API key failed: ${error.message}`);
    }
  }

  async createCompletion(completionDto: CompletionDto) {
    try {
      const command = {
        data: completionDto,
        metadata: {
          id: `api-${Date.now()}`,
          correlationId: `api-${Date.now()}`,
          timestamp: Date.now(),
          source: 'api-gateway',
          type: 'command',
        },
      };

      this.logger.log('Sending create completion command');
      const response = await this.kafkaProducer.sendAndReceive<any, any>(
        'ms.ai.createCompletion',
        command,
      );

      if (response.status === 'error') {
        throw new BadRequestException(
          response.error.message || 'Failed to create completion',
        );
      }
      return response.data;
    } catch (error) {
      this.logger.error(`Create completion failed: ${error.message}`);
      throw new BadRequestException(`Create completion failed: ${error.message}`);
    }
  }
}
