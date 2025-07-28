import { Model } from 'mongoose';
import { ProjectDocument } from './schema/project.schema';
import { ProfileService } from '../profile/profile.service';
import { CreateProjectRequestDto, UpdateProjectRequestDto, SearchProjectRequestDto, FindProjectDetailRequestDto, DeleteProjectRequestDto, RestoreProjectRequestDto } from './dto/request.dto';
import { ProjectResponseDto } from './dto/response.dto';
export declare class ProjectService {
    private projectModel;
    private readonly profileService;
    constructor(projectModel: Model<ProjectDocument>, profileService: ProfileService);
    create(ownerId: string, createProjectRequestDto: CreateProjectRequestDto): Promise<ProjectResponseDto>;
    searchParticipatingProjects(searchProjectRequestDto: SearchProjectRequestDto): Promise<ProjectResponseDto[]>;
    findById(projectId: string): Promise<ProjectResponseDto>;
    findParticipatingOne(findProjectDetailRequestDto: FindProjectDetailRequestDto): Promise<ProjectResponseDto>;
    update(ownerId: string, projectId: string, updateProjectRequestDto: UpdateProjectRequestDto): Promise<ProjectResponseDto>;
    delete(deleteProjectRequestDto: DeleteProjectRequestDto): Promise<ProjectResponseDto>;
    updateLastViewed(profileId: string, projectId: string): Promise<void>;
    restoreProject(restoreProjectRequestDto: RestoreProjectRequestDto): Promise<ProjectResponseDto>;
    searchFavorites(searchProjectRequestDto: SearchProjectRequestDto): Promise<ProjectResponseDto[]>;
}
