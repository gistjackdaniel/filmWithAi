import { Document } from 'mongoose';
export interface LightSetup {
    type: string;
    equipment: string;
    intensity: string;
}
export declare class LightSetupClass {
    type: string;
    equipment: string;
    intensity: string;
}
export type LightSetupDocument = LightSetup & Document;
export declare const LightSetupSchema: import("mongoose").Schema<LightSetupClass, import("mongoose").Model<LightSetupClass, any, any, any, Document<unknown, any, LightSetupClass, any> & LightSetupClass & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LightSetupClass, Document<unknown, {}, import("mongoose").FlatRecord<LightSetupClass>, {}> & import("mongoose").FlatRecord<LightSetupClass> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
