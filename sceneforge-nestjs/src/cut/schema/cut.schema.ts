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

// 컷별 델타 - 추가 인력
@Schema({ _id: false })
export class AdditionalCinematographyCrew {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCinematographer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCameraOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalFirstAssistant: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSecondAssistant: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalDollyGrip: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  droneOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  craneOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  jibOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  underwaterOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  aerialOperator: string[];
}

@Schema({ _id: false })
export class AdditionalLightingCrew {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalGaffer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalBestBoy: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalElectrician: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalGeneratorOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialEffectsGaffer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  laserOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  strobeOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  fogOperator: string[];
}

@Schema({ _id: false })
export class AdditionalSoundCrew {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSoundMixer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalBoomOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSoundAssistant: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalUtility: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  foleyArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  ambienceRecordist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialSoundEngineer: string[];
}

@Schema({ _id: false })
export class AdditionalArtCrew {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalProductionDesigner: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalArtDirector: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSetDecorator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalPropMaster: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalMakeupArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCostumeDesigner: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalHairStylist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  vfxSupervisor: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  sfxSupervisor: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  pyrotechnician: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  stuntCoordinator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  animatronicsOperator: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  prostheticsArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  bloodEffectsArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  makeupEffectsArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  setEffectsArtist: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialPropsMaster: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialCostumeDesigner: string[];
}

@Schema({ _id: false })
export class AdditionalProductionCrew {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalProducer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalLineProducer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalProductionManager: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalProductionAssistant: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  safetySupervisor: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  fireSafetyOfficer: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  medic: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  emergencyCoordinator: string[];
}

@Schema({ _id: false })
export class AdditionalCrew {
  @Prop({ type: AdditionalCinematographyCrew, default: () => ({}) })
  cinematography: AdditionalCinematographyCrew;

  @Prop({ type: AdditionalLightingCrew, default: () => ({}) })
  lighting: AdditionalLightingCrew;

  @Prop({ type: AdditionalSoundCrew, default: () => ({}) })
  sound: AdditionalSoundCrew;

  @Prop({ type: AdditionalArtCrew, default: () => ({}) })
  art: AdditionalArtCrew;

  @Prop({ type: AdditionalProductionCrew, default: () => ({}) })
  production: AdditionalProductionCrew;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  etc: string[];
}

// 컷별 델타 - 추가 장비
@Schema({ _id: false })
export class AdditionalCinematographyEquipment {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCameras: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalLenses: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSupports: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalFilters: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalAccessories: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  drones: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  cranes: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  jibs: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  underwaterHousings: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  aerialRigs: string[];
}

@Schema({ _id: false })
export class AdditionalGripModifiers {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  flags: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  diffusion: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  reflectors: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  colorGels: string[];
}

@Schema({ _id: false })
export class AdditionalLightingEquipment {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalKeyLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalFillLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalBackLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalBackgroundLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSpecialEffectsLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSoftLights: string[];

  @Prop({ type: AdditionalGripModifiers, default: () => ({}) })
  additionalGripModifiers: AdditionalGripModifiers;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalPower: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialKeyLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialFillLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialBackLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialBackgroundLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialEffectsLights: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialSoftLights: string[];

  @Prop({ type: AdditionalGripModifiers, default: () => ({}) })
  specialGripModifiers: AdditionalGripModifiers;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialPower: string[];
}

@Schema({ _id: false })
export class AdditionalSoundEquipment {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalMicrophones: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalRecorders: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalWireless: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalMonitoring: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  foleyEquipment: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  ambienceRecorders: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  specialMicrophones: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  soundEffects: string[];
}

@Schema({ _id: false })
export class AdditionalArtProps {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCharacterProps: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSetProps: string[];
}

@Schema({ _id: false })
export class AdditionalArtEquipment {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSetConstruction: string[];

  @Prop({ type: AdditionalArtProps, default: () => ({}) })
  additionalProps: AdditionalArtProps;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSetDressing: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalCostumes: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSpecialEffects: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  vfxEquipment: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  pyrotechnics: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  smokeMachines: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  fogMachines: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  windMachines: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  rainMachines: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  snowMachines: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  animatronics: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  prosthetics: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  bloodEffects: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  makeupEffects: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  setEffects: string[];

  @Prop({ type: AdditionalArtProps, default: () => ({}) })
  props: AdditionalArtProps;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  costumes: string[];
}

@Schema({ _id: false })
export class AdditionalProductionEquipment {
  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalScheduling: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalSafety: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  additionalTransportation: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  safetyGear: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  fireSuppression: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  medicalEquipment: string[];

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  emergencyEquipment: string[];
}

@Schema({ _id: false })
export class AdditionalEquipment {
  @Prop({ type: AdditionalCinematographyEquipment, default: () => ({}) })
  cinematography: AdditionalCinematographyEquipment;

  @Prop({ type: AdditionalLightingEquipment, default: () => ({}) })
  lighting: AdditionalLightingEquipment;

  @Prop({ type: AdditionalSoundEquipment, default: () => ({}) })
  sound: AdditionalSoundEquipment;

  @Prop({ type: AdditionalArtEquipment, default: () => ({}) })
  art: AdditionalArtEquipment;

  @Prop({ type: AdditionalProductionEquipment, default: () => ({}) })
  production: AdditionalProductionEquipment;

  @Prop({ type: [String], default: [], trim: true, maxlength: 100 })
  etc: string[];
}

@Schema({ _id: false })
export class CutDelta {
  @Prop({ type: AdditionalCrew, default: () => ({}) })
  additionalCrew: AdditionalCrew;

  @Prop({ type: AdditionalEquipment, default: () => ({}) })
  additionalEquipment: AdditionalEquipment;
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

  // 컷별 델타 - Scene 대비 추가 인력 및 장비
  @Prop({ type: CutDelta, default: () => ({}) })
  cutDelta: CutDelta;
}

export const CutSchema = SchemaFactory.createForClass(Cut);
