import { Types } from 'mongoose';
export declare class CameraSettingsResponseDto {
    aperture: string;
    shutterSpeed: string;
    iso: string;
}
export declare class SubjectResponseDto {
    name: string;
    type: string;
    position: string;
    action: string;
    emotion: string;
    description: string;
}
export declare class SpecialCinematographyResponseDto {
    drone: boolean;
    crane: boolean;
    jib: boolean;
    underwater: boolean;
    aerial: boolean;
}
export declare class SpecialEffectsResponseDto {
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
export declare class SpecialLightingResponseDto {
    laser: boolean;
    strobe: boolean;
    blackLight: boolean;
    uvLight: boolean;
    movingLight: boolean;
    colorChanger: boolean;
}
export declare class SafetyResponseDto {
    requiresMedic: boolean;
    requiresFireSafety: boolean;
    requiresSafetyOfficer: boolean;
}
export declare class SpecialRequirementsResponseDto {
    specialCinematography: SpecialCinematographyResponseDto;
    specialEffects: SpecialEffectsResponseDto;
    specialLighting: SpecialLightingResponseDto;
    safety: SafetyResponseDto;
}
export declare class CameraSetupResponseDto {
    shotSize: string;
    angleDirection: string;
    cameraMovement: string;
    lensSpecs: string;
    cameraSettings: CameraSettingsResponseDto;
}
export declare class CutResponseDto {
    _id: Types.ObjectId;
    sceneId: Types.ObjectId;
    projectId: Types.ObjectId;
    title: string;
    description: string;
    cameraSetup: CameraSetupResponseDto;
    vfxEffects: string;
    soundEffects: string;
    directorNotes: string;
    dialogue: string;
    narration: string;
    subjectMovement: SubjectResponseDto[];
    productionMethod: string;
    productionMethodReason: string;
    estimatedDuration: number;
    specialRequirements: SpecialRequirementsResponseDto;
    imageUrl?: string;
    order: number;
    isDeleted: boolean;
}
