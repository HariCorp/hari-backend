import { ApiKeyType } from '@app/common/enums';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAIModelDTO {
  @IsString()
  modelName: string;

  @IsString()
  type: string;

  @IsString()
  @IsEnum(ApiKeyType)
  model: string;

  @IsOptional()
  @IsString()
  metadata?: Record<string, any>;

  @IsOptional()
  isDefault?: boolean = false;

  @IsOptional()
  isDisabled?: boolean = false;
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
