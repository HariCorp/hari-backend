// apps/ai-service/src/dto/create-api-key.dto.ts
import { Command } from '@app/common';
import {
  ApiKeyPlan,
  ApiKeyStatus,
  ApiKeyType,
} from '../schemas/api-key.schema';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  key: string; // API key provided by the user (e.g., Gemini API key)

  @IsEnum(ApiKeyType)
  @IsOptional()
  type?: ApiKeyType = ApiKeyType.GEMINI;

  @IsEnum(ApiKeyStatus)
  @IsOptional()
  status?: ApiKeyStatus = ApiKeyStatus.ACTIVE;

  @IsEnum(ApiKeyPlan)
  @IsOptional()
  plan?: ApiKeyPlan = ApiKeyPlan.FREE;

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
  metadata?: Record<string, any>;
}

export class CreateApiKeyCommand extends Command {
  constructor(
    public readonly data: CreateApiKeyDto,
    metadata?: any,
  ) {
    super(metadata);
  }
}
