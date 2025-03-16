// apps/auth-service/src/schemas/refresh-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({ timestamps: true })
export class RefreshToken {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  token: string; // Hash của refresh token

  @Prop({ required: true, index: true })
  userId: string; // ID của người dùng

  @Prop({ default: false })
  isRevoked: boolean; // Đã bị thu hồi chưa

  @Prop({ required: true })
  expiresAt: Date; // Thời gian hết hạn

  @Prop()
  userAgent?: string; // Thông tin trình duyệt/thiết bị

  @Prop()
  ipAddress?: string; // Địa chỉ IP

  @Prop()
  lastUsedAt?: Date; // Lần cuối được sử dụng
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Tạo index để tăng tốc truy vấn
RefreshTokenSchema.index({ token: 1 }, { unique: true });
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index, MongoDB sẽ tự động xóa documents hết hạn