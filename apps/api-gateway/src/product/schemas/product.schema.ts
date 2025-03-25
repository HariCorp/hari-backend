import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discountPercentage: number;

  @Prop({ type: Number, default: 0 })
  stock: number;

  @Prop({ type: Number, default: 0 })
  initialStock: number;

  @Prop({ type: String })
  sku?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ type: Date })
  closingTime?: Date;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);