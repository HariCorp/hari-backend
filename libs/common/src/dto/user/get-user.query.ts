// libs/common/src/dto/user/get-user.query.ts
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Query } from '../../kafka/interfaces/message-patterns.interface';

export class GetUserByIdQuery extends Query {
  @IsNotEmpty()
  @IsString()
  readonly userId: string;
  
  @IsOptional()
  @IsString()
  readonly include?: string; // e.g., 'posts,comments'

  constructor(userId: string, include?: string, metadata?: any) {
    super(metadata);
    this.userId = userId;
    this.include = include;
  }
}