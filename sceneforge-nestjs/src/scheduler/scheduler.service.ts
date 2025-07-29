import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scheduler, SchedulerDocument } from './schema/scheduler.schema';
import { CreateSchedulerRequestDto, UpdateSchedulerRequestDto } from './dto/request.dto';
import { SchedulerResponseDto } from './dto/response.dto';
import { SceneService } from 'src/scene/scene.service';
import { SceneResponseDto } from 'src/scene/dto/response.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectModel(Scheduler.name) private schedulerModel: Model<Scheduler>,
    private sceneService: SceneService
  ) {}

  createScheduler(scenes: SceneResponseDto[]) : any {
    // ...
    return new SchedulerResponseDto()
  }
  

  async create(projectId: string, createSchedulerDto: CreateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    // 스케줄러 생성 알고리즘
    const scenes = await this.sceneService.findByProjectId(projectId);
    const scheduler = this.createScheduler(scenes);

    // 스케줄러 저장
    

    return scheduler;
  }

  async findByProjectId(projectId: string): Promise<SchedulerResponseDto[]> {
    const schedulers = await this.schedulerModel.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();
    return schedulers;
  }

  async findById(projectId: string, schedulerId: string): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOne({
      _id: new Types.ObjectId(schedulerId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }

  async update(projectId: string, schedulerId: string, updateSchedulerDto: UpdateSchedulerRequestDto): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(schedulerId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        $set: {
          ...updateSchedulerDto
        }
      },
      { new: false }
    )

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }

  async delete(projectId: string, schedulerId: string): Promise<SchedulerResponseDto> {
    const scheduler = await this.schedulerModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(schedulerId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
    )

    if (!scheduler) {
      throw new NotFoundException('스케줄러를 찾을 수 없습니다.');
    }

    return scheduler;
  }
} 