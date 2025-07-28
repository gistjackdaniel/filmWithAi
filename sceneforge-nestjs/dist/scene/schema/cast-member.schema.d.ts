import { Types } from "mongoose";
export declare class CastMember {
    role: string;
    name: string;
    profileId?: Types.ObjectId;
}
export declare const CastMemberSchema: import("mongoose").Schema<CastMember, import("mongoose").Model<CastMember, any, any, any, import("mongoose").Document<unknown, any, CastMember, any> & CastMember & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CastMember, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<CastMember>, {}> & import("mongoose").FlatRecord<CastMember> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
