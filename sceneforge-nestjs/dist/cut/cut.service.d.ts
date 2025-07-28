import { Model } from 'mongoose';
import { Cut } from './schema/cut.schema';
import { CreateCutRequestDto, UpdateCutRequestDto, CreateCutDraftRequestDto } from './dto/request.dto';
import { CutResponseDto } from './dto/response.dto';
import { AiService } from 'src/ai/ai.service';
import { SceneService } from 'src/scene/scene.service';
import { SceneResponseDto } from 'src/scene/dto/response.dto';
import { ProjectService } from 'src/project/project.service';
export declare class CutService {
    private cutModel;
    private aiService;
    private sceneService;
    private projectService;
    constructor(cutModel: Model<Cut>, aiService: AiService, sceneService: SceneService, projectService: ProjectService);
    create(projectId: string, sceneId: string, createCutDto: CreateCutRequestDto): Promise<CutResponseDto>;
    createDraft(projectId: string, sceneId: string, createCutDraftRequestDto: CreateCutDraftRequestDto): Promise<CutResponseDto[]>;
    private parseCutDraftResponse;
    buildCutPrompt(maxCuts: number, genre: string[], scene: SceneResponseDto): Promise<string>;
    findByProjectId(projectId: string): Promise<CutResponseDto[]>;
    findBySceneId(projectId: string, sceneId: string): Promise<CutResponseDto[]>;
    findById(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    update(projectId: string, sceneId: string, cutId: string, updateCutDto: UpdateCutRequestDto): Promise<CutResponseDto>;
    delete(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    restore(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    updateOrder(projectId: string, sceneId: string, cutId: string, newOrder: number): Promise<CutResponseDto>;
    private mapToResponseDto;
}
