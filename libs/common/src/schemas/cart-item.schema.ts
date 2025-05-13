import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Define CartItemDocument type
export type CartItemDocument = HydratedDocument<CartItem>;

@Schema({ timestamps: true })
export class CartItem {
  @Prop({ required: true, type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 1 })
  quantity: number;

  @Prop({ required: true, type: String })
  userId: string;

  @Prop({ type: String })
  note?: string;

  // Store product details at the time of adding to cart
  // This helps if product details change later
  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: Number, required: true })
  productPrice: number;

  @Prop({ type: String })
  productImage?: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

// Configure toJSON and toObject transformations
CartItemSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

CartItemSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

// Create indexes for common queries
CartItemSchema.index({ userId: 1 });
CartItemSchema.index({ productId: 1 });
CartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });
