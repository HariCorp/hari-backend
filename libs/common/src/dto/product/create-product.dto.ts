// libs/common/src/dto/product/create-product.dto.ts
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
  Max,
  ValidateNested,
  IsNotEmpty,
  ArrayMinSize
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  initialStock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsMongoId()
  @IsNotEmpty()
  category: Types.ObjectId | string;

  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId | string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  closingTime?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[] = [];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}