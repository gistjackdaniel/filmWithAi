import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cut } from './schema/cut.schema';
import { 
  CreateCutRequestDto, 
  UpdateCutRequestDto,
  CreateCutDraftRequestDto
} from './dto/request.dto';
import { 
  CutResponseDto
} from './dto/response.dto';
import { AiService } from 'src/ai/ai.service';
import { SceneService } from 'src/scene/scene.service';
import { SceneResponseDto } from 'src/scene/dto/response.dto';
import { ProjectService } from 'src/project/project.service';

@Injectable()
export class CutService {
  constructor(
    @InjectModel(Cut.name) private cutModel: Model<Cut>,
    private aiService: AiService,
    private sceneService: SceneService,
    private projectService: ProjectService
  ) {}

  async create(projectId: string, sceneId: string, createCutDto: CreateCutRequestDto): Promise<CutResponseDto> {
    const cut = new this.cutModel({
      ...createCutDto,
      isDeleted: false,
      projectId: new Types.ObjectId(projectId),
      sceneId: new Types.ObjectId(sceneId),
    });
    
    const savedCut = await cut.save();
    return this.mapToResponseDto(savedCut);
  }

  async createDraft(projectId: string, sceneId: string, createCutDraftRequestDto: CreateCutDraftRequestDto): Promise<CutResponseDto[]> {
    const project = await this.projectService.findById(projectId);
    const scene = await this.sceneService.findById(projectId, sceneId);
    const { maxCuts } = createCutDraftRequestDto;
    const { genre } = project;

    // 씬 정보를 기반으로 컷 생성 프롬프트 작성
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

    // AI 응답을 파싱해서 draft 컷 데이터 생성
    const parsedCuts = this.parseCutDraftResponse(result);
    
    // draft 데이터에 projectId와 sceneId 추가
    const draftCuts: CutResponseDto[] = parsedCuts.map((cutData, index) => ({
      ...cutData,
      _id: new Types.ObjectId(), // 임시 ID
      sceneId: new Types.ObjectId(sceneId),
      projectId: new Types.ObjectId(projectId),
      order: cutData.order || (index + 1)
    }));

    return draftCuts;
  }

  private parseCutDraftResponse(content: string): CutResponseDto[] {
    console.log('🔍 LLM 원본 응답:', content.substring(0, 300) + '...');
    
    // 마크다운 코드 블록 제거
    let jsonContent = content;
    
    // ```json ... ``` 형태의 코드 블록 제거
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
    }
    
    // ``` ... ``` 형태의 코드 블록 제거
    if (jsonContent.includes('```')) {
      const codeMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
      if (codeMatch) {
        jsonContent = codeMatch[1].trim();
      }
    }
    
