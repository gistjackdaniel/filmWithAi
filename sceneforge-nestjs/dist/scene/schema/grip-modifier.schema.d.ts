import { Document } from 'mongoose';
export type GripModifierDocument = GripModifier & Document;
export declare class GripModifier {
    flags: string[];
    diffusion: string[];
    reflectors: string[];
    colorGels: string[];
}
export declare const GripModifierSchema: import("mongoose").Schema<GripModifier, import("mongoose").Model<GripModifier, any, any, any, Document<unknown, any, GripModifier, any> & GripModifier & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, GripModifier, Document<unknown, {}, import("mongoose").FlatRecord<GripModifier>, {}> & import("mongoose").FlatRecord<GripModifier> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
