import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schema/profile.schema';
import { CreateProfileRequestDto, DeleteProfileRequestDto, FindProfileRequestDto } from './dto/request.dto';
import { ProfileResponseDto } from './dto/response.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async findProfileById(profileId: string) : Promise<ProfileResponseDto> {
    const profile = await this.profileModel.findById(profileId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async createProfile(createProfileDto: CreateProfileRequestDto) : Promise<ProfileResponseDto> {
    const createdProfile = new this.profileModel(createProfileDto);
    const savedProfile = await createdProfile.save();

    return savedProfile;
  }

  async createOrUpdateLastLogin(createProfileRequestDto: CreateProfileRequestDto) : Promise<ProfileDocument> {
    const updatedProfile = await this.profileModel.findOneAndUpdate({ googleId: createProfileRequestDto.googleId }, { lastLoginAt: new Date() }, { new: false });
    if (!updatedProfile) {
      const createdProfile = new this.profileModel(createProfileRequestDto);
      const savedProfile = await createdProfile.save();

      return savedProfile;
    }

    return updatedProfile;
  }

  async deleteProfile(deleteProfileDto: DeleteProfileRequestDto) : Promise<ProfileResponseDto> {
    const deletedProfile = await this.profileModel.findOneAndUpdate({ _id: deleteProfileDto.profileId }, { isDeleted: true });
    if (!deletedProfile) {
      throw new NotFoundException('Profile not found');
    }

    return deletedProfile;
  }

  async updateLastLogin(googleId: string) : Promise<ProfileResponseDto> {
    const updatedProfile = await this.profileModel.findOneAndUpdate({ googleId }, { lastLoginAt: new Date() }, { new: false });
    if (!updatedProfile) {
      throw new NotFoundException('Profile not found');
    }

    return updatedProfile
  }

  async pushProject(profileId: string, projectId: string): Promise<boolean> {
    const profile = await this.profileModel.findOne({
      _id: profileId,
      isDeleted: false,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (profile.projects.find(project => project.projectId.toString() === projectId)) {
      return false;
    }

    profile.projects.push({ projectId: new Types.ObjectId(projectId), isFavorite: false });
    await profile.save();

    return true;
  }

  async pullProject(profileId: string, projectId: string): Promise<boolean> {
    const profile = await this.profileModel.findOne({
      _id: profileId,
      isDeleted: false,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
    if (idx === -1) {
      throw new NotFoundException('Project not found');
    }

    profile.projects.splice(idx, 1);
    await profile.save();

    return true;
  }

  async pushFavorite(profileId: string, projectId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileModel.findOne({
      _id: profileId,
      isDeleted: false,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }


    const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
    if (idx === -1) {
      throw new NotFoundException('Project not found');
    }

    if (profile.projects[idx].isFavorite) {
      throw new BadRequestException('Project is already favorite');
    }

    profile.projects[idx].isFavorite = true;
    const savedProfile = await profile.save();

    return savedProfile;
  }

  async pullFavorite(profileId: string, projectId: string): Promise<ProfileResponseDto> {
    const profile = await this.profileModel.findOne({
      _id: profileId,
      isDeleted: false,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const idx = profile.projects.findIndex(project => project.projectId.toString() === projectId);
    if (idx === -1) {
      throw new NotFoundException('Project not found');
    }

    if (!profile.projects[idx].isFavorite) {
      throw new BadRequestException('Project is not favorite');
    }

    profile.projects[idx].isFavorite = false;
    const savedProfile = await profile.save();

    return savedProfile;
  }
} 