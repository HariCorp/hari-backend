import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UploadedFileDocument = UploadedFile & Document;

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
}

@Schema({ timestamps: true })
export class UploadedFile {
  _id: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ type: String, enum: Object.values(FileType), required: true })
  fileType: FileType;

  @Prop({ type: Number, required: true })
  size: number; // in bytes

  @Prop({ type: String })
  mimeType: string;

  @Prop({ type: Object })
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    pages?: number;
  };

  @Prop({ type: String })
  userId?: string;

  @Prop({ type: String })
  folder?: string;
}

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);

// Create indexes for better query performance
UploadedFileSchema.index({ publicId: 1 }, { unique: true });
UploadedFileSchema.index({ userId: 1 });
UploadedFileSchema.index({ fileType: 1 });
UploadedFileSchema.index({ createdAt: 1 }); 