import { Document, Types } from 'mongoose';
import { Dialogue } from './dialogue.schema';
import { LightSetup } from './light-setup.schema';
import { GripModifier } from './grip-modifier.schema';
import { LightOverall } from './light-overall.schema';
import { CrewMember } from './crew-member.schema';
import { CastMember } from './cast-member.schema';
import { ExtraMember } from './extra-member.schema';
export type SceneDocument = Scene & Document;
export declare class Scene {
    _id: Types.ObjectId;
    projectId: Types.ObjectId;
    title: string;
    description: string;
    dialogues: Dialogue[];
    weather: string;
    lighting: {
        description: string;
        setup: {
            keyLight: LightSetup;
            fillLight: LightSetup;
            backLight: LightSetup;
            backgroundLight: LightSetup;
            specialEffects: LightSetup;
            softLight: LightSetup;
            gripModifier: GripModifier;
            overall: LightOverall;
        };
    };
    visualDescription: string;
    scenePlace: string;
    sceneDateTime: string;
    vfxRequired: boolean;
    sfxRequired: boolean;
    estimatedDuration: string;
    location: {
        name: string;
        address: string;
        group_name: string;
    };
    timeOfDay: string;
    crew: {
        direction: {
            director: CrewMember[];
            assistantDirector: CrewMember[];
            scriptSupervisor: CrewMember[];
            continuity: CrewMember[];
        };
        production: {
            producer: CrewMember[];
            lineProducer: CrewMember[];
            productionManager: CrewMember[];
            productionAssistant: CrewMember[];
        };
        cinematography: {
            cinematographer: CrewMember[];
            cameraOperator: CrewMember[];
            firstAssistant: CrewMember[];
            secondAssistant: CrewMember[];
            dollyGrip: CrewMember[];
        };
        lighting: {
            gaffer: CrewMember[];
            bestBoy: CrewMember[];
            electrician: CrewMember[];
            generatorOperator: CrewMember[];
        };
        sound: {
            soundMixer: CrewMember[];
            boomOperator: CrewMember[];
            soundAssistant: CrewMember[];
            utility: CrewMember[];
        };
        art: {
            productionDesigner: CrewMember[];
            artDirector: CrewMember[];
            setDecorator: CrewMember[];
            propMaster: CrewMember[];
            makeupArtist: CrewMember[];
            costumeDesigner: CrewMember[];
            hairStylist: CrewMember[];
        };
    };
    equipment: {
        direction: {
            monitors: string[];
            communication: string[];
            scriptBoards: string[];
        };
        production: {
            scheduling: string[];
            safety: string[];
            transportation: string[];
        };
        cinematography: {
            cameras: string[];
            lenses: string[];
            supports: string[];
            filters: string[];
            accessories: string[];
        };
        lighting: {
            keyLights: string[];
            fillLights: string[];
            backLights: string[];
            backgroundLights: string[];
            specialEffectsLights: string[];
            softLights: string[];
            gripModifiers: {
                flags: string[];
                diffusion: string[];
                reflectors: string[];
                colorGels: string[];
            };
            power: string[];
        };
        sound: {
            microphones: string[];
            recorders: string[];
            wireless: string[];
            monitoring: string[];
        };
        art: {
            setConstruction: string[];
            props: {
                characterProps: string[];
                setProps: string[];
            };
            setDressing: string[];
            costumes: string[];
            specialEffects: string[];
        };
    };
    cast: CastMember[];
    extra: ExtraMember[];
    specialRequirements: string[];
    order: number;
    isDeleted: boolean;
}
export declare const SceneSchema: import("mongoose").Schema<Scene, import("mongoose").Model<Scene, any, any, any, Document<unknown, any, Scene, any> & Scene & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Scene, Document<unknown, {}, import("mongoose").FlatRecord<Scene>, {}> & import("mongoose").FlatRecord<Scene> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
