import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '@app/common';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  _id: Types.ObjectId;

  @Prop({ required: true, type: String })
  orderId: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(PaymentMethod),
  })
  paymentMethod: PaymentMethod;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop()
  paymentUrl?: string;

  @Prop()
  transactionId?: string;

  @Prop()
  completedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Tạo indexes
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });
