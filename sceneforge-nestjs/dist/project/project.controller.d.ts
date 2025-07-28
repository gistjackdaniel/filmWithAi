import { ProjectService } from './project.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { CreateProjectRequestDto, UpdateProjectRequestDto } from './dto/request.dto';
import { ProjectResponseDto } from './dto/response.dto';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectService);
    create(user: JwtPayload, createProjectDto: CreateProjectRequestDto): Promise<ProjectResponseDto>;
    searchParticipatingProjects(user: JwtPayload): Promise<ProjectResponseDto[]>;
    searchFavorites(user: JwtPayload): Promise<ProjectResponseDto[]>;
    findOne(user: JwtPayload, id: string): Promise<ProjectResponseDto>;
    update(user: JwtPayload, id: string, updateProjectDto: UpdateProjectRequestDto): Promise<ProjectResponseDto>;
    delete(user: JwtPayload, id: string): Promise<ProjectResponseDto>;
    restoreProject(user: JwtPayload, id: string): Promise<ProjectResponseDto>;
}
