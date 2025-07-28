import { Document, Types } from 'mongoose';
export type ProjectDocument = Project & Document;
export declare class Project {
    _id: Types.ObjectId;
    ownerId: Types.ObjectId;
    title: string;
    synopsis?: string;
    story?: string;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastViewedAt: Date;
    isDeleted: boolean;
    participants: Types.ObjectId[];
    scenes: Types.ObjectId[];
    genre: string[];
    estimatedDuration: string;
}
export declare const ProjectSchema: import("mongoose").Schema<Project, import("mongoose").Model<Project, any, any, any, Document<unknown, any, Project, any> & Project & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Project, Document<unknown, {}, import("mongoose").FlatRecord<Project>, {}> & import("mongoose").FlatRecord<Project> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
