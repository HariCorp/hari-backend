import { Command } from '@app/common';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { FileType } from '../schemas/uploaded-file.schema';

export class UploadFileDto {
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  originalName: string;

  @IsNotEmpty()
  @IsString()
  buffer: string; // Base64 encoded file buffer

  @IsEnum(FileType)
  fileType: FileType;

  @IsNumber()
  size: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  folder?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class UploadFileCommand extends Command {
  constructor(
    public readonly data: UploadFileDto,
    metadata?: any,
  ) {
    super(metadata);
  }
} 