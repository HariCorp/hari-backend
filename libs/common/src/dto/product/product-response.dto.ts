// libs/common/src/dto/product/product-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

export class CategoryDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;
}

export class SellerDto {
  @Expose()
  _id: string;

  @Expose()
  username: string;

  @Expose()
  email: string;
}

export class ProductResponseDto {
  @Expose()
  _id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  price: number;

  @Expose()
  discountPercentage: number;

  @Expose()
  stock: number;

  @Expose()
  initialStock: number;

  @Expose()
  sku?: string;

  @Expose()
  @Type(() => CategoryDto)
  category: CategoryDto;

  @Expose()
  @Type(() => SellerDto)
  userId: SellerDto;

  @Expose()
  closingTime?: Date;

  @Expose()
  images: string[];

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // Virtual property to calculate current discount
  @Expose()
  get finalPrice(): number {
    if (!this.discountPercentage) return this.price;
    return this.price * (1 - this.discountPercentage / 100);
  }

  // Virtual property to calculate availability status
  @Expose()
  get availabilityStatus(): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (this.stock <= 0) return 'out_of_stock';
    if (this.stock < 10) return 'low_stock';
    return 'in_stock';
  }
}

export class PaginatedProductResponseDto {
  @Expose()
  @Type(() => ProductResponseDto)
  items: ProductResponseDto[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;
}