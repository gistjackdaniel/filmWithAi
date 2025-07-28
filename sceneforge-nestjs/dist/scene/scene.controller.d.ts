import { CreateSceneRequestDto, UpdateSceneRequestDto, CreateSceneDraftRequestDto } from './dto/request.dto';
import { SceneResponseDto } from './dto/response.dto';
import { SceneService } from './scene.service';
export declare class SceneController {
    private readonly sceneService;
    constructor(sceneService: SceneService);
    create(projectId: string, createSceneDto: CreateSceneRequestDto): Promise<SceneResponseDto>;
    findByProjectId(projectId: string): Promise<SceneResponseDto[]>;
    findOne(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    update(projectId: string, sceneId: string, updateSceneDto: UpdateSceneRequestDto): Promise<SceneResponseDto>;
    delete(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    restore(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    createDraft(projectId: string, createSceneDraftRequestDto: CreateSceneDraftRequestDto): Promise<SceneResponseDto[]>;
}
