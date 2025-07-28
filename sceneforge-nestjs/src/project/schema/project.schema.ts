import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Profile', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ maxlength: 2000, required: false })
  synopsis?: string;

  @Prop({ maxlength: 10000, required: false })
  story?: string;

  @Prop({ type: [String], trim: true, default: [] })
  tags: string[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
  
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ type: Date, default: Date.now })
  lastViewedAt: Date;
  
  @Prop({ default: false })
  isDeleted: boolean;
  
  @Prop({ type: [Types.ObjectId], ref: 'Profile', default: [] })
  participants: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Scene', default: [] })
  scenes: Types.ObjectId[];

  @Prop({ type: [String], trim: true, default: [] })
  genre: string[];

  @Prop({ type: String, default: '90분' })
  estimatedDuration: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);