// apps/product-service/src/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Định nghĩa ProductDocument bằng HydratedDocument
export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ required: true, type: Number, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  discountPercentage: number;

  @Prop({ type: Number, default: 0, min: 0 })
  stock: number;

  @Prop({ type: Number, default: 0, min: 0 })
  initialStock: number;

  @Prop({ type: String, unique: true, sparse: true })
  sku?: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date })
  closingTime?: Date;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String })
  brand?: string;
  
  @Prop({ type: [String], default: [] })
  tags: string[];

  // Getter ảo để tính giá sau khi giảm giá
  get finalPrice(): number {
    if (!this.discountPercentage) return this.price;
    return this.price * (1 - this.discountPercentage / 100);
  }

  // Getter ảo để hiển thị trạng thái tồn kho
  get stockStatus(): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (this.stock <= 0) return 'out_of_stock';
    if (this.stock < 10) return 'low_stock';
    return 'in_stock';
  }
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Thêm virtual getters vào schema
ProductSchema.virtual('finalPrice').get(function() {
  if (!this.discountPercentage) return this.price;
  return this.price * (1 - this.discountPercentage / 100);
});

ProductSchema.virtual('stockStatus').get(function() {
  if (this.stock <= 0) return 'out_of_stock';
  if (this.stock < 10) return 'low_stock';
  return 'in_stock';
});

// Đảm bảo các virtuals được bao gồm khi chuyển đổi sang JSON
ProductSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

// Đảm bảo các virtuals được bao gồm khi chuyển đổi sang Object
ProductSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

// Tạo các indexes để tối ưu truy vấn
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ discountPercentage: 1 });
ProductSchema.index({ stock: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ userId: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdAt: -1 });