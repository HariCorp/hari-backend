import { Controller, Get } from '@nestjs/common';
import { ProductServiceService } from './product-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateProductCommand, KafkaMessageHandler } from '@app/common';

@Controller()
export class ProductServiceController {
  constructor(private readonly productServiceService: ProductServiceService) {}

  @MessagePattern('ms.product.create')
  async createProduct(command: CreateProductCommand) {
  console.log("🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:11 ~ command:", command)
    try {
      const product = await this.productServiceService.create(command.data);
      console.log("🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:14 ~ product:", product)
      return {
        status:'success',
        data: product
      }
    } catch (error) {
      console.log("🔍 ~ createProduct ~ hari-backend/apps/product-service/src/product-service.controller.ts:20 ~ error:", error)
      return {
        status: 'error',
        error: {
          code: error.name || 'CREATE_PRODUCT_ERROR',
          message: error.message
        }
      }
    }
  }
}
