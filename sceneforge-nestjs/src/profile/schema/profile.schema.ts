import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

// 프로젝트 참조 서브도큐먼트 스키마
@Schema({ _id: false })
export class ProjectReference {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Date, default: null })
  lastViewedAt?: Date;

  @Prop({ type: Boolean, default: false })
  isFavorite: boolean;
}

export const ProjectReferenceSchema = SchemaFactory.createForClass(ProjectReference);

@Schema({ timestamps: true })
export class Profile {
  _id: Types.ObjectId;

  @Prop({ required: true })
  googleId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  picture: string;

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: [ProjectReferenceSchema], default: [] })
  projects: ProjectReference[];
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);