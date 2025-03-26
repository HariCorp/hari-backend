// libs/common/src/dto/product/filter-product.dto.ts
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsMongoId,
  IsDate,
  Min,
  Max
} from 'class-validator';
import { Types } from 'mongoose';

export class FilterProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  minDiscountPercentage?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  hasStock?: boolean;

  @IsMongoId()
  @IsOptional()
  category?: Types.ObjectId | string;

  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId | string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  closingBefore?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  closingAfter?: Date;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

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

  // Sorting options
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}