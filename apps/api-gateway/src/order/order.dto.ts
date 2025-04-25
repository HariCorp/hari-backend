import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from '@app/common/enums';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsNumber()
  shippingFee: number;

  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

  @IsNotEmpty()
  @IsNumber()
  totalAmount: number;

  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNotEmpty()
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @IsNotEmpty()
  @IsDate()
  estimatedDeliveryDate: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsString()
  @IsOptional()
  orderNumber?: string;
}

export class UpdateOrderDto {}

class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsNumber()
  totalPrice: number;
}
