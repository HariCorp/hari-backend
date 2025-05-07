import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Đánh giá phải từ 1 đến 5 sao' })
  @Max(5, { message: 'Đánh giá phải từ 1 đến 5 sao' })
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  title?: string;
}