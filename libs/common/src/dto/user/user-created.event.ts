// libs/common/src/dto/user/user-created.event.ts
import { Event } from '../../kafka/interfaces/message-patterns.interface';

export class UserCreatedEvent extends Event {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly email: string,
    metadata?: any
  ) {
    super(metadata);
  }
}