import { IsString, IsNumber, IsNotEmpty, IsMongoId, Min, Max, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateReviewDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
  productId: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  userId: Types.ObjectId;

  @IsNumber()
  @Min(1, { message: 'Đánh giá phải từ 1 đến 5 sao' })
  @Max(5, { message: 'Đánh giá phải từ 1 đến 5 sao' })
  @IsNotEmpty({ message: 'Số sao đánh giá không được để trống' })
  rating: number;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  comment: string;

  @IsOptional()
  @IsString()
  title?: string;
}