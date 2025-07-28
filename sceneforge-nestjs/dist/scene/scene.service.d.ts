import { Model } from 'mongoose';
import { SceneDocument } from './schema/scene.schema';
import { CreateSceneDraftRequestDto, CreateSceneRequestDto, UpdateSceneRequestDto } from './dto/request.dto';
import { SceneResponseDto } from './dto/response.dto';
import { AiService } from 'src/ai/ai.service';
import { ProjectService } from 'src/project/project.service';
import { ProjectResponseDto } from 'src/project/dto/response.dto';
export declare class SceneService {
    private sceneModel;
    private aiService;
    private projectService;
    constructor(sceneModel: Model<SceneDocument>, aiService: AiService, projectService: ProjectService);
    create(projectId: string, createSceneDto: CreateSceneRequestDto): Promise<SceneResponseDto>;
    findByProjectId(projectId: string): Promise<SceneResponseDto[]>;
    findById(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    update(projectId: string, sceneId: string, updateSceneDto: UpdateSceneRequestDto): Promise<SceneResponseDto>;
    delete(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    restore(projectId: string, sceneId: string): Promise<SceneResponseDto>;
    createDraft(projectId: string, createSceneDraftRequestDto: CreateSceneDraftRequestDto): Promise<SceneResponseDto[]>;
    private parseSceneDraftResponse;
    buildScenePrompt(maxScenes: number, project: ProjectResponseDto): Promise<string>;
}
