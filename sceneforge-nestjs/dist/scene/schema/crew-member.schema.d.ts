import { Types } from "mongoose";
export declare class CrewMember {
    role: string;
    contact: string;
    profileId?: Types.ObjectId;
}
export declare const CrewMemberSchema: import("mongoose").Schema<CrewMember, import("mongoose").Model<CrewMember, any, any, any, import("mongoose").Document<unknown, any, CrewMember, any> & CrewMember & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CrewMember, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<CrewMember>, {}> & import("mongoose").FlatRecord<CrewMember> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
