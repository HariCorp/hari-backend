import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type AIModelDocument = AIModel & Document;

@Schema({ timestamps: true })
export class AIModel {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  model: string;

  @Prop({ required: true, unique: true })
  modelName: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: false })
  isDisabled: boolean;
}

export const AIModelSchema = SchemaFactory.createForClass(AIModel);
