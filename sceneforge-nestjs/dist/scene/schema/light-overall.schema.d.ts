import { Document } from 'mongoose';
export type LightOverallDocument = LightOverall & Document;
export declare class LightOverall {
    colorTemperature: string;
    mood: string;
}
export declare const LightOverallSchema: import("mongoose").Schema<LightOverall, import("mongoose").Model<LightOverall, any, any, any, Document<unknown, any, LightOverall, any> & LightOverall & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LightOverall, Document<unknown, {}, import("mongoose").FlatRecord<LightOverall>, {}> & import("mongoose").FlatRecord<LightOverall> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
