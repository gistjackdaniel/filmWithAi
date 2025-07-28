import { CreateSchedulerRequestDto, UpdateSchedulerRequestDto } from './dto/request.dto';
import { SchedulerResponseDto } from './dto/response.dto';
import { SchedulerService } from './scheduler.service';
export declare class SchedulerController {
    private readonly schedulerService;
    constructor(schedulerService: SchedulerService);
    create(projectId: string, createSchedulerDto: CreateSchedulerRequestDto): Promise<SchedulerResponseDto>;
    findByProjectId(projectId: string): Promise<SchedulerResponseDto[]>;
    findOne(projectId: string, schedulerId: string): Promise<SchedulerResponseDto>;
    update(projectId: string, schedulerId: string, updateSchedulerDto: UpdateSchedulerRequestDto): Promise<SchedulerResponseDto>;
    delete(projectId: string, schedulerId: string): Promise<SchedulerResponseDto>;
}
