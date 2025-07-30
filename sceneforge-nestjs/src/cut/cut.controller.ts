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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { 
  CreateCutRequestDto, 
  UpdateCutRequestDto,
  CreateCutDraftRequestDto,
  UploadImageDto
} from './dto/request.dto';
import { 
  CutResponseDto,
  CutDraftResponseDto
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
    type: [CutDraftResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  async createDraft(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Body() createCutDraftRequestDto: CreateCutDraftRequestDto
  ): Promise<CutDraftResponseDto[]> {
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

  @Get(':cutId/image')
  @ApiOperation({ summary: '컷 이미지 조회', description: '특정 컷의 이미지를 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷 이미지를 성공적으로 조회했습니다.',
  })
  async getImage(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<string> {
    return this.cutService.getImage(projectId, sceneId, cutId);
  }

  @Post(':cutId/image')
  @ApiOperation({ summary: '컷 이미지 업로드', description: '컷 이미지를 업로드합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '이미지 파일 (JPEG, PNG, GIF, WebP)'
        }
      }
    }
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷 이미지를 성공적으로 업로드했습니다.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|gif|webp)' }),
        ],
      }),
    ) file: Express.Multer.File
  ): Promise<string> {
    return this.cutService.uploadImage(projectId, sceneId, cutId, file);
  }

  @Delete(':cutId/image')
  @ApiOperation({ summary: '컷 이미지 삭제', description: '컷 이미지를 삭제합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷 이미지를 성공적으로 삭제했습니다.',
  })
  async deleteImage(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<string> {
    return this.cutService.deleteImage(projectId, sceneId, cutId);
  }

  @Post(':cutId/image/generate')
  @ApiOperation({ summary: '컷 이미지 생성', description: 'AI를 통해 컷 이미지를 생성합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'sceneId', description: '씬 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'cutId', description: '컷 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '컷 이미지를 성공적으로 생성했습니다.',
  })  
  async generateImage(
    @Param('projectId') projectId: string, 
    @Param('sceneId') sceneId: string,
    @Param('cutId') cutId: string
  ): Promise<string> {
    return this.cutService.generateImage(projectId, sceneId, cutId);
  }

  @Get('storage/info')
  @ApiOperation({ summary: '스토리지 정보 조회', description: '현재 사용 중인 스토리지 설정 정보를 조회합니다.' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '스토리지 정보를 성공적으로 조회했습니다.',
  })
  async getStorageInfo(): Promise<{ type: string; bucket?: string; localPath?: string }> {
    return this.cutService.getStorageInfo();
  }
} 