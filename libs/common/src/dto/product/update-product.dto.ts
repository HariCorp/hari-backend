// libs/common/src/dto/product/update-product.dto.ts
import { Type } from 'class-transformer';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray, 
  IsBoolean, 
  IsDate, 
  IsMongoId,
  Min,
  Max
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialStock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsMongoId()
  @IsOptional()
  category?: Types.ObjectId | string;

  @IsMongoId()
  @IsOptional()
  seller?: Types.ObjectId | string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  closingTime?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}