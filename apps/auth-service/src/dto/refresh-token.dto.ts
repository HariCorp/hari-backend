// apps/auth-service/src/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString, IsDate, IsOptional, IsBoolean } from 'class-validator';

export class CreateRefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isRevoked?: boolean;

  @IsNotEmpty()
  @IsDate()
  expiresAt: Date;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class UpdateRefreshTokenDto {
  @IsOptional()
  @IsBoolean()
  isRevoked?: boolean;

  @IsOptional()
  @IsDate()
  lastUsedAt?: Date;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}