// libs/common/src/dto/user/update-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { Command } from '../../kafka/interfaces/message-patterns.interface';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

// Example of a Command using this DTO
export class UpdateUserCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly data: UpdateUserDto,
    metadata?: any
  ) {
    super(metadata);
  }
}