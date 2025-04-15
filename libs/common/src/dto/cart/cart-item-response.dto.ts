import { Expose, Type } from 'class-transformer';
import { ProductResponseDto } from '../product/product-response.dto';

export class CartItemResponseDto {
  @Expose()
  _id: string;

  @Expose()
  userId: string;

  @Expose()
  productId: string;

  @Expose()
  quantity: number;

  @Expose()
  @Type(() => ProductResponseDto)
  product: ProductResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
} 