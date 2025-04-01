// Schema đơn giản cho lưu trữ thông tin prompt và dữ liệu phân tích
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptDocument = Prompt & Document;

// Interface cho sản phẩm phổ biến
interface PopularProduct {
  productId: string;
  salesCount: number;
}

// Interface cho metrics theo thời gian
interface TimeMetrics {
  totalOrders: number;
  activeUsers: number;
  newUsers: number;
  popularProducts: PopularProduct[];
}

@Schema({ timestamps: true })
export class Prompt {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  systemPrompt: string;

  @Prop({ type: Object })
  websiteInfo: {
    name: string;
    description: string;
    url: string;
    productsCount?: number;
    categoriesCount?: number;
    usersCount?: number;
    contactEmail?: string;
    contactPhone?: string;
  };

  @Prop({ type: Object })
  todayInfo: TimeMetrics;

  @Prop({ type: Object })
  yesterdayInfo: TimeMetrics;

  @Prop({ type: Object })
  weekInfo: TimeMetrics;

  @Prop({ type: Object })
  monthInfo: TimeMetrics;

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt);
