import { Command } from '@app/common/kafka';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCartItemDto {
  @IsMongoId({ message: 'ProductId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  productId: Types.ObjectId;

  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty()
  quantity: number;

  @IsMongoId({ message: 'UserId must be a valid MongoDB ObjectId' })
  @IsOptional()
  userId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  note?: string;

  constructor(partial: Partial<CreateCartItemDto>) {
    Object.assign(this, partial);
  }
}

export class CreateCartItemCommand extends Command {
  constructor(
    public readonly data: CreateCartItemDto,
    metadata?: any,
  ) {
    super(metadata);
  }
} 