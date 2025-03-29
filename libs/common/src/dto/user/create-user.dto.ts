// libs/common/src/dto/user/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, MaxLength, IsArray, IsEnum } from 'class-validator';
import { Command } from '../../kafka/interfaces/message-patterns.interface';
import { UserRole } from '@app/common/enums';

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

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[]; // Make sure this exists
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