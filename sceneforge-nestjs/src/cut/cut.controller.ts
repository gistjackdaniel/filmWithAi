import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
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
  CreateCutRequestDto, 
  UpdateCutRequestDto,
  CreateCutDraftRequestDto
} from './dto/request.dto';
import { 
  CutResponseDto
} from './dto/response.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { CutService } from './cut.service';

@ApiTags('Cut')
@ApiBearerAuth()
@Controller('project/:projectId/scene/:sceneId/cut')
@UseGuards(JwtAuthGuard)
export class CutController {
  constructor(private readonly cutService: CutService) {}

  @Post()
  @ApiOperation({ summary: '컷 생성', description: '새로운 컷을 생성합니다.' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '컷이 성공적으로 생성되었습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  async create(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Body() createCutDto: CreateCutRequestDto, 
  ): Promise<CutResponseDto> {
    return this.cutService.create(projectId, sceneId, createCutDto);
  }

  @Post('draft')
  @ApiOperation({ summary: '컷 초안 생성', description: 'AI를 통해 컷 초안을 생성합니다. 사용자가 편집 후 createCut을 통해 저장할 수 있습니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '컷 초안이 성공적으로 생성되었습니다. 사용자가 편집 후 createCut을 통해 저장할 수 있습니다.',
    type: [CutResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  async createDraft(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Body() createCutDraftRequestDto: CreateCutDraftRequestDto
  ): Promise<CutResponseDto[]> {
    return this.cutService.createDraft(projectId, sceneId, createCutDraftRequestDto);
  }

  @Get()
  @ApiOperation({ summary: '씬 컷 목록 조회', description: '특정 씬의 모든 컷을 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '씬 컷 목록을 성공적으로 조회했습니다.',
    type: [CutResponseDto]
  })
  async findBySceneId(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string
  ): Promise<CutResponseDto[]> {
    return this.cutService.findBySceneId(projectId, sceneId);
  }

  @Get(':cutId')
  @ApiOperation({ summary: '컷 상세 조회', description: '특정 컷의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷을 성공적으로 조회했습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '컷을 찾을 수 없습니다.' 
  })
  async findOne(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<CutResponseDto> {
    return this.cutService.findById(projectId, sceneId, cutId);
  }

  @Put(':cutId')
  @ApiOperation({ summary: '컷 수정', description: '기존 컷을 수정합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷이 성공적으로 수정되었습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '컷을 찾을 수 없습니다.' 
  })
  async update(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string, 
    @Body() updateCutDto: UpdateCutRequestDto
  ): Promise<CutResponseDto> {
    return this.cutService.update(projectId, sceneId, cutId, updateCutDto);
  }

  @Delete(':cutId')
  @ApiOperation({ summary: '컷 삭제 (Soft Delete)', description: '특정 컷을 소프트 삭제합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷이 성공적으로 삭제되었습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '컷을 찾을 수 없습니다.' 
  })
  async delete(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<CutResponseDto> {
    return this.cutService.delete(projectId, sceneId, cutId);
  }

  @Put(':cutId/restore')
  @ApiOperation({ summary: '삭제된 컷 복구', description: '삭제된 컷을 복구합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷이 성공적으로 복구되었습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '삭제된 컷을 찾을 수 없습니다.' 
  })
  async restore(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<CutResponseDto> {
    return this.cutService.restore(projectId, sceneId, cutId);
  }

  @Put(':cutId/order')
  @ApiOperation({ summary: '컷 순서 변경', description: '컷의 순서를 변경합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷 순서가 성공적으로 변경되었습니다.',
    type: CutResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '컷을 찾을 수 없습니다.' 
  })
  async updateOrder(
    @Param('projectId') projectId: string,
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string,
    @Body('order') newOrder: number
  ): Promise<CutResponseDto> {
    return this.cutService.updateOrder(projectId, sceneId, cutId, newOrder);
  }
} 