import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth 
} from '@nestjs/swagger';
import { 
  CreateSceneRequestDto, 
  UpdateSceneRequestDto, 
  CreateSceneDraftRequestDto
} from './dto/request.dto';
import { 
  SceneDraftResponseDto,
  SceneResponseDto
} from './dto/response.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { SceneService } from './scene.service';

@ApiTags('Scene')
@ApiBearerAuth()
@Controller('project/:projectId/scene')
@UseGuards(JwtAuthGuard)
export class SceneController {
  constructor(private readonly sceneService: SceneService) {}

  @Post()
  @ApiOperation({ summary: '씬 생성', description: '새로운 씬을 생성합니다.' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '씬이 성공적으로 생성되었습니다.',
    type: SceneResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  async create(@Param('projectId') projectId: string, @Body() createSceneDto: CreateSceneRequestDto): Promise<SceneResponseDto> {
    return this.sceneService.create(projectId, createSceneDto);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트 씬 목록 조회', description: '특정 프로젝트의 모든 씬을 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '프로젝트 씬 목록을 성공적으로 조회했습니다.',
    type: [SceneResponseDto]
  })
  async findByProjectId(@Param('projectId') projectId: string): Promise<SceneResponseDto[]> {
    return this.sceneService.findByProjectId(projectId);
  }

  @Get(':sceneId')
  @ApiOperation({ summary: '씬 상세 조회', description: '특정 씬의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '씬을 성공적으로 조회했습니다.',
    type: SceneResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '씬을 찾을 수 없습니다.' 
  })
  async findOne(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string): Promise<SceneResponseDto> {
    return this.sceneService.findById(projectId, sceneId);
  }

  @Put(':sceneId')
  @ApiOperation({ summary: '씬 수정', description: '기존 씬을 수정합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '씬이 성공적으로 수정되었습니다.',
    type: SceneResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '씬을 찾을 수 없습니다.' 
  })
  async update(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string, 
    @Body() updateSceneDto: UpdateSceneRequestDto
  ): Promise<SceneResponseDto> {
    return this.sceneService.update(projectId, sceneId, updateSceneDto);
  }

  @Delete(':sceneId')
  @ApiOperation({ summary: '씬 삭제 (Soft Delete)', description: '특정 씬을 소프트 삭제합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '씬이 성공적으로 삭제되었습니다.',
    type: SceneResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '씬을 찾을 수 없습니다.' 
  })
  async delete(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string): Promise<SceneResponseDto> {
    return this.sceneService.delete(projectId, sceneId);
  }

  @Put(':sceneId/restore')
  @ApiOperation({ summary: '삭제된 씬 복구', description: '삭제된 씬을 복구합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '씬이 성공적으로 복구되었습니다.',
    type: SceneResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '삭제된 씬을 찾을 수 없습니다.' 
  })
  async restore(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string): Promise<SceneResponseDto> {
    return this.sceneService.restore(projectId, sceneId);
  }

  @Post('draft')
  @ApiOperation({ summary: '씬 초안 생성', description: '새로운 씬 초안을 생성합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '씬 초안이 성공적으로 생성되었습니다.',
    type: [SceneResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  async createDraft(@Param('projectId') projectId: string, @Body() createSceneDraftRequestDto: CreateSceneDraftRequestDto): Promise<SceneDraftResponseDto[]> {
    return this.sceneService.createDraft(projectId, createSceneDraftRequestDto);
  }

  @Post('draft/save')
  @ApiOperation({ summary: '씬 초안을 실제 씬으로 저장', description: '생성된 씬 초안을 실제 씬으로 저장합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '씬이 성공적으로 저장되었습니다.',
    type: [SceneResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  async saveDraftAsScene(
    @Param('projectId') projectId: string, 
    @Body() sceneDrafts: SceneDraftResponseDto[]
  ): Promise<SceneResponseDto[]> {
    return this.sceneService.saveDraftAsScene(projectId, sceneDrafts);
  }
} 