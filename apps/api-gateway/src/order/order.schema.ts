import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingMethod,
} from '@app/common/enums';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

/**
 * Represents a single item in an order
 */
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

/**
 * Tracks status changes for auditing and history
 */
export class StatusHistory {
  @Prop({
    required: true,
    type: String,
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status: OrderStatus;

  @Prop({ required: true, default: Date.now })
  timestamp: Date;

  @Prop()
  note?: string;

  @Prop()
  updatedBy?: string;
}

export type OrderDocument = HydratedDocument<Order>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
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
    enum: Object.values(OrderStatus),
  })
  status: OrderStatus;

  // Payment information
  @Prop({
    required: true,
    type: String,
    enum: Object.values(PaymentMethod),
  })
  paymentMethod: PaymentMethod;

  @Prop({
    required: true,
    type: String,
    default: PaymentStatus.PENDING,
    enum: Object.values(PaymentStatus),
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

  // Shipping information
  @Prop({ required: true, type: String })
  shippingAddress: string;

  // Order items
  @Prop({ required: true, type: [OrderItem] })
  items: OrderItem[];

  @Prop({
    required: true,
    type: String,
    default: ShippingMethod.STANDARD,
    enum: Object.values(ShippingMethod),
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

// Add pre-save middleware to automatically create initial status history entry
OrderSchema.pre('save', function (next) {
  // Only add initial status history if this is a new document and statusHistory is empty
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        status: this.status || OrderStatus.CREATED,
        timestamp: new Date(),
        note: 'Order created',
      },
    ];
  }
  next();
});

// Add virtual properties
OrderSchema.virtual('itemCount').get(function (this: OrderDocument) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

OrderSchema.virtual('canBeCancelled').get(function (this: OrderDocument) {
  const nonCancellableStatuses = [
    OrderStatus.COMPLETED,
    OrderStatus.CANCELED,
    OrderStatus.SHIPPED,
    OrderStatus.REFUNDED,
  ];
  return !nonCancellableStatuses.includes(this.status);
});

OrderSchema.virtual('lastStatusChange').get(function (this: OrderDocument) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    return null;
  }
  return this.statusHistory[this.statusHistory.length - 1];
});

// Add indexes for common queries
OrderSchema.index({ userId: 1 });
OrderSchema.index({ sellerId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.productId': 1 });
