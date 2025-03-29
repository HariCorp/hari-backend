// libs/common/src/dto/product/update-category.dto.ts
import { IsString, IsOptional, IsMongoId, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

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
  isActive?: boolean;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}