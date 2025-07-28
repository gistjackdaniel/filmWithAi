import { Model } from 'mongoose';
import { Scheduler } from './schema/scheduler.schema';
import { CreateSchedulerRequestDto, UpdateSchedulerRequestDto } from './dto/request.dto';
import { SchedulerResponseDto } from './dto/response.dto';
import { SceneService } from 'src/scene/scene.service';
export declare class SchedulerService {
    private schedulerModel;
    private sceneService;
    constructor(schedulerModel: Model<Scheduler>, sceneService: SceneService);
    create(projectId: string, createSchedulerDto: CreateSchedulerRequestDto): Promise<SchedulerResponseDto>;
    findByProjectId(projectId: string): Promise<SchedulerResponseDto[]>;
    findById(projectId: string, schedulerId: string): Promise<SchedulerResponseDto>;
    update(projectId: string, schedulerId: string, updateSchedulerDto: UpdateSchedulerRequestDto): Promise<SchedulerResponseDto>;
    delete(projectId: string, schedulerId: string): Promise<SchedulerResponseDto>;
}
