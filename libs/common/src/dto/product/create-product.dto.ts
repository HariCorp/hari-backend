import { Command } from '@app/common/kafka';
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
  IsNotEmpty,
  Length,
  Matches,
  ArrayMaxSize,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Tên sản phẩm phải từ 2 đến 100 ký tự' })
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
  initialStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'SKU chỉ chứa chữ cái, số và dấu gạch ngang',
  })
  sku?: string;

  @IsMongoId({ message: 'Category phải là MongoDB ObjectId hợp lệ' })
  @IsNotEmpty()
  category: Types.ObjectId;

  @IsMongoId({ message: 'UserId phải là MongoDB ObjectId hợp lệ' })
  @IsOptional()
  userId?: Types.ObjectId;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  closingTime?: Date;

  @IsArray()
  @IsString({ each: true, message: 'Mỗi URL ảnh phải là chuỗi' })
  @ArrayMaxSize(5, { message: 'Không được upload quá 5 ảnh' })
  @Matches(/^https?:\/\/.+$/, { each: true, message: 'Ảnh phải là URL hợp lệ' })
  images: string[] = [];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsString()
  @IsOptional()
  brand?: string; // Thêm thương hiệu sản phẩm

  @IsArray()
  @IsOptional()
  @Type(() => String)
  tags?: string[] = []; // Thêm danh sách tag cho SEO hoặc tìm kiếm

  @IsString()
  @IsOptional()
  location?: string; // Thêm vị trí sản phẩm

  constructor(partial: Partial<CreateProductDto>) {
    Object.assign(this, partial);
    if (this.initialStock !== undefined && this.stock === undefined) {
      this.stock = this.initialStock; // Đảm bảo stock mặc định bằng initialStock khi tạo mới
    }
  }
}

export class CreateProductCommand extends Command {
  constructor(
    public readonly data: CreateProductDto,
    metadata?: any,
  ) {
    super(metadata);
  }
}
