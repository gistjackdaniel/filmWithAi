import { Document } from 'mongoose';
export type DialogueDocument = Dialogue & Document;
export declare class Dialogue {
    character: string;
    text: string;
}
export declare const DialogueSchema: import("mongoose").Schema<Dialogue, import("mongoose").Model<Dialogue, any, any, any, Document<unknown, any, Dialogue, any> & Dialogue & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Dialogue, Document<unknown, {}, import("mongoose").FlatRecord<Dialogue>, {}> & import("mongoose").FlatRecord<Dialogue> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
