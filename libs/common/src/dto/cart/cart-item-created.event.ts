import { Event } from '@app/common/kafka';
import { Types } from 'mongoose';

export class CartItemCreatedEvent extends Event {
  constructor(
    public readonly cartItemId: Types.ObjectId,
    public readonly productId: Types.ObjectId,
    public readonly userId: string,
    public readonly quantity: number,
  ) {
    super();
  }
} 