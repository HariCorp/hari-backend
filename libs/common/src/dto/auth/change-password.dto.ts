import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Command } from '../../kafka/interfaces/message-patterns.interface';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  userId: string;
}

export class ChangePasswordCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly data: ChangePasswordDto,
    metadata?: any,
  ) {
    super(metadata);
  }
}
