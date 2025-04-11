// apps/user-service/src/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole, UserStatus } from '@app/common/enums';

export type UserDocument = User & Document;

interface SocialAccount {
  provider: string;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
}
@Schema({ 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    }
  } 
})
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ 
    type: String, 
    enum: Object.values(UserStatus), 
    default: UserStatus.ACTIVE 
  })
  status: UserStatus;

  @Prop({ 
    type: [String], 
    enum: Object.values(UserRole), 
    default: [UserRole.USER] 
  })
  roles: UserRole[];

  // Trường socialAccounts (mảng các tài khoản xã hội)
  @Prop({
    type: [{
      provider: { type: String, required: true },
      providerId: { type: String, required: true },
      accessToken: { type: String, required: false },
      refreshToken: { type: String, required: false },
    }],
    default: [], // Mặc định là mảng rỗng
  })
  socialAccounts: SocialAccount[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Tạo index cho các trường thường dùng để tìm kiếm
UserSchema.index({ status: 1 });
UserSchema.index({ roles: 1 });