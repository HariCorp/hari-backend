// libs/common/src/dto/user/filter-user.dto.ts
import { IsOptional, IsString, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { UserStatus, UserRole } from '@app/common/enums';
import { Type } from 'class-transformer';

export class FilterUserDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  // Thêm các options phân trang
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}