import { Dialogue } from '../interface/dialogue.interface';
import { LightSetup } from '../interface/light-setup.interface';
import { GripModifier } from '../interface/grip-modifier.interface';
import { LightOverall } from '../interface/light-overall.interface';
import { LightingSetup } from '../interface/lighting-setup.interface';
import { Lighting } from '../interface/lighting.interface';
import { RealLocation } from '../interface/scene-location.interface';
import { CrewRole } from '../interface/crew-role.interface';
import { Production } from '../interface/production.interface';
import { Cinematography } from '../interface/cinematography.interface';
import { LightingCrew } from '../interface/lighting-crew.interface';
import { Sound } from '../interface/sound.interface';
import { Art } from '../interface/art.interface';
import { Crew } from '../interface/crew.interface';
import { DirectionEquipment } from '../interface/direction-equipment.interface';
import { ProductionEquipment } from '../interface/production-equipment.interface';
import { CinematographyEquipment } from '../interface/cinematography-equipment.interface';
import { LightingEquipment } from '../interface/lighting-equipment.interface';
import { SoundEquipment } from '../interface/sound-equipment.interface';
import { ArtProps } from '../interface/art-props.interface';
import { ArtEquipment } from '../interface/art-equipment.interface';
import { CrewMember } from '../interface/crew-memeber.interface';
import { CastMember } from '../interface/cast-member.interface';
import { ExtraMember } from '../interface/extra-member.interface';
export declare class DialogueDto implements Dialogue {
    character?: string;
    text?: string;
}
export declare class LightSetupDto implements LightSetup {
    type?: string;
    equipment?: string;
    intensity?: string;
}
export declare class GripModifierDto implements GripModifier {
    flags?: string[];
    diffusion?: string[];
    reflectors?: string[];
    colorGels?: string[];
}
export declare class LightOverallDto implements LightOverall {
    colorTemperature?: string;
    mood?: string;
}
export declare class LightingSetupDto implements LightingSetup {
    keyLight?: LightSetupDto;
    fillLight?: LightSetupDto;
    backLight?: LightSetupDto;
    backgroundLight?: LightSetupDto;
    specialEffects?: LightSetupDto;
    softLight?: LightSetupDto;
    gripModifier?: GripModifierDto;
    overall?: LightOverallDto;
}
export declare class LightingDto implements Lighting {
    description?: string;
    setup?: LightingSetupDto;
}
export declare class RealLocationDto implements RealLocation {
    name?: string;
    address?: string;
    group_name?: string;
}
export declare class CrewRoleDto implements CrewRole {
    director?: CrewMember[];
    assistantDirector?: CrewMember[];
    scriptSupervisor?: CrewMember[];
    continuity?: CrewMember[];
}
export declare class ProductionDto implements Production {
    producer?: CrewMember[];
    lineProducer?: CrewMember[];
    productionManager?: CrewMember[];
    productionAssistant?: CrewMember[];
}
export declare class CinematographyDto implements Cinematography {
    cinematographer?: CrewMember[];
    cameraOperator?: CrewMember[];
    firstAssistant?: CrewMember[];
    secondAssistant?: CrewMember[];
    dollyGrip?: CrewMember[];
}
export declare class LightingCrewDto implements LightingCrew {
    gaffer?: CrewMember[];
    bestBoy?: CrewMember[];
    electrician?: CrewMember[];
    generatorOperator?: CrewMember[];
}
export declare class SoundDto implements Sound {
    soundMixer?: CrewMember[];
    boomOperator?: CrewMember[];
    soundAssistant?: CrewMember[];
    utility?: CrewMember[];
}
export declare class ArtDto implements Art {
    productionDesigner?: CrewMember[];
    artDirector?: CrewMember[];
    setDecorator?: CrewMember[];
    propMaster?: CrewMember[];
    makeupArtist?: CrewMember[];
    costumeDesigner?: CrewMember[];
    hairStylist?: CrewMember[];
}
export declare class CrewDto implements Crew {
    direction?: CrewRoleDto;
    production?: ProductionDto;
    cinematography?: CinematographyDto;
    lighting?: LightingCrewDto;
    sound?: SoundDto;
    art?: ArtDto;
}
export declare class DirectionEquipmentDto implements DirectionEquipment {
    monitors?: string[];
    communication?: string[];
    scriptBoards?: string[];
}
export declare class ProductionEquipmentDto implements ProductionEquipment {
    scheduling?: string[];
    safety?: string[];
    transportation?: string[];
}
export declare class CinematographyEquipmentDto implements CinematographyEquipment {
    cameras?: string[];
    lenses?: string[];
    supports?: string[];
    filters?: string[];
    accessories?: string[];
}
export declare class LightingEquipmentDto implements LightingEquipment {
    keyLights?: string[];
    fillLights?: string[];
    backLights?: string[];
    backgroundLights?: string[];
    specialEffectsLights?: string[];
    softLights?: string[];
    gripModifiers?: GripModifierDto;
    power?: string[];
}
export declare class SoundEquipmentDto implements SoundEquipment {
    microphones?: string[];
    recorders?: string[];
    wireless?: string[];
    monitoring?: string[];
}
export declare class ArtPropsDto implements ArtProps {
    characterProps?: string[];
    setProps?: string[];
}
export declare class ArtEquipmentDto implements ArtEquipment {
    setConstruction?: string[];
    props?: ArtPropsDto;
    setDressing?: string[];
    costumes?: string[];
    specialEffects?: string[];
}
export declare class EquipmentDto {
    direction?: DirectionEquipmentDto;
    production?: ProductionEquipmentDto;
    cinematography?: CinematographyEquipmentDto;
    lighting?: LightingEquipmentDto;
    sound?: SoundEquipmentDto;
    art?: ArtEquipmentDto;
}
export declare class CastMemberDto implements CastMember {
    role: string;
    name: string;
    profileId?: string;
}
export declare class ExtraMemberDto implements ExtraMember {
    role: string;
    number: number;
}
export declare class CreateSceneRequestDto {
    title: string;
    description: string;
    dialogues: DialogueDto[];
    weather: string;
    lighting: LightingDto;
    visualDescription: string;
    scenePlace: string;
    sceneDateTime: string;
    vfxRequired: boolean;
    sfxRequired: boolean;
    estimatedDuration: string;
    location: RealLocationDto;
    timeOfDay: string;
    crew: CrewDto;
    equipment: EquipmentDto;
    cast: CastMemberDto[];
    extra: ExtraMemberDto[];
    specialRequirements: string[];
    order: number;
}
export declare class UpdateSceneRequestDto {
    title?: string;
    description?: string;
    dialogues?: DialogueDto[];
    weather?: string;
    lighting?: LightingDto;
    visualDescription?: string;
    scenePlace?: string;
    sceneDateTime?: string;
    vfxRequired?: boolean;
    sfxRequired?: boolean;
    estimatedDuration?: string;
    location?: RealLocationDto;
    timeOfDay?: string;
    crew?: CrewDto;
    equipment?: EquipmentDto;
    cast?: CastMemberDto[];
    extra?: ExtraMemberDto[];
    specialRequirements?: string[];
    order?: number;
}
export declare class CreateSceneDraftRequestDto {
    maxScenes: number;
}
