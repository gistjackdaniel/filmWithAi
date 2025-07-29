import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

import {
  CreateProjectRequestDto,
  UpdateProjectRequestDto,
} from './dto/request.dto';

import {
  ProjectResponseDto,
} from './dto/response.dto';

@ApiTags('Project')
@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiResponse({ status: 201, description: '프로젝트 생성 성공', type: ProjectResponseDto })
  @ApiBody({ type: CreateProjectRequestDto })
  async create(@CurrentUser() user: JwtPayload, @Body() createProjectDto: CreateProjectRequestDto): Promise<ProjectResponseDto> {
    const project = await this.projectsService.create(user.profileId, createProjectDto);
    return project;
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자 프로젝트 목록 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 목록 조회 성공', type: [ProjectResponseDto] })
  async searchParticipatingProjects(@CurrentUser() user: JwtPayload): Promise<ProjectResponseDto[]> {
    const projects = await this.projectsService.searchParticipatingProjects({
      profileId: user.profileId,
    });
    return projects;
  }

  @Get('favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: '즐겨찾기 프로젝트 목록 조회' })
  @ApiResponse({ status: 200, description: '즐겨찾기 프로젝트 목록 조회 성공', type: [ProjectResponseDto] })
  async searchFavorites(@CurrentUser() user: JwtPayload) : Promise<ProjectResponseDto[]> {
    const result = await this.projectsService.searchFavorites({
      profileId: user.profileId,
    });
    return result;
  }
  
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 조회 성공', type: ProjectResponseDto })
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ProjectResponseDto> {
    const project = await this.projectsService.findParticipatingOne({ profileId: user.profileId, _id: id });
    return project;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 수정' })
  @ApiResponse({ status: 200, description: '프로젝트 수정 성공', type: ProjectResponseDto })
  @ApiBody({ type: UpdateProjectRequestDto })
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() updateProjectDto: UpdateProjectRequestDto): Promise<ProjectResponseDto> {
    const result = await this.projectsService.update(user.profileId, id, updateProjectDto);
    return result;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 삭제' })
  @ApiResponse({ status: 200, description: '프로젝트 삭제 성공', type: ProjectResponseDto })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ProjectResponseDto> {
    const result = await this.projectsService.delete({
      profileId: user.profileId,
      _id: id,
    });
    return result;
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 복원' })
  @ApiResponse({ status: 200, description: '프로젝트 복원 성공', type: ProjectResponseDto })
  async restoreProject(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ProjectResponseDto> {
    const result = await this.projectsService.restoreProject({
      profileId: user.profileId,
      projectId: id,
    });
    return result;
  }

  @Post(':id/generate-story')
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 스토리 생성' })
  @ApiResponse({ status: 200, description: '프로젝트 스토리 생성 성공', type: ProjectResponseDto })
  async generateStory(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<ProjectResponseDto> {
    const result = await this.projectsService.generateStory(id);
    return result;
  }
} 