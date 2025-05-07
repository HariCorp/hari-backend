import { IsMongoId, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

export class FilterReviewDto {
  @IsOptional()
  @IsMongoId()
  productId?: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  userId?: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}