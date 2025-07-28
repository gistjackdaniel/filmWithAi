import { Types } from 'mongoose';
export declare class ProjectResponseDto {
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
export declare class CreateStoryResponseDto {
    story: string;
}
