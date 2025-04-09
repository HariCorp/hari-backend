import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Types } from 'mongoose';

export class FilterCartDto {
  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId | string;

  @IsMongoId()
  @IsOptional()
  productId?: Types.ObjectId | string;

  // Pagination options
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
} 