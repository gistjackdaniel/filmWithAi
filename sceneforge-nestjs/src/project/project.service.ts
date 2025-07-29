import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schema/project.schema';
import { ProfileService } from '../profile/profile.service';
import { AiService } from 'src/ai/ai.service';

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
    private readonly aiService: AiService,
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

  async generateStory(projectId: string): Promise<ProjectResponseDto> {
    const project = await this.projectModel.findOne({
      _id: new Types.ObjectId(projectId),
      isDeleted: false,
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    const prompt = this.generateStoryPrompt(project);

    const story = await this.aiService.callChatCompletions([
      {
        role: 'system',
        content:
          '당신은 영화 스토리 작가입니다. 창의적이고 매력적인 스토리를 작성해주세요.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'gpt-4o',
      max_tokens: 4000,
      temperature: 0.8,
    });

    project.story = story;

    await project.save();

    return project;
  }

  generateStoryPrompt(project: ProjectResponseDto): string {
    return `다음 시놉시스를 바탕으로 영화 스토리를 생성해주세요.

시놉시스: ${project.synopsis}
장르: ${JSON.stringify(project.genre)}
최대 길이: ${project.estimatedDuration}

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

한국어로 자연스럽게 작성해주세요.
`;
  }
} 