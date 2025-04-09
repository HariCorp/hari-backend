import {
  IsNumber,
  IsOptional,
  Min,
  IsString,
} from 'class-validator';

export class UpdateCartItemDto {
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number;

  @IsOptional()
  @IsString()
  note?: string;
} 