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
  CreateSchedulerRequestDto, 
  UpdateSchedulerRequestDto, 
} from './dto/request.dto';
import { 
  SchedulerResponseDto,
  BreakdownResponseDto
} from './dto/response.dto';
import { JwtAuthGuard } from '../common/guard/jwt-auth.guard';
import { SchedulerService } from './scheduler.service';

@ApiTags('Scheduler')
@ApiBearerAuth()
@Controller('project/:projectId/scheduler')
@UseGuards(JwtAuthGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  @ApiOperation({ summary: '스케줄러 생성', description: '새로운 스케줄러를 생성합니다.' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: '스케줄러가 성공적으로 생성되었습니다.',
    type: SchedulerResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: '잘못된 요청 데이터입니다.' 
  })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  async create(@Param('projectId') projectId: string, @Body() createSchedulerDto: CreateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    return this.schedulerService.create(projectId, createSchedulerDto);
  }

  @Get()
  @ApiOperation({ summary: '프로젝트 스케줄러 목록 조회', description: '특정 프로젝트의 모든 스케줄러를 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '프로젝트 스케줄러 목록을 성공적으로 조회했습니다.',
    type: [SchedulerResponseDto]
  })
  async findByProjectId(@Param('projectId') projectId: string): Promise<SchedulerResponseDto[]> {
    return this.schedulerService.findByProjectId(projectId);
  }

  @Get(':schedulerId')
  @ApiOperation({ summary: '스케줄러 상세 조회', description: '특정 스케줄러의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '스케줄러를 성공적으로 조회했습니다.',
    type: SchedulerResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '스케줄러를 찾을 수 없습니다.' 
  })
  async findOne(@Param('projectId') projectId: string, @Param('schedulerId') schedulerId: string): Promise<SchedulerResponseDto> {
    return this.schedulerService.findById(projectId, schedulerId);
  }

  @Put(':schedulerId')
  @ApiOperation({ summary: '스케줄러 수정', description: '스케줄러를 수정합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '스케줄러가 성공적으로 수정되었습니다.',
    type: SchedulerResponseDto
  })
  async update(@Param('projectId') projectId: string, @Param('schedulerId') schedulerId: string, @Body() updateSchedulerDto: UpdateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    return this.schedulerService.update(projectId, schedulerId, updateSchedulerDto);
  }

  @Delete(':schedulerId')
  @ApiOperation({ summary: '스케줄러 삭제', description: '스케줄러를 삭제합니다. (소프트 삭제)' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '스케줄러가 성공적으로 삭제되었습니다.',
    type: SchedulerResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '스케줄러를 찾을 수 없습니다.' 
  })
  async delete(@Param('projectId') projectId: string, @Param('schedulerId') schedulerId: string): Promise<SchedulerResponseDto> {
    return this.schedulerService.delete(projectId, schedulerId);
  }

  @Post(':schedulerId/breakdown/:dayNumber')
  @ApiOperation({ summary: '일일 Breakdown 생성', description: '특정 일일 스케줄의 상세 breakdown을 생성합니다.' })
  @ApiParam({ name: 'projectId', description: '프로젝트 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'schedulerId', description: '스케줄러 ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'dayNumber', description: '일일 스케줄 번호', example: '1' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Breakdown이 성공적으로 생성되었습니다.',
    type: BreakdownResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: '스케줄러 또는 일일 스케줄을 찾을 수 없습니다.' 
  })
  async generateBreakdown(
    @Param('projectId') projectId: string, 
    @Param('schedulerId') schedulerId: string, 
    @Param('dayNumber') dayNumber: string
  ): Promise<BreakdownResponseDto> {
    const scheduler = await this.schedulerService.findById(projectId, schedulerId);
    const daySchedule = scheduler.days.find(day => day.day === parseInt(dayNumber));
    
    if (!daySchedule) {
      throw new Error(`Day ${dayNumber} 스케줄을 찾을 수 없습니다.`);
    }
    
    return this.schedulerService.generateBreakdown(daySchedule);
  }
} 