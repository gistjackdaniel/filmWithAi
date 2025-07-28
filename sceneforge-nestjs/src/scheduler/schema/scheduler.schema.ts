import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SchedulerDocument = Scheduler & Document;

@Schema({ _id: false })
export class SchedulerTimeRange {
  @Prop({ type: String, required: true })
  start: string;

  @Prop({ type: String, required: true })
  end: string;
}

@Schema({ _id: false })
export class SchedulerScene {
  @Prop({ type: Number, required: true })
  scene: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Object, required: true })
  location: {
    name: string;
    address: string;
    group_name: string;
  };

  @Prop({ type: String, required: true })
  timeOfDay: string;

  @Prop({ type: [Object], required: true })
  cast: {
    role: string;
    name: string;
  };

  @Prop({ type: Number, required: true })
  estimatedDuration: number;

  @Prop({ type: [String], required: true })
  costumes: string[];

  @Prop({ type: Object, required: true })
  props: {
    characterProps: string[];
    setProps: string[];
  };  
} 

@Schema({ timestamps: true })
export class Scheduler {
  _id: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: true, 
    index: true 
  })
  projectId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  day: number;

  @Prop({ type: String, required: true })
  date: string;

  @Prop({ type: [String], required: true })
  location_groups: string[];

  @Prop({ type: SchedulerTimeRange, required: true })
  timeRange: SchedulerTimeRange;

  @Prop({ type: [SchedulerScene], required: true })
  scenes: SchedulerScene[];

  @Prop({ type: Number, required: true })
  estimatedDuration: number;

  @Prop({ type: Object, default: {} })
  breakdown: any;

  @Prop({
    type: Boolean,
    default: false
  })
  isDeleted: boolean;
}

export const SchedulerSchema = SchemaFactory.createForClass(Scheduler); 