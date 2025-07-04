import { ApiKeyPlan, ApiKeyType } from '@app/common/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAIModelDTO {
  @IsString()
  model: string;

  @IsString()
  @IsEnum(ApiKeyPlan)
  type: string = ApiKeyPlan.FREE;

  @IsString()
  @IsEnum(ApiKeyType)
  modelName: string;

  @IsOptional()
  @IsString()
  metadata?: Record<string, any>;

  @IsOptional()
  isDefault?: boolean = false;

  @IsOptional()
  isDisabled?: boolean = false;
}

export class UpdateAIModelDTO {
  @IsString()
  _id: string;
  @IsString()
  model: string;
  @IsString()
  @IsEnum(ApiKeyPlan)
  type: string = ApiKeyPlan.FREE;
  @IsString()
  @IsEnum(ApiKeyType)
  modelName: string;
  @IsOptional()
  @IsString()
  metadata?: Record<string, any>;
  @IsOptional()
  isDefault?: boolean;
  @IsOptional()
  isDisabled?: boolean;
}

export class CreateAIModelCommand {
  data: CreateAIModelDTO;
  metadata: {
    id: string;
    correlationId: string;
    timestamp: number;
    source: string;
    type: string;
  };
}

export class UpdateAIModelCommand {
  data: UpdateAIModelDTO;
  metadata: {
    id: string;
    correlationId: string;
    timestamp: number;
    source: string;
    type: string;
  };
}
