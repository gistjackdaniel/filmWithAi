import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { UploadUserVideoV2V3RequestDto, UpdateVideoRequestDto, GenerateVideoV1FromCutRequestDto } from './dto/request.dto';

@Controller('project/:projectId/video')
export class VideoController {
  constructor(private service: VideoService) {}

  @Get()
  async list(@Param('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Post('generate')
  async generateFromCut(
    @Param('projectId') projectId: string,
    @Body() body: GenerateVideoV1FromCutRequestDto,
  ) {
    return this.service.generateFromCut(projectId, body);
  }

  @Get(':id')
  async get(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.service.get(projectId, id);
  }

  @Post()
  async create(@Param('projectId') projectId: string, @Body() body: UploadUserVideoV2V3RequestDto) {
    return this.service.create(projectId, body);
  }

  @Patch(':id')
  async update(@Param('projectId') projectId: string, @Param('id') id: string, @Body() body: UpdateVideoRequestDto) {
    return this.service.update(projectId, id, body);
  }

  @Delete(':id')
  async remove(@Param('projectId') projectId: string, @Param('id') id: string) {
    return this.service.remove(projectId, id);
  }
}


