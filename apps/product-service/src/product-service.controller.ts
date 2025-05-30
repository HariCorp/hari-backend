// apps/product-service/src/product-service.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductServiceService } from './product-service.service';
import { CategoryService } from './category-service.service';
import { CreateProductCommand, UpdateProductDto } from '@app/common';

@Controller()
export class ProductServiceController {
  constructor(
    private readonly productServiceService: ProductServiceService,
    private readonly categoryService: CategoryService,
  ) {}

  @MessagePattern('ms.product.create')
  async createProduct(command: CreateProductCommand) {
    try {
      const product = await this.productServiceService.create(command.data);
      return { status: 'success', data: product };
    } catch (error) {
      console.log(`Failed to create product: ${error.message}`);
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
    try {
      const filter = command.filter;
      const response = await this.productServiceService.findAll(filter);
      return { status: 'success', data: response };
    } catch (error) {
      console.log(`Find all products failed: ${error.message}`, error.stack);
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

  @MessagePattern('ms.product.findById')
  async findOne(command) {
    try {
      const productId = command.data;
      const product = await this.productServiceService.findOne(productId);
      return { status: 'success', data: product };
    } catch (error) {
      console.log(`Failed to find product by ID: ${command.data}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_PRODUCT_BY_ID_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.product.update')
  async update(command: { id: string; data: UpdateProductDto }) {
    try {
      const product = await this.productServiceService.update(
        command.id,
        command.data,
      );
      return { status: 'success', data: product };
    } catch (error) {
      console.log(`Failed to update product: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'UPDATE_PRODUCT_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.product.delete')
  async delete(command: { id: string }) {
    try {
      const result = await this.productServiceService.remove(command.id);
      return { status: 'success', data: result };
    } catch (error) {
      console.log(`Failed to delete product: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'DELETE_PRODUCT_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.product.toggleActive')
  async toggleActiveProduct(command: { id: string }) {
    try {
      const product = await this.productServiceService.toggleActive(command.id);
      return { status: 'success', data: product };
    } catch (error) {
      console.log(
        `Failed to toggle active status of product: ${error.message}`,
      );
      return {
        status: 'error',
        error: {
          code: error.name || 'TOGGLE_ACTIVE_PRODUCT_ERROR',
          message: error.message,
        },
      };
    }
  }

  @MessagePattern('ms.product.findByIds')
  async findByIds(command) {
    try {
      const { productIds } = command.data;
      const products = await this.productServiceService.findByIds(productIds);
      return { status: 'success', data: products };
    } catch (error) {
      console.log(`Failed to find products by IDs: ${error.message}`);
      return {
        status: 'error',
        error: {
          code: error.name || 'FIND_PRODUCTS_BY_IDS_ERROR',
          message: error.message,
        },
      };
    }
  }

  // Các phương thức category giữ nguyên như trong code gốc
  @MessagePattern('ms.category.create')
  async createCategory(command: any) {
    try {
      const category = await this.categoryService.create(command.data);
      return { status: 'success', data: category };
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
      return { status: 'success', data: result };
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
      return { status: 'success', data: category };
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

  // @MessagePattern('ms.category.update')
  // async updateCategory(command: { id: string; data: UpdateCategoryDto }) {
  //   try {
  //     const category = await this.categoryService.update(command.id, command.data);
  //     return { status: 'success', data: category };
  //   } catch (error) {
  //     console.log(`Failed to update category: ${error.message}`);
  //     return {
  //       status: 'error',
  //       error: { code: error.name || 'UPDATE_CATEGORY_ERROR', message: error.message },
  //     };
  //   }
  // }

  @MessagePattern('ms.category.delete')
  async deleteCategory(command: { id: string }) {
    try {
      const category = await this.categoryService.remove(command.id);
      return {
        status: 'success',
        data: { message: 'Category deleted successfully', category },
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
  async getDirectChildren(@Payload() data: any) {
    return this.categoryService.getDirectChildren(data.data?.parentId);
  }

  @MessagePattern('ms.category.getLeafCategories')
  async getLeafCategories() {
    return this.categoryService.getLeafCategories();
  }
}
