import { Types } from 'mongoose';
export declare class DialogueResponseDto {
    character: string;
    text: string;
}
export declare class LightSetupResponseDto {
    type: string;
    equipment: string;
    intensity: string;
}
export declare class GripModifierResponseDto {
    flags: string[];
    diffusion: string[];
    reflectors: string[];
    colorGels: string[];
}
export declare class LightOverallResponseDto {
    colorTemperature: string;
    mood: string;
}
export declare class LightingSetupResponseDto {
    keyLight: LightSetupResponseDto;
    fillLight: LightSetupResponseDto;
    backLight: LightSetupResponseDto;
    backgroundLight: LightSetupResponseDto;
    specialEffects: LightSetupResponseDto;
    softLight: LightSetupResponseDto;
    gripModifier: GripModifierResponseDto;
    overall: LightOverallResponseDto;
}
export declare class LightingResponseDto {
    description: string;
    setup: LightingSetupResponseDto;
}
export declare class RealLocationResponseDto {
    name: string;
    address: string;
    group_name: string;
}
export declare class CrewMemberResponseDto {
    role: string;
    profileId?: Types.ObjectId;
}
export declare class CrewRoleResponseDto {
    director: CrewMemberResponseDto[];
    assistantDirector: CrewMemberResponseDto[];
    scriptSupervisor: CrewMemberResponseDto[];
    continuity: CrewMemberResponseDto[];
}
export declare class ProductionResponseDto {
    producer: CrewMemberResponseDto[];
    lineProducer: CrewMemberResponseDto[];
    productionManager: CrewMemberResponseDto[];
    productionAssistant: CrewMemberResponseDto[];
}
export declare class CinematographyResponseDto {
    cinematographer: CrewMemberResponseDto[];
    cameraOperator: CrewMemberResponseDto[];
    firstAssistant: CrewMemberResponseDto[];
    secondAssistant: CrewMemberResponseDto[];
    dollyGrip: CrewMemberResponseDto[];
}
export declare class LightingCrewResponseDto {
    gaffer: CrewMemberResponseDto[];
    bestBoy: CrewMemberResponseDto[];
    electrician: CrewMemberResponseDto[];
    generatorOperator: CrewMemberResponseDto[];
}
export declare class SoundResponseDto {
    soundMixer: CrewMemberResponseDto[];
    boomOperator: CrewMemberResponseDto[];
    soundAssistant: CrewMemberResponseDto[];
    utility: CrewMemberResponseDto[];
}
export declare class ArtResponseDto {
    productionDesigner: CrewMemberResponseDto[];
    artDirector: CrewMemberResponseDto[];
    setDecorator: CrewMemberResponseDto[];
    propMaster: CrewMemberResponseDto[];
    makeupArtist: CrewMemberResponseDto[];
    costumeDesigner: CrewMemberResponseDto[];
    hairStylist: CrewMemberResponseDto[];
}
export declare class CrewResponseDto {
    direction: CrewRoleResponseDto;
    production: ProductionResponseDto;
    cinematography: CinematographyResponseDto;
    lighting: LightingCrewResponseDto;
    sound: SoundResponseDto;
    art: ArtResponseDto;
}
export declare class DirectionEquipmentResponseDto {
    monitors: string[];
    communication: string[];
    scriptBoards: string[];
}
export declare class ProductionEquipmentResponseDto {
    scheduling: string[];
    safety: string[];
    transportation: string[];
}
export declare class CinematographyEquipmentResponseDto {
    cameras: string[];
    lenses: string[];
    supports: string[];
    filters: string[];
    accessories: string[];
}
export declare class LightingEquipmentResponseDto {
    keyLights: string[];
    fillLights: string[];
    backLights: string[];
    backgroundLights: string[];
    specialEffectsLights: string[];
    softLights: string[];
    gripModifiers: GripModifierResponseDto;
    power: string[];
}
export declare class SoundEquipmentResponseDto {
    microphones: string[];
    recorders: string[];
    wireless: string[];
    monitoring: string[];
}
export declare class ArtPropsResponseDto {
    characterProps: string[];
    setProps: string[];
}
export declare class ArtEquipmentResponseDto {
    setConstruction: string[];
    props: ArtPropsResponseDto;
    setDressing: string[];
    costumes: string[];
    specialEffects: string[];
}
export declare class EquipmentResponseDto {
    direction: DirectionEquipmentResponseDto;
    production: ProductionEquipmentResponseDto;
    cinematography: CinematographyEquipmentResponseDto;
    lighting: LightingEquipmentResponseDto;
    sound: SoundEquipmentResponseDto;
    art: ArtEquipmentResponseDto;
}
export declare class CastMemberResponseDto {
    role: string;
    name: string;
    profileId?: Types.ObjectId;
}
export declare class ExtraMemberResponseDto {
    role: string;
    number: number;
}
export declare class SceneResponseDto {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    title: string;
    description: string;
    dialogues: DialogueResponseDto[];
    weather: string;
    lighting: LightingResponseDto;
    visualDescription: string;
    sceneDateTime: string;
    vfxRequired: boolean;
    sfxRequired: boolean;
    estimatedDuration: string;
    scenePlace: string;
    location: RealLocationResponseDto;
    timeOfDay: string;
    crew: CrewResponseDto;
    equipment: EquipmentResponseDto;
    cast: CastMemberResponseDto[];
    extra: ExtraMemberResponseDto[];
    specialRequirements: string[];
    order: number;
    isDeleted: boolean;
}
