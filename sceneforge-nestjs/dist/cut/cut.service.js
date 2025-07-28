"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CutService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const cut_schema_1 = require("./schema/cut.schema");
const ai_service_1 = require("../ai/ai.service");
const scene_service_1 = require("../scene/scene.service");
const project_service_1 = require("../project/project.service");
let CutService = class CutService {
    cutModel;
    aiService;
    sceneService;
    projectService;
    constructor(cutModel, aiService, sceneService, projectService) {
        this.cutModel = cutModel;
        this.aiService = aiService;
        this.sceneService = sceneService;
        this.projectService = projectService;
    }
    async create(projectId, sceneId, createCutDto) {
        const cut = new this.cutModel({
            ...createCutDto,
            isDeleted: false,
            projectId: new mongoose_2.Types.ObjectId(projectId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
        });
        const savedCut = await cut.save();
        return this.mapToResponseDto(savedCut);
    }
    async createDraft(projectId, sceneId, createCutDraftRequestDto) {
        const project = await this.projectService.findById(projectId);
        const scene = await this.sceneService.findById(projectId, sceneId);
        const { maxCuts } = createCutDraftRequestDto;
        const { genre } = project;
        const cutPrompt = await this.buildCutPrompt(maxCuts, genre, scene);
        const result = await this.aiService.callChatCompletions([
            {
                role: 'system',
                content: '당신은 영화 촬영 전문가입니다. 정확히 3개의 컷만 생성하고 유효한 JSON 형식으로만 응답하세요. 간결하게 작성해주세요.'
            },
            {
                role: 'user',
                content: cutPrompt
            }
        ], { max_tokens: 4000, temperature: 0.3 });
        const parsedCuts = this.parseCutDraftResponse(result);
        const draftCuts = parsedCuts.map((cutData, index) => ({
            ...cutData,
            _id: new mongoose_2.Types.ObjectId(),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            order: cutData.order || (index + 1)
        }));
        return draftCuts;
    }
    parseCutDraftResponse(content) {
        console.log('🔍 LLM 원본 응답:', content.substring(0, 300) + '...');
        let jsonContent = content;
        if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            }
        }
        if (jsonContent.includes('```')) {
            const codeMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
            if (codeMatch) {
                jsonContent = codeMatch[1].trim();
            }
        }
        const jsonStart = jsonContent.indexOf('{');
        const jsonEnd = jsonContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
        }
        console.log('🔍 LLM 응답 정리 후:', jsonContent.substring(0, 200) + '...');
        try {
            let parsed;
            try {
                parsed = JSON.parse(jsonContent);
            }
            catch (parseError) {
                console.error('❌ JSON 파싱 실패, 재시도 중...');
                let fixedContent = jsonContent
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/undefined/g, '""')
                    .replace(/null/g, '""')
                    .replace(/NaN/g, '0')
                    .replace(/,\s*"([^"]+)":\s*$/gm, '')
                    .replace(/,\s*"([^"]+)":\s*"[^"]*$/gm, '')
                    .replace(/,\s*"([^"]+)":\s*\{[^}]*$/gm, '')
                    .replace(/,\s*"([^"]+)":\s*\[[^\]]*$/gm, '');
                if (fixedContent.includes('"cutList": [')) {
                    const cutsStart = fixedContent.indexOf('"cutList": [');
                    const cutsEnd = fixedContent.lastIndexOf(']');
                    if (cutsEnd > cutsStart) {
                        const beforeCuts = fixedContent.substring(0, cutsStart);
                        const afterCuts = fixedContent.substring(cutsEnd + 1);
                        fixedContent = beforeCuts + '"cutList": []' + afterCuts;
                    }
                }
                try {
                    parsed = JSON.parse(fixedContent);
                }
                catch (secondError) {
                    console.error('❌ JSON 파싱 재시도 실패:', secondError.message);
                    console.log('⚠️ 기본 JSON 구조로 대체');
                    parsed = {
                        cutList: []
                    };
                }
            }
            if (parsed && parsed.cutList && Array.isArray(parsed.cutList) && parsed.cutList.length > 0) {
                console.log('✅ LLM 응답 구조 검증 성공:', parsed.cutList.length, '개 컷');
                const cutData = parsed.cutList.map((cut, index) => {
                    const cleanDuration = (duration) => {
                        if (typeof duration === 'string') {
                            const match = duration.match(/(\d+)초/);
                            return match ? parseInt(match[1]) : 5;
                        }
                        if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
                            return duration;
                        }
                        return 5;
                    };
                    const cleanNumber = (value) => {
                        if (typeof value === 'number' && !isNaN(value) && value >= 0) {
                            return value;
                        }
                        return 0;
                    };
                    const cleanString = (value) => {
                        return typeof value === 'string' ? value.trim() : '';
                    };
                    return {
                        _id: new mongoose_2.Types.ObjectId(),
                        sceneId: new mongoose_2.Types.ObjectId(),
                        projectId: new mongoose_2.Types.ObjectId(),
                        shotNumber: cleanNumber(cut.shotNumber) || (index + 1),
                        title: cleanString(cut.title) || `Shot ${index + 1}`,
                        description: cleanString(cut.description) || cleanString(cut.title) || `Shot ${index + 1}`,
                        cameraSetup: {
                            shotSize: cleanString(cut.cameraSetup?.shotSize) || 'MS',
                            angleDirection: cleanString(cut.cameraSetup?.angleDirection) || 'Eye-level',
                            cameraMovement: cleanString(cut.cameraSetup?.cameraMovement) || 'Static',
                            lensSpecs: cleanString(cut.cameraSetup?.lensSpecs) || '50mm f/1.8',
                            cameraSettings: cut.cameraSetup?.cameraSettings || {
                                aperture: 'f/2.8',
                                shutterSpeed: '1/60',
                                iso: '800'
                            }
                        },
                        vfxEffects: cleanString(cut.vfxEffects) || '특수 효과 없음',
                        soundEffects: cleanString(cut.soundEffects) || '배경음',
                        directorNotes: cleanString(cut.directorNotes) || '',
                        dialogue: cleanString(cut.dialogue) || '',
                        narration: cleanString(cut.narration) || '',
                        subjectMovement: cut.subjectMovement || [],
                        productionMethod: cleanString(cut.productionMethod) || 'live_action',
                        productionMethodReason: cleanString(cut.productionMethodReason) || '실사 촬영으로 자연스러운 분위기 연출',
                        estimatedDuration: cleanDuration(cut.estimatedDuration),
                        specialRequirements: cut.specialRequirements || {
                            specialCinematography: {
                                drone: false,
                                crane: false,
                                jib: false,
                                underwater: false,
                                aerial: false
                            },
                            specialEffects: {
                                vfx: false,
                                pyrotechnics: false,
                                smoke: false,
                                fog: false,
                                wind: false,
                                rain: false,
                                snow: false,
                                fire: false,
                                explosion: false,
                                stunt: false
                            },
                            specialLighting: {
                                laser: false,
                                strobe: false,
                                blackLight: false,
                                uvLight: false,
                                movingLight: false,
                                colorChanger: false
                            },
                            safety: {
                                requiresMedic: false,
                                requiresFireSafety: false,
                                requiresSafetyOfficer: false
                            }
                        },
                        imageUrl: cleanString(cut.imageUrl) || '',
                        order: cleanNumber(cut.shotNumber) || (index + 1),
                        isDeleted: false
                    };
                });
                return cutData;
            }
            else {
                throw new Error('AI 응답을 파싱할 수 없습니다.');
            }
        }
        catch (error) {
            console.error('JSON 파싱 실패:', error);
            console.error('파싱 시도한 내용:', jsonContent);
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }
    }
    async buildCutPrompt(maxCuts, genre, scene) {
        return `
title - ${scene.title}
description - ${scene.description}
dialogues - ${JSON.stringify(scene.dialogues)}
sceneDateTime - ${scene.timeOfDay}
weather - ${scene.weather}
lighting - ${JSON.stringify(scene.lighting)}
place - ${scene.scenePlace}
cast - ${JSON.stringify(scene.cast)}
visualDescription - ${scene.visualDescription}
vfxRequired - ${scene.vfxRequired}
sfxRequired - ${scene.sfxRequired}
genre - ${genre.join(', ')}

최대 ${maxCuts}개 컷을 다음 형식으로 생성:
{
  "cutList": [
    {
      "order": 1,
      "title": "컷 제목",
      "description": "촬영 설명",
      "cameraSetup": {
        "shotSize": "MS",
        "angleDirection": "Eye-level",
        "cameraMovement": "Static",
        "lensSpecs": "50mm f/1.8",
        "cameraSettings": {
          "aperture": "f/2.8",
          "shutterSpeed": "1/60",
          "iso": "800"
        }
      },
      "vfxEffects": "특수 효과 없음",
      "soundEffects": "배경음",
      "dialogue": "대사 내용",
      "narration": "내레이션 내용",
      "subjectMovement": [
        {
          "name": "주인공",
          "type": "character",
          "position": "화면 중앙",
          "action": "천천히 걷기",
          "emotion": "차분함",
          "description": "주인공이 천천히 걷는 모습"
        }
      ],
      "productionMethod": "live_action",
      "productionMethodReason": "실사 촬영으로 자연스러운 분위기 연출",
      "estimatedDuration": 8,
      "specialRequirements": {
        "specialCinematography": {
          "drone": false,
          "crane": false,
          "jib": false,
          "underwater": false,
          "aerial": false
        },
        "specialEffects": {
          "vfx": false,
          "pyrotechnics": false,
          "smoke": false,
          "fog": false,
          "wind": false,
          "rain": false,
          "snow": false,
          "fire": false,
          "explosion": false,
          "stunt": false
        },
        "specialLighting": {
          "laser": false,
          "strobe": false,
          "blackLight": false,
          "uvLight": false,
          "movingLight": false,
          "colorChanger": false
        },
        "safety": {
          "requiresMedic": false,
          "requiresFireSafety": false,
          "requiresSafetyOfficer": false
        }
      }
    }
  ]
}

각 컷은 다음을 고려하여 생성:
- shotSize: EWS, VWS, WS, FS, LS, MLS, MS, MCS, CU, MCU, BCU, ECU, TCU, OTS, POV, TS, GS, AS, PS, BS 중 선택
- angleDirection: Eye-level, High, Low, Dutch, Bird_eye, Worm_eye, Canted, Oblique, Aerial, Ground, Overhead, Under, Side, Front, Back, Three_quarter, Profile, Reverse, POV, Subjective 중 선택  
- cameraMovement: Static, Pan, Tilt, Dolly, Zoom, Handheld, Tracking, Crane, Steadicam, Gimbal, Drone, Jib, Slider, Dolly_zoom, Arc, Circle, Spiral, Vertigo, Whip_pan, Crash_zoom, Push_in, Pull_out, Follow, Lead, Reveal, Conceal, Parallax, Time_lapse, Slow_motion, Fast_motion, Bullet_time, Matrix_style, 360_degree, VR_style 중 선택
- estimatedDuration: 1-30초 사이의 값
- productionMethod: live_action 또는 ai_generated 중 선택

유효한 JSON 형식으로만 응답하세요.
`;
    }
    async findByProjectId(projectId) {
        if (!mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid project ID');
        }
        const cuts = await this.cutModel.find({
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        })
            .sort({ order: 1 })
            .exec();
        return cuts.map(this.mapToResponseDto);
    }
    async findBySceneId(projectId, sceneId) {
        if (!mongoose_2.Types.ObjectId.isValid(sceneId) || !mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid scene ID or project ID');
        }
        const cuts = await this.cutModel.find({
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        })
            .sort({ order: 1 })
            .exec();
        return cuts.map(this.mapToResponseDto);
    }
    async findById(projectId, sceneId, cutId) {
        if (!mongoose_2.Types.ObjectId.isValid(cutId) || !mongoose_2.Types.ObjectId.isValid(projectId) || !mongoose_2.Types.ObjectId.isValid(sceneId)) {
            throw new common_1.BadRequestException('Invalid cut ID or project ID or scene ID');
        }
        const cut = await this.cutModel.findOne({
            _id: new mongoose_2.Types.ObjectId(cutId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            isDeleted: false
        }).exec();
        if (!cut) {
            throw new common_1.NotFoundException('Cut not found');
        }
        return this.mapToResponseDto(cut);
    }
    async update(projectId, sceneId, cutId, updateCutDto) {
        if (!mongoose_2.Types.ObjectId.isValid(cutId) || !mongoose_2.Types.ObjectId.isValid(projectId) || !mongoose_2.Types.ObjectId.isValid(sceneId)) {
            throw new common_1.BadRequestException('Invalid cut ID or project ID or scene ID');
        }
        const cut = await this.cutModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(cutId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            isDeleted: false
        }, {
            ...updateCutDto,
        }, { new: true }).exec();
        if (!cut) {
            throw new common_1.NotFoundException('Cut not found');
        }
        return this.mapToResponseDto(cut);
    }
    async delete(projectId, sceneId, cutId) {
        if (!mongoose_2.Types.ObjectId.isValid(cutId) || !mongoose_2.Types.ObjectId.isValid(projectId) || !mongoose_2.Types.ObjectId.isValid(sceneId)) {
            throw new common_1.BadRequestException('Invalid cut ID or project ID or scene ID');
        }
        const cut = await this.cutModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(cutId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }, {
            isDeleted: true,
        }, { new: true }).exec();
        if (!cut) {
            throw new common_1.NotFoundException('Cut not found');
        }
        return this.mapToResponseDto(cut);
    }
    async restore(projectId, sceneId, cutId) {
        if (!mongoose_2.Types.ObjectId.isValid(cutId) || !mongoose_2.Types.ObjectId.isValid(projectId) || !mongoose_2.Types.ObjectId.isValid(sceneId)) {
            throw new common_1.BadRequestException('Invalid cut ID or project ID or scene ID');
        }
        const cut = await this.cutModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(cutId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: true
        }, {
            isDeleted: false,
        }, { new: true }).exec();
        if (!cut) {
            throw new common_1.NotFoundException('Deleted cut not found');
        }
        return this.mapToResponseDto(cut);
    }
    async updateOrder(projectId, sceneId, cutId, newOrder) {
        if (!mongoose_2.Types.ObjectId.isValid(cutId) || !mongoose_2.Types.ObjectId.isValid(projectId) || !mongoose_2.Types.ObjectId.isValid(sceneId)) {
            throw new common_1.BadRequestException('Invalid cut ID or project ID or scene ID');
        }
        const cut = await this.cutModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(cutId),
            sceneId: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }, {
            order: newOrder,
        }, { new: true }).exec();
        if (!cut) {
            throw new common_1.NotFoundException('Cut not found');
        }
        return this.mapToResponseDto(cut);
    }
    mapToResponseDto(cut) {
        return {
            _id: cut._id,
            sceneId: cut.sceneId,
            projectId: cut.projectId,
            title: cut.title,
            description: cut.description,
            cameraSetup: cut.cameraSetup,
            vfxEffects: cut.vfxEffects,
            soundEffects: cut.soundEffects,
            directorNotes: cut.directorNotes,
            dialogue: cut.dialogue,
            narration: cut.narration,
            subjectMovement: cut.subjectMovement,
            productionMethod: cut.productionMethod,
            productionMethodReason: cut.productionMethodReason,
            estimatedDuration: cut.estimatedDuration,
            specialRequirements: cut.specialRequirements,
            imageUrl: cut.imageUrl,
            order: cut.order,
            isDeleted: cut.isDeleted,
        };
    }
};
exports.CutService = CutService;
exports.CutService = CutService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(cut_schema_1.Cut.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ai_service_1.AiService,
        scene_service_1.SceneService,
        project_service_1.ProjectService])
], CutService);
//# sourceMappingURL=cut.service.js.map