    // JSON 객체 시작과 끝 찾기
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    }
    
    console.log('🔍 LLM 응답 정리 후:', jsonContent.substring(0, 200) + '...');

    try {
      // JSON 파싱 시도
      let parsed;
      try {
        parsed = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패, 재시도 중...');
        
        // 더 강력한 JSON 수정 시도
        let fixedContent = jsonContent
          .replace(/,\s*}/g, '}') // 마지막 쉼표 제거
          .replace(/,\s*]/g, ']') // 배열 마지막 쉼표 제거
          .replace(/undefined/g, '""') // undefined를 빈 문자열로
          .replace(/null/g, '""') // null을 빈 문자열로
          .replace(/NaN/g, '0') // NaN을 0으로
          .replace(/,\s*"([^"]+)":\s*$/gm, '') // 불완전한 속성 제거
          .replace(/,\s*"([^"]+)":\s*"[^"]*$/gm, '') // 불완전한 문자열 값 제거
          .replace(/,\s*"([^"]+)":\s*\{[^}]*$/gm, '') // 불완전한 객체 제거
          .replace(/,\s*"([^"]+)":\s*\[[^\]]*$/gm, '') // 불완전한 배열 제거;
        
        // 불완전한 cutList 배열 수정
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
        } catch (secondError) {
          console.error('❌ JSON 파싱 재시도 실패:', secondError.message);
          
          // 최후의 수단: 기본 JSON 구조 생성
          console.log('⚠️ 기본 JSON 구조로 대체');
          parsed = {
            cutList: []
          };
        }
      }
      
      // cutList 배열 검증 및 생성
      if (parsed && parsed.cutList && Array.isArray(parsed.cutList) && parsed.cutList.length > 0) {
        console.log('✅ LLM 응답 구조 검증 성공:', parsed.cutList.length, '개 컷');
        
        // 각 컷 데이터 검증 및 정리
        const cutData: Array<CutResponseDto> = parsed.cutList.map((cut: any, index: number) => {
          // NaN 값들을 적절한 기본값으로 변환하는 함수
          const cleanDuration = (duration: any) => {
            if (typeof duration === 'string') {
              // "NaN초", "5초" 등의 문자열 처리
              const match = duration.match(/(\d+)초/);
              return match ? parseInt(match[1]) : 5;
            }
            if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
              return duration;
            }
            return 5; // 기본값
          };

          const cleanNumber = (value: any) => {
            if (typeof value === 'number' && !isNaN(value) && value >= 0) {
              return value;
            }
            return 0;
          };

          const cleanString = (value: any) => {
            return typeof value === 'string' ? value.trim() : '';
          };

          // Cut 모델에 맞는 안전한 컷 데이터 생성
          return {
            _id: new Types.ObjectId(),
            sceneId: new Types.ObjectId(),
            projectId: new Types.ObjectId(),
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
      } else {
        throw new Error('AI 응답을 파싱할 수 없습니다.');
      }
    } catch (error) {
      console.error('JSON 파싱 실패:', error);
      console.error('파싱 시도한 내용:', jsonContent);
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }
  }

  async buildCutPrompt(maxCuts: number, genre: string[], scene: SceneResponseDto): Promise<string> {
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

  async findByProjectId(projectId: string): Promise<CutResponseDto[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid project ID');
    }

    const cuts = await this.cutModel.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    })
    .sort({ order: 1 })
    .exec();

    return cuts.map(this.mapToResponseDto);
  }

  async findBySceneId(projectId: string, sceneId: string): Promise<CutResponseDto[]> {
    if (!Types.ObjectId.isValid(sceneId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid scene ID or project ID');
    }

    const cuts = await this.cutModel.find({
      sceneId: new Types.ObjectId(sceneId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    })
    .sort({ order: 1 })
    .exec();

    return cuts.map(this.mapToResponseDto);
  }

  async findById(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sceneId)) {
      throw new BadRequestException('Invalid cut ID or project ID or scene ID');
    }

    const cut = await this.cutModel.findOne({
      _id: new Types.ObjectId(cutId),
      projectId: new Types.ObjectId(projectId),
      sceneId: new Types.ObjectId(sceneId),
      isDeleted: false
    }).exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  async update(projectId: string, sceneId: string, cutId: string, updateCutDto: UpdateCutRequestDto): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sceneId)) {
      throw new BadRequestException('Invalid cut ID or project ID or scene ID');
    }

    const cut = await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        projectId: new Types.ObjectId(projectId),
        sceneId: new Types.ObjectId(sceneId),
        isDeleted: false
      },
      {
        ...updateCutDto,
      },
      { new: true }
    ).exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  async delete(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sceneId)) {
      throw new BadRequestException('Invalid cut ID or project ID or scene ID');
    }

    const cut = await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        sceneId: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        isDeleted: true,
      },
      { new: true }
    ).exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  async restore(projectId: string, sceneId: string, cutId: string): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sceneId)) {
      throw new BadRequestException('Invalid cut ID or project ID or scene ID');
    }

    const cut = await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        sceneId: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: true
      },
      {
        isDeleted: false,
      },
      { new: true }
    ).exec();

    if (!cut) {
      throw new NotFoundException('Deleted cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  async updateOrder(projectId: string, sceneId: string, cutId: string, newOrder: number): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(sceneId)) {
      throw new BadRequestException('Invalid cut ID or project ID or scene ID');
    }

    const cut = await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        sceneId: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        order: newOrder,
      },
      { new: true }
    ).exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  private mapToResponseDto(cut: Cut): CutResponseDto {
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
} 