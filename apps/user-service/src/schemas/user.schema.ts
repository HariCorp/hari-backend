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

interface Address {
  fullAddress: string;
  city: string;
  district?: string;
  ward?: string;
  isDefault: boolean;
}

interface PhoneNumber {
  number: string;
  countryCode: string;
  isVerified: boolean;
  isPrimary: boolean;
}

interface Preferences {
  theme?: string;
  language?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
  },
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

  @Prop()
  bio?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  gender?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  lastLogin?: Date;

  @Prop()
  lastActive?: Date;

  @Prop()
  lastPasswordChange?: Date;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil?: Date;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.USER],
  })
  roles: UserRole[];

  // Phone numbers
  @Prop({
    default: [],
  })
  phoneNumbers: PhoneNumber[];

  // Addresses
  @Prop({
    type: [
      {
        fullAddress: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String },
        ward: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  addresses: Address[];

  // Social accounts
  @Prop({
    type: [
      {
        provider: { type: String, required: true },
        providerId: { type: String, required: true },
        accessToken: { type: String },
        refreshToken: { type: String },
      },
    ],
    default: [],
  })
  socialAccounts: SocialAccount[];

  // User preferences
  @Prop({
    type: {
      theme: { type: String, default: 'system' },
      language: { type: String, default: 'vi' },
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
    default: {
      theme: 'system',
      language: 'vi',
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
    },
  })
  preferences: Preferences;

  // Store information - for seller accounts
  @Prop({
    type: {
      name: { type: String },
      description: { type: String },
      logo: { type: String },
      banners: { type: [String] },
      contactEmail: { type: String },
      contactPhone: { type: String },
      address: { type: String },
      website: { type: String },
      socialLinks: {
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        youtube: { type: String },
      },
      isVerified: { type: Boolean, default: false },
      rating: { type: Number, default: 0 },
      joinedDate: { type: Date },
    },
  })
  storeInfo?: Record<string, any>;

  // Metadata - for any additional information
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for common search fields
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ roles: 1 });
UserSchema.index({ 'phoneNumbers.number': 1 });
UserSchema.index({ 'addresses.city': 1, 'addresses.district': 1 });
UserSchema.index({
  'socialAccounts.provider': 1,
  'socialAccounts.providerId': 1,
});
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLogin: -1 });

// Add a compound index for full name search
UserSchema.index({ firstName: 'text', lastName: 'text' });
