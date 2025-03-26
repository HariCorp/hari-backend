// libs/common/src/casl/policies/product-policies.ts
import { Action } from '../enums/action.enum';
import { AppAbility } from '../casl-ability.factory';
import { IPolicyHandler } from '../decorators/check-policies.decorator';
import { Product } from 'apps/api-gateway/src/product/schemas/product.schema';
import { Types } from 'mongoose';

export class ReadProductPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    const result = ability.can(Action.Read, Product);
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - ReadProductPolicy check:`, result);
    return result;
  }

  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const match = stack?.match(/:(\d+):/);
    return match ? parseInt(match[1]) : 0;
  }
}

export class CreateProductPolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    const result = ability.can(Action.Create, Product);
    console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - CreateProductPolicy check:`, result);
    return result;
  }

  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const match = stack?.match(/:(\d+):/);
    return match ? parseInt(match[1]) : 0;
  }
}

export class UpdateProductPolicyHandler implements IPolicyHandler {
  constructor(private readonly productId?: string) {}

  // Bỏ async để khớp với IPolicyHandler
  handle(ability: AppAbility, params?: any): boolean {
    let result;

    // Nếu productId được cung cấp khi khởi tạo
    if (this.productId) {
      // Tạo đối tượng Product và ép kiểu để có _id
      const productToCheck: Product & { _id: Types.ObjectId } = new Product() as Product & { _id: Types.ObjectId };
      productToCheck._id = new Types.ObjectId(this.productId);
      result = ability.can(Action.Update, productToCheck);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - UpdateProductPolicy check (productId from constructor: ${this.productId}):`, result);
    }
    // Hoặc lấy từ params nếu có
    else if (params && params.id) {
      const productToCheck: Product & { _id: Types.ObjectId } = new Product() as Product & { _id: Types.ObjectId };
      productToCheck._id = new Types.ObjectId(params.id);
      result = ability.can(Action.Update, productToCheck);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - UpdateProductPolicy check (productId from params: ${params.id}):`, result);
    }
    // Mặc định kiểm tra quyền chung
    else {
      result = ability.can(Action.Update, Product);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - UpdateProductPolicy check (default):`, result);
    }

    return result;
  }

  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const match = stack?.match(/:(\d+):/);
    return match ? parseInt(match[1]) : 0;
  }
}

export class DeleteProductPolicyHandler implements IPolicyHandler {
  constructor(private readonly productId?: string) {}

  // Bỏ async để khớp với IPolicyHandler
  handle(ability: AppAbility, params?: any): boolean {
    let result;

    // Nếu productId được cung cấp khi khởi tạo
    if (this.productId) {
      const productToCheck: Product & { _id: Types.ObjectId } = new Product() as Product & { _id: Types.ObjectId };
      productToCheck._id = new Types.ObjectId(this.productId);
      result = ability.can(Action.Delete, productToCheck);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - DeleteProductPolicy check (productId from constructor: ${this.productId}):`, result);
    }
    // Hoặc lấy từ params nếu có
    else if (params && params.id) {
      const productToCheck: Product & { _id: Types.ObjectId } = new Product() as Product & { _id: Types.ObjectId };
      productToCheck._id = new Types.ObjectId(params.id);
      result = ability.can(Action.Delete, productToCheck);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - DeleteProductPolicy check (productId from params: ${params.id}):`, result);
    }
    // Mặc định kiểm tra quyền chung
    else {
      result = ability.can(Action.Delete, Product);
      console.log(`[${new Date().toLocaleTimeString()}] 🔍 [libs/common/src/casl/policies/product-policies.ts:${this.getLineNumber()}] - DeleteProductPolicy check (default):`, result);
    }

    return result;
  }

  private getLineNumber(): number {
    const error = new Error();
    const stack = error.stack?.split('\n')[2];
    const match = stack?.match(/:(\d+):/);
    return match ? parseInt(match[1]) : 0;
  }
}