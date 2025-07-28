import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schema/project.schema';
import { ProfileService } from '../profile/profile.service';


import {
  CreateProjectRequestDto,
  UpdateProjectRequestDto,
  SearchProjectRequestDto,
  FindProjectDetailRequestDto,
  DeleteProjectRequestDto,
  RestoreProjectRequestDto,
  PushFavoriteRequestDto,
  PullFavoriteRequestDto,
} from './dto/request.dto';

import {
  ProjectResponseDto,
} from './dto/response.dto';
  
@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    private readonly profileService: ProfileService,
  ) {}

  async create(ownerId: string, createProjectRequestDto: CreateProjectRequestDto): Promise<ProjectResponseDto> {
    const createdProject = new this.projectModel({
      ...createProjectRequestDto,
      ownerId: new Types.ObjectId(ownerId),
      participants: [new Types.ObjectId(ownerId)],
    });

    const pushResult = await this.profileService.pushProject(ownerId, createdProject._id.toString());
    if (!pushResult) {
      throw new BadRequestException();
    }

    const savedProject = await createdProject.save();
    return savedProject;
  }

  async searchParticipatingProjects(searchProjectRequestDto: SearchProjectRequestDto): Promise<ProjectResponseDto[]> {
    const result = await this.projectModel.find({
      participants: { $in: [new Types.ObjectId(searchProjectRequestDto.profileId)] },
      isDeleted: false,
    });

    return result;
  }

  async findById(projectId: string): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      isDeleted: false,
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }

  async findParticipatingOne(findProjectDetailRequestDto: FindProjectDetailRequestDto): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(findProjectDetailRequestDto._id),
      participants: { $in: [new Types.ObjectId(findProjectDetailRequestDto.profileId)] },
      isDeleted: false,
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }


  async update(
    ownerId: string,
    projectId: string,
    updateProjectRequestDto: UpdateProjectRequestDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(projectId),
        ownerId: new Types.ObjectId(ownerId),
        isDeleted: false,
      },
      { ...updateProjectRequestDto, updatedAt: new Date() },
      { new: false },
    );

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }

  async delete(deleteProjectRequestDto: DeleteProjectRequestDto): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(deleteProjectRequestDto._id),
        ownerId: new Types.ObjectId(deleteProjectRequestDto.profileId),
        isDeleted: false,
      },
      { isDeleted: true },
      { new: false },
    );

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    for (const participant of project.participants) {
      const pullResult = await this.profileService.pullProject(participant.toString(), project._id.toString());
      if (!pullResult) {
        console.error(`Failed to pull project ${project._id.toString()} from participant ${participant.toString()}`);
      }
    }

    return project;
  }

  async updateLastViewed(profileId: string, projectId: string): Promise<void> {
    await this.projectModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(projectId),
        participants: { $in: [new Types.ObjectId(profileId)] },
        isDeleted: false,
      },
      { lastViewedAt: new Date() },
    );
  }

  async restoreProject(restoreProjectRequestDto: RestoreProjectRequestDto): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOneAndUpdate(
      {
        _id: restoreProjectRequestDto.projectId,
        ownerId: new Types.ObjectId(restoreProjectRequestDto.profileId),
        isDeleted: true,
      },
      { isDeleted: false },
      { new: false },
    );

    if (!project) {
      throw new NotFoundException('삭제된 프로젝트를 찾을 수 없습니다.');
    }

    return project;
  }
  
  async searchFavorites(searchProjectRequestDto: SearchProjectRequestDto): Promise<ProjectResponseDto[]> {
    const profile = await this.profileService.findProfileById(searchProjectRequestDto.profileId);

    if (!profile) {
      throw new NotFoundException('프로필을 찾을 수 없습니다.');
    }

    const projects = await this.projectModel.find({
      _id: { $in: profile.projects.filter(project => project.isFavorite).map(project => project.projectId) },
      isDeleted: false,
    });

    return projects;
  }
} 