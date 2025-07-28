import { CreateCutRequestDto, UpdateCutRequestDto, CreateCutDraftRequestDto } from './dto/request.dto';
import { CutResponseDto } from './dto/response.dto';
import { CutService } from './cut.service';
export declare class CutController {
    private readonly cutService;
    constructor(cutService: CutService);
    create(projectId: string, sceneId: string, createCutDto: CreateCutRequestDto): Promise<CutResponseDto>;
    createDraft(projectId: string, sceneId: string, createCutDraftRequestDto: CreateCutDraftRequestDto): Promise<CutResponseDto[]>;
    findBySceneId(projectId: string, sceneId: string): Promise<CutResponseDto[]>;
    findOne(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    update(projectId: string, sceneId: string, cutId: string, updateCutDto: UpdateCutRequestDto): Promise<CutResponseDto>;
    delete(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    restore(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto>;
    updateOrder(projectId: string, sceneId: string, cutId: string, newOrder: number): Promise<CutResponseDto>;
}
