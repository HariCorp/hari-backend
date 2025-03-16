// libs/common/src/dto/auth/login.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Command } from '../../kafka/interfaces/message-patterns.interface';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class LoginCommand extends Command {
  constructor(
    public readonly data: LoginDto,
    metadata?: any
  ) {
    super(metadata);
  }
}