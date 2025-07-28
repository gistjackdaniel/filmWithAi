import { Types } from 'mongoose';
export declare class CameraSettingsDto {
    aperture?: string;
    shutterSpeed?: string;
    iso?: string;
}
export declare class SubjectDto {
    name: string;
    type: string;
    position?: string;
    action?: string;
    emotion?: string;
    description?: string;
}
export declare class SpecialCinematographyDto {
    drone?: boolean;
    crane?: boolean;
    jib?: boolean;
    underwater?: boolean;
    aerial?: boolean;
}
export declare class SpecialEffectsDto {
    vfx?: boolean;
    pyrotechnics?: boolean;
    smoke?: boolean;
    fog?: boolean;
    wind?: boolean;
    rain?: boolean;
    snow?: boolean;
    fire?: boolean;
    explosion?: boolean;
    stunt?: boolean;
}
export declare class SpecialLightingDto {
    laser?: boolean;
    strobe?: boolean;
    blackLight?: boolean;
    uvLight?: boolean;
    movingLight?: boolean;
    colorChanger?: boolean;
}
export declare class SafetyDto {
    requiresMedic?: boolean;
    requiresFireSafety?: boolean;
    requiresSafetyOfficer?: boolean;
}
export declare class SpecialRequirementsDto {
    specialCinematography?: SpecialCinematographyDto;
    specialEffects?: SpecialEffectsDto;
    specialLighting?: SpecialLightingDto;
    safety?: SafetyDto;
}
export declare class CameraSetupDto {
    shotSize?: string;
    angleDirection?: string;
    cameraMovement?: string;
    lensSpecs?: string;
    cameraSettings?: CameraSettingsDto;
}
export declare class CreateCutRequestDto {
    sceneId: Types.ObjectId;
    projectId: Types.ObjectId;
    order: number;
    title: string;
    description: string;
    cameraSetup?: CameraSetupDto;
    vfxEffects?: string;
    soundEffects?: string;
    directorNotes?: string;
    dialogue?: string;
    narration?: string;
    subjectMovement?: SubjectDto[];
    productionMethod?: string;
    productionMethodReason?: string;
    estimatedDuration?: number;
    specialRequirements?: SpecialRequirementsDto;
    imageUrl?: string;
}
export declare class UpdateCutRequestDto {
    title?: string;
    description?: string;
    cameraSetup?: CameraSetupDto;
    vfxEffects?: string;
    soundEffects?: string;
    directorNotes?: string;
    dialogue?: string;
    narration?: string;
    subjectMovement?: SubjectDto[];
    productionMethod?: string;
    productionMethodReason?: string;
    estimatedDuration?: number;
    specialRequirements?: SpecialRequirementsDto;
    imageUrl?: string;
    order?: number;
}
export declare class CreateCutDraftRequestDto {
    maxCuts: number;
    genre: string;
}
