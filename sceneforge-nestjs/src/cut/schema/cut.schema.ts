import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class CameraSettings {
  @Prop({ type: String, default: '', trim: true })
  aperture: string;

  @Prop({ type: String, default: '', trim: true })
  shutterSpeed: string;

  @Prop({ type: String, default: '', trim: true })
  iso: string;
}

@Schema({ _id: false })
export class Subject {
  @Prop({ type: String, trim: true })
  name: string;

  @Prop({ 
    type: String, 
    enum: ['character', 'object', 'animal', 'background'], 
    default: 'character' 
  })
  type: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 200 })
  position: string;

  @Prop({ type: String, trim: true, maxlength: 200 })
  action: string;

  @Prop({ type: String, trim: true, maxlength: 100 })
  emotion: string;

  @Prop({ type: String, trim: true, maxlength: 300 })
  description: string;
}

@Schema({ _id: false })
export class SpecialCinematography {
  @Prop({ type: Boolean, default: false })
  drone: boolean;

  @Prop({ type: Boolean, default: false })
  crane: boolean;

  @Prop({ type: Boolean, default: false })
  jib: boolean;

  @Prop({ type: Boolean, default: false })
  underwater: boolean;

  @Prop({ type: Boolean, default: false })
  aerial: boolean;
}

@Schema({ _id: false })
export class SpecialEffects {
  @Prop({ type: Boolean, default: false })
  vfx: boolean;

  @Prop({ type: Boolean, default: false })
  pyrotechnics: boolean;

  @Prop({ type: Boolean, default: false })
  smoke: boolean;

  @Prop({ type: Boolean, default: false })
  fog: boolean;

  @Prop({ type: Boolean, default: false })
  wind: boolean;

  @Prop({ type: Boolean, default: false })
  rain: boolean;

  @Prop({ type: Boolean, default: false })
  snow: boolean;

  @Prop({ type: Boolean, default: false })
  fire: boolean;

  @Prop({ type: Boolean, default: false })
  explosion: boolean;

  @Prop({ type: Boolean, default: false })
  stunt: boolean;
}

@Schema({ _id: false })
export class SpecialLighting {
  @Prop({ type: Boolean, default: false })
  laser: boolean;

  @Prop({ type: Boolean, default: false })
  strobe: boolean;

  @Prop({ type: Boolean, default: false })
  blackLight: boolean;

  @Prop({ type: Boolean, default: false })
  uvLight: boolean;

  @Prop({ type: Boolean, default: false })
  movingLight: boolean;

  @Prop({ type: Boolean, default: false })
  colorChanger: boolean;
}

@Schema({ _id: false })
export class Safety {
  @Prop({ type: Boolean, default: false })
  requiresMedic: boolean;

  @Prop({ type: Boolean, default: false })
  requiresFireSafety: boolean;

  @Prop({ type: Boolean, default: false })
  requiresSafetyOfficer: boolean;
}

@Schema({ _id: false })
export class SpecialRequirements {
  @Prop({ type: SpecialCinematography, default: () => ({}) })
  specialCinematography: SpecialCinematography;

  @Prop({ type: SpecialEffects, default: () => ({}) })
  specialEffects: SpecialEffects;

  @Prop({ type: SpecialLighting, default: () => ({}) })
  specialLighting: SpecialLighting;

  @Prop({ type: Safety, default: () => ({}) })
  safety: Safety;
}

@Schema({ _id: false })
export class CameraSetup {
  @Prop({ 
    type: String, 
    enum: [
      'EWS', 'VWS', 'WS', 'FS', 'LS', 'MLS', 'MS', 'MCS', 'CU', 'MCU', 'BCU', 'ECU', 'TCU', 
      'OTS', 'POV', 'TS', 'GS', 'AS', 'PS', 'BS'
    ], 
    default: 'MS' 
  })
  shotSize: string;

  @Prop({ 
    type: String, 
    enum: [
      'Eye-level', 'High', 'Low', 'Dutch', 'Bird_eye', 'Worm_eye', 'Canted', 'Oblique', 
      'Aerial', 'Ground', 'Overhead', 'Under', 'Side', 'Front', 'Back', 'Three_quarter', 
      'Profile', 'Reverse', 'POV', 'Subjective'
    ], 
    default: 'Eye-level' 
  })
  angleDirection: string;

  @Prop({ 
    type: String, 
    enum: [
      'Static', 'Pan', 'Tilt', 'Dolly', 'Zoom', 'Handheld', 'Tracking', 'Crane', 'Steadicam', 
      'Gimbal', 'Drone', 'Jib', 'Slider', 'Dolly_zoom', 'Arc', 'Circle', 'Spiral', 'Vertigo', 
      'Whip_pan', 'Crash_zoom', 'Push_in', 'Pull_out', 'Follow', 'Lead', 'Reveal', 'Conceal', 
      'Parallax', 'Time_lapse', 'Slow_motion', 'Fast_motion', 'Bullet_time', 'Matrix_style', 
      '360_degree', 'VR_style'
    ], 
    default: 'Static' 
  })
  cameraMovement: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 200 })
  lensSpecs: string;

  @Prop({ type: CameraSettings, default: () => ({}) })
  cameraSettings: CameraSettings;
}

@Schema({ timestamps: true })
export class Cut extends Document {
  declare _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Scene', required: true, index: true })
  sceneId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  order: number;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  title: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  description: string;

  @Prop({ type: CameraSetup, default: () => ({}) })
  cameraSetup: CameraSetup;

  @Prop({ type: String, default: '', trim: true, maxlength: 500 })
  vfxEffects: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 500 })
  soundEffects: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 1000 })
  directorNotes: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 200 })
  dialogue: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 200 })
  narration: string;

  @Prop({ type: [Subject], default: [] })
  subjectMovement: Subject[];

  @Prop({ 
    type: String, 
    enum: ['live_action', 'ai_generated'], 
    default: 'live_action' 
  })
  productionMethod: string;

  @Prop({ type: String, default: '', trim: true, maxlength: 500 })
  productionMethodReason: string;

  @Prop({ type: Number, default: 5, min: 1, max: 300 })
  estimatedDuration: number;

  @Prop({ type: SpecialRequirements, default: () => ({}) })
  specialRequirements: SpecialRequirements;

  @Prop({ type: String, default: null, trim: true })
  imageUrl?: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const CutSchema = SchemaFactory.createForClass(Cut);
