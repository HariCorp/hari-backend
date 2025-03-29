import { Controller, Get } from '@nestjs/common';
import { ProductServiceService } from './product-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateProductCommand, KafkaMessageHandler } from '@app/common';
import { CategoryService } from './category-service.service';
import { UpdateCategoryDto } from '@app/common/dto/product/update-category.dto';

@Controller()
export class ProductServiceController {
  constructor(
    private readonly productServiceService: ProductServiceService,
    private readonly categoryService: CategoryService,
  ) {}

  @MessagePattern('ms.product.create')
  async createProduct(command: CreateProductCommand) {
    console.log(
      '🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:11 ~ command:',
      command,
    );
    try {
      const product = await this.productServiceService.create(command.data);
      console.log(
        '🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:14 ~ product:',
        product,
      );
      return {
        status: 'success',
        data: product,
      };
    } catch (error) {
      console.log(
        '🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:20 ~ error:',
        error,
      );
      return {
        status: 'error',
        error: {
          code: error.name || 'CREATE_PRODUCT_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.product.findAll')
  async findAll(command) {
    console.log(
      '[' +
        new Date().toLocaleTimeString() +
        '] 🔍 [hari-backend/apps/product-service/src/product-service.controller.ts:33] - ' +
        command,
    );
    try {
      const filter = command.filter;
      const response = await this.productServiceService.findAll(filter);
      return {
        status: 'success',
        data: response,
      };
    } catch (error) {
      console.log(
        '[' +
          new Date().toLocaleTimeString() +
          '] 🔍 [hari-backend/apps/product-service/src/product-service.controller.ts:42] - ' +
          error,
      );
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_ALL_PRODUCTS_ERROR',
          message: error.message,
          details: error.stack,
        },
      };
    }
  }

  @MessagePattern('ms.category.create')
  async createCategory(command: any) {
    try {
      const category = await this.categoryService.create(command.data);
      return {
        status: 'success',
        data: category,
      };
    } catch (error) {
      console.log(`Failed to create category: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'CREATE_CATEGORY_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.category.findAll')
  async findAllCategories(query: any = {}) {
    try {
      const result = await this.categoryService.findAll(query.filter);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      console.log(`Failed to find categories: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_CATEGORIES_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.category.findById')
  async findCategoryById(query: { id: string }) {
    try {
      const category = await this.categoryService.findOne(query.id);
      return {
        status: 'success',
        data: category,
      };
    } catch (error) {
      console.log(`Failed to find category: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_CATEGORY_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.category.update')
  async updateCategory(command: { id: string; data: UpdateCategoryDto }) {
    try {
      const category = await this.categoryService.update(
        command.id,
        command.data,
      );
      return {
        status: 'success',
        data: category,
      };
    } catch (error) {
      console.log(`Failed to update category: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_CATEGORY_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.category.delete')
  async deleteCategory(command: { id: string }) {
    try {
      const category = await this.categoryService.remove(command.id);
      return {
        status: 'success',
        data: {
          message: 'Category deleted successfully',
          category,
        },
      };
    } catch (error) {
      console.log(`Failed to delete category: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'DELETE_CATEGORY_ERROR',
          message: error.message,
        },
      };
    }
  }
  @MessagePattern('ms.category.getDirectChildren')
  async getDirectChildren(query: { parentId?: string }) {
    try {
      const parentId = query.parentId || null;
      const result = await this.categoryService.getDirectChildren(parentId);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      console.log(`Failed to get category children: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'GET_CATEGORY_CHILDREN_ERROR',
          message: error.message,
        },
      };
    }
  }
}
