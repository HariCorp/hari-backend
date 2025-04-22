import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from '@app/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Define sub-schemas for nested objects
export class OrderItem {
  @Prop({ required: true, type: String })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true })
  price: number;

  @Prop()
  note?: string;

  @Prop({ required: true })
  totalPrice: number;
}

class StatusHistory {
  @Prop({ required: true, type: OrderStatus, default: OrderStatus.CREATED })
  status: string;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  note?: string;

  @Prop()
  updatedBy?: string;
}

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  // Basic order information
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ required: true, type: String })
  sellerId: string;

  @Prop({
    required: true,
    type: String,
    default: OrderStatus.CREATED,
    enum: OrderStatus,
  })
  status: OrderStatus;

  // Payment information
  @Prop({ required: true, type: String, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({
    required: true,
    type: String,
    default: PaymentStatus.PENDING,
    enum: PaymentStatus,
  })
  paymentStatus: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0, default: 0 })
  shippingFee: number;

  @Prop({ required: true, min: 0, default: 0 })
  tax: number;

  @Prop({ required: true, min: 0, default: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  // Recipient information

  @Prop({ required: true, type: String })
  shippingAddress: string;

  // Order items
  @Prop({ required: true, type: [OrderItem] })
  items: OrderItem[];

  // Shipping information
  @Prop({
    required: true,
    type: String,
    default: ShippingMethod.STANDARD,
    enum: ShippingMethod,
  })
  shippingMethod: ShippingMethod;

  @Prop()
  estimatedDeliveryDate: Date;

  // Additional information
  @Prop()
  notes?: string;

  @Prop()
  adminNotes?: string;

  @Prop()
  couponCode?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  // Status history
  @Prop({ type: [StatusHistory], default: [] })
  statusHistory: StatusHistory[];
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Add virtual properties
OrderSchema.virtual('itemCount').get(function (this: OrderDocument) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Include virtuals when converting to JSON/Object
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

// Add indexes for common queries
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
