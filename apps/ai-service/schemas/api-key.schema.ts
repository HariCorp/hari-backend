// apps/ai-service/src/schemas/api-key.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApiKeyDocument = ApiKey & Document;

export enum ApiKeyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  RATE_LIMITED = 'rate_limited',
}

export enum ApiKeyType {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export enum ApiKeyPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Schema({ timestamps: true })
export class ApiKey {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    enum: Object.values(ApiKeyType),
    default: ApiKeyType.GEMINI,
  })
  type: ApiKeyType;

  @Prop({
    required: true,
    enum: Object.values(ApiKeyStatus),
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  @Prop({
    required: true,
    enum: Object.values(ApiKeyPlan),
    default: ApiKeyPlan.FREE,
  })
  plan: ApiKeyPlan;

  @Prop({ required: true, default: 0 })
  totalCalls: number;

  @Prop({ required: true, default: 0 })
  dailyCalls: number;

  @Prop({ type: Date })
  lastCallAt: Date;

  @Prop({ type: Date })
  dailyResetAt: Date;

  @Prop({ required: true, default: 0 })
  totalTokensUsed: number;

  @Prop({ required: true, default: 0 })
  dailyTokensUsed: number;

  @Prop({ type: Number, default: 100 })
  dailyCallLimit: number;

  @Prop({ type: Number, default: 20000 })
  dailyTokenLimit: number;

  @Prop({ type: Number, default: 3 })
  requestsPerMinuteLimit: number;

  @Prop({ type: Number, default: 0 })
  currentMinuteCalls: number;

  @Prop({ type: Date })
  minuteResetAt: Date;

  @Prop({ type: String })
  userId?: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  expiresAt?: Date;

  // Virtual property to determine if API key is expired
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  // Virtual property to determine if API key is still usable
  get isUsable(): boolean {
    return (
      this.status === ApiKeyStatus.ACTIVE &&
      !this.isExpired &&
      this.dailyCalls < this.dailyCallLimit &&
      this.dailyTokensUsed < this.dailyTokenLimit &&
      (!this.minuteResetAt ||
        this.currentMinuteCalls < this.requestsPerMinuteLimit ||
        new Date() > this.minuteResetAt)
    );
  }

  // Virtual property to determine how many tokens are left today
  get remainingDailyTokens(): number {
    return Math.max(0, this.dailyTokenLimit - this.dailyTokensUsed);
  }

  // Virtual property to determine how many calls are left today
  get remainingDailyCalls(): number {
    return Math.max(0, this.dailyCallLimit - this.dailyCalls);
  }
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Add virtuals to schema
ApiKeySchema.virtual('isExpired').get(function (this: ApiKeyDocument) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

ApiKeySchema.virtual('isUsable').get(function (this: ApiKeyDocument) {
  return (
    this.status === ApiKeyStatus.ACTIVE &&
    !this.isExpired &&
    this.dailyCalls < this.dailyCallLimit &&
    this.dailyTokensUsed < this.dailyTokenLimit &&
    (!this.minuteResetAt ||
      this.currentMinuteCalls < this.requestsPerMinuteLimit ||
      new Date() > this.minuteResetAt)
  );
});

ApiKeySchema.virtual('remainingDailyTokens').get(function (
  this: ApiKeyDocument,
) {
  return Math.max(0, this.dailyTokenLimit - this.dailyTokensUsed);
});

ApiKeySchema.virtual('remainingDailyCalls').get(function (
  this: ApiKeyDocument,
) {
  return Math.max(0, this.dailyCallLimit - this.dailyCalls);
});

// Include virtuals when converting to JSON
ApiKeySchema.set('toJSON', { virtuals: true });
ApiKeySchema.set('toObject', { virtuals: true });

// Create indexes for better query performance
ApiKeySchema.index({ key: 1 }, { unique: true });
ApiKeySchema.index({ userId: 1 });
ApiKeySchema.index({ status: 1 });
ApiKeySchema.index({ type: 1 });
ApiKeySchema.index({ plan: 1 });
ApiKeySchema.index({ isDefault: 1 });
ApiKeySchema.index({ expiresAt: 1 });
