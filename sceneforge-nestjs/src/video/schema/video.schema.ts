import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;
export type VideoType = 'uploaded' | 'ai_generated';

@Schema({ timestamps: true })
export class Video {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false, index: true })
  sceneId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false })
  sourceCutId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Number, required: true, min: 0 })
  duration: number;

  @Prop({ type: String, enum: ['uploaded', 'ai_generated'], required: true })
  type: VideoType;

  @Prop({ type: String })
  videoUrl?: string;

  @Prop({ type: String, default: 'V2' })
  track: string; // V2 or V3

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
// 인덱스 설정: 프로젝트/트랙/정렬
VideoSchema.index({ projectId: 1, track: 1, order: 1, createdAt: 1 });
