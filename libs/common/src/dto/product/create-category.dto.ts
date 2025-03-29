// libs/common/src/dto/product/create-category.dto.ts
import { IsString, IsOptional, IsMongoId, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}