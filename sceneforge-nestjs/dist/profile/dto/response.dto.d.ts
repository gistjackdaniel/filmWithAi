import { Types } from 'mongoose';
import { ProjectReference } from '../schema/profile.schema';
export declare class ProfileResponseDto {
    _id: Types.ObjectId;
    googleId: string;
    email: string;
    name: string;
    picture?: string;
    lastLoginAt: Date;
    createdAt: Date;
    updatedAt: Date;
    projects: ProjectReference[];
}
