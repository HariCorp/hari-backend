import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CompletionDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1.0)
  temperature?: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;
}
