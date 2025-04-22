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
} from 'class-validator';
import { OrderItem } from './order.schema';

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

  @IsNotEmpty()
  @IsArray()
  @IsEnum(OrderItem, { each: true })
  items: OrderItem[];

  @IsNotEmpty()
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @IsNotEmpty()
  @IsDate()
  estimatedDeliveryDate: Date;

  @IsString()
  note?: string;

  @IsString()
  couponCode?: string;
}

export class UpdateOrderDto {}
