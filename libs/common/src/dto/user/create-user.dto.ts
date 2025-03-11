// libs/common/src/dto/user/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Command } from '../../kafka/interfaces/message-patterns.interface';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

// Example of a Command using this DTO
export class CreateUserCommand extends Command {
    constructor(
      public readonly data: CreateUserDto,
      metadata?: any
    ) {
      super(metadata);
    }
  }