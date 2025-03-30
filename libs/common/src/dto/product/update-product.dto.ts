// @app/common/dto/product/update-product.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsMongoId,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsMongoId()
  category?: Types.ObjectId | string;

  @IsOptional()
  @IsDateString()
  closingTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
