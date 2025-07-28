import { Model } from 'mongoose';
import { ProfileDocument } from './schema/profile.schema';
import { CreateProfileRequestDto, DeleteProfileRequestDto } from './dto/request.dto';
import { ProfileResponseDto } from './dto/response.dto';
export declare class ProfileService {
    private profileModel;
    constructor(profileModel: Model<ProfileDocument>);
    findProfileById(profileId: string): Promise<ProfileResponseDto>;
    createProfile(createProfileDto: CreateProfileRequestDto): Promise<ProfileResponseDto>;
    createOrUpdateLastLogin(createProfileRequestDto: CreateProfileRequestDto): Promise<ProfileDocument>;
    deleteProfile(deleteProfileDto: DeleteProfileRequestDto): Promise<ProfileResponseDto>;
    updateLastLogin(googleId: string): Promise<ProfileResponseDto>;
    pushProject(profileId: string, projectId: string): Promise<boolean>;
    pullProject(profileId: string, projectId: string): Promise<boolean>;
    pushFavorite(profileId: string, projectId: string): Promise<ProfileResponseDto>;
    pullFavorite(profileId: string, projectId: string): Promise<ProfileResponseDto>;
}
