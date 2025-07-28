import { Document, Types } from 'mongoose';
export declare class CameraSettings {
    aperture: string;
    shutterSpeed: string;
    iso: string;
}
export declare class Subject {
    name: string;
    type: string;
    position: string;
    action: string;
    emotion: string;
    description: string;
}
export declare class SpecialCinematography {
    drone: boolean;
    crane: boolean;
    jib: boolean;
    underwater: boolean;
    aerial: boolean;
}
export declare class SpecialEffects {
    vfx: boolean;
    pyrotechnics: boolean;
    smoke: boolean;
    fog: boolean;
    wind: boolean;
    rain: boolean;
    snow: boolean;
    fire: boolean;
    explosion: boolean;
    stunt: boolean;
}
export declare class SpecialLighting {
    laser: boolean;
    strobe: boolean;
    blackLight: boolean;
    uvLight: boolean;
    movingLight: boolean;
    colorChanger: boolean;
}
export declare class Safety {
    requiresMedic: boolean;
    requiresFireSafety: boolean;
    requiresSafetyOfficer: boolean;
}
export declare class SpecialRequirements {
    specialCinematography: SpecialCinematography;
    specialEffects: SpecialEffects;
    specialLighting: SpecialLighting;
    safety: Safety;
}
export declare class CameraSetup {
    shotSize: string;
    angleDirection: string;
    cameraMovement: string;
    lensSpecs: string;
    cameraSettings: CameraSettings;
}
export declare class Cut extends Document {
    _id: Types.ObjectId;
    sceneId: Types.ObjectId;
    projectId: Types.ObjectId;
    order: number;
    title: string;
    description: string;
    cameraSetup: CameraSetup;
    vfxEffects: string;
    soundEffects: string;
    directorNotes: string;
    dialogue: string;
    narration: string;
    subjectMovement: Subject[];
    productionMethod: string;
    productionMethodReason: string;
    estimatedDuration: number;
    specialRequirements: SpecialRequirements;
    imageUrl?: string;
    isDeleted: boolean;
}
export declare const CutSchema: import("mongoose").Schema<Cut, import("mongoose").Model<Cut, any, any, any, Document<unknown, any, Cut, any> & Cut & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Cut, Document<unknown, {}, import("mongoose").FlatRecord<Cut>, {}> & import("mongoose").FlatRecord<Cut> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
