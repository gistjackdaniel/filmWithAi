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

  @Prop({ type: String, required: true })
  estimatedDuration: string;

  @Prop({ type: [String], required: true })
  costumes: string[];

  @Prop({ type: Object, required: true })
  props: {
    characterProps: string[];
    setProps: string[];
  };  
} 

@Schema({ _id: false })
export class SchedulerBreakdown {
  @Prop({ type: Object, required: true })
  basicInfo: {
    projectTitle: string;
    date: string;
    dayOfWeek: string;
    weather: string;
    temperature: {
      max: number;
      min: number;
    };
  };

  @Prop({ type: Object, required: true })
  contacts: {
    producer: { name: string; contact: string };
    director: { name: string; contact: string };
  };

  @Prop({ type: [Object], required: true })
  sceneDetails: {
    
  };
}

@Schema({ _id: false })
export class SchedulerDay {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
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

  @Prop({
    type: Object,
    default: {},
    example: [
      {
        basicInfo: {
          projectTitle: '청춘 로맨스',
          date: 'Day 1',
          dayOfWeek: '월요일',
          weather: '맑음',
          temperature: {
            max: 25,
            min: 15,
          },
        },
        contacts: {
          producer: { name: '김제작', contact: '010-1234-5678' },
          director: { name: '이감독', contact: '010-2345-6789' },
        },
        sceneDetails: [
          {
            sceneNumber: 5,
            title: '학교 앞 만남',
            location: '배재고등학교',
            timeOfDay: '아침',
            duration: 120,
            cast: ['주인공', '친구'],
            crew: ['감독', '촬영감독'],
            equipment: ['카메라', '조명'],
          },
        ],
        meetingInfo: {
          meetingLocation: '배재고등학교',
          meetingTime: '09:00',
          meetingPoints: [
            { time: '09:00', location: '배재고등학교 정문' },
            { time: '11:30', location: '배재고등학교 정문' },
          ],
        },
        timeTable: [
          {
            startTime: '09:00',
            endTime: '09:00',
            activity: '집합',
            details: '배재고등학교 집합',
            type: 'meeting',
          },
          {
            startTime: '09:00',
            endTime: '09:40',
            activity: '아침식사',
            details: '아침식사',
            type: 'meal',
          },
          {
            startTime: '09:40',
            endTime: '11:00',
            activity: '셋팅',
            details: '카메라, 조명, 미술 셋팅 / 보조출연 준비',
            type: 'setup',
          },
          {
            startTime: '11:00',
            endTime: '11:30',
            activity: '리허설',
            details: '씬별 리허설',
            type: 'rehearsal',
          },
          {
            startTime: '11:30',
            endTime: '13:30',
            activity: '촬영',
            details: '씬 5: 학교 앞 만남',
            type: 'shooting',
            sceneNumber: 5,
            sceneTitle: '학교 앞 만남',
          },
        ],
        summary: {
          totalScenes: 3,
          totalDuration: 360,
        },
      },
    ],
  })
  breakdown: any;

  @Prop({
    type: Boolean,
    default: false,
  })
  isDeleted: boolean;
}

@Schema({ timestamps: true })
export class Scheduler {
  _id: Types.ObjectId;

  @Prop({ type: [SchedulerDay], required: true })
  days: SchedulerDay[];

  @Prop({ type: Number, required: true })
  totalDays: number;

  @Prop({ type: Number, required: true })
  totalScenes: number;

  @Prop({ type: Number, required: true })
  totalDuration: number;
}

export const SchedulerSchema = SchemaFactory.createForClass(Scheduler); 