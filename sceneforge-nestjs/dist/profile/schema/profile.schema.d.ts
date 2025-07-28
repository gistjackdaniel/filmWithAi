import { Document, Types } from 'mongoose';
export type ProfileDocument = Profile & Document;
export declare class ProjectReference {
    projectId: Types.ObjectId;
    lastViewedAt?: Date;
    isFavorite: boolean;
}
export declare const ProjectReferenceSchema: import("mongoose").Schema<ProjectReference, import("mongoose").Model<ProjectReference, any, any, any, Document<unknown, any, ProjectReference, any> & ProjectReference & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ProjectReference, Document<unknown, {}, import("mongoose").FlatRecord<ProjectReference>, {}> & import("mongoose").FlatRecord<ProjectReference> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Profile {
    _id: Types.ObjectId;
    googleId: string;
    email: string;
    name: string;
    picture: string;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    projects: ProjectReference[];
}
export declare const ProfileSchema: import("mongoose").Schema<Profile, import("mongoose").Model<Profile, any, any, any, Document<unknown, any, Profile, any> & Profile & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Profile, Document<unknown, {}, import("mongoose").FlatRecord<Profile>, {}> & import("mongoose").FlatRecord<Profile> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
