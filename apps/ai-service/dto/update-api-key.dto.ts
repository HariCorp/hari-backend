// apps/ai-service/src/dto/update-api-key.dto.ts
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiKeyPlan, ApiKeyStatus, ApiKeyType } from '@app/common';

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(ApiKeyType)
  @IsOptional()
  type?: ApiKeyType;

  @IsEnum(ApiKeyStatus)
  @IsOptional()
  status?: ApiKeyStatus;

  @IsEnum(ApiKeyPlan)
  @IsOptional()
  plan?: ApiKeyPlan;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyCallLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dailyTokenLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  requestsPerMinuteLimit?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
