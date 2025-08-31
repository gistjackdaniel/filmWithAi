import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cut } from './schema/cut.schema';
import { 
  CreateCutRequestDto, 
  UpdateCutRequestDto,
  CreateCutDraftRequestDto
} from './dto/request.dto';
import { 
  CutResponseDto,
  CutDraftResponseDto
} from './dto/response.dto';
import { AiService } from 'src/ai/ai.service';
import { SceneService } from 'src/scene/scene.service';
import { SceneResponseDto } from 'src/scene/dto/response.dto';
import { ProjectService } from 'src/project/project.service';
import { StorageFactoryService } from '../common/services/storage-factory.service';
import { VideoService } from '../video/video.service';
import * as fs from 'fs';
import { ProjectResponseDto } from 'src/project/dto/response.dto';

@Injectable()
export class CutService {
  constructor(
    @InjectModel(Cut.name) private cutModel: Model<Cut>,
    private aiService: AiService,
    private sceneService: SceneService,
    private projectService: ProjectService,
    private storageFactoryService: StorageFactoryService,
    @Inject(forwardRef(() => VideoService)) private videoService: VideoService
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

  async createDraft(projectId: string, sceneId: string, createCutDraftRequestDto: CreateCutDraftRequestDto): Promise<CutDraftResponseDto[]> {
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

    // AI 응답을 파싱해서 draft 컷 데이터 생성 (식별자 없음)
    const parsedCuts = this.parseCutDraftResponse(result);
    
    const draftCuts: CutDraftResponseDto[] = parsedCuts.map((cutData, index) => ({
      ...cutData,
      order: cutData.order || (index + 1)
    }));

    return draftCuts;
  }

  private parseCutDraftResponse(content: string): CutDraftResponseDto[] {
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
        
        // 각 컷 데이터 검증 및 정리 (드래프트: 식별자 제거)
        const cutData: Array<CutDraftResponseDto> = parsed.cutList.map((cut: any, index: number) => {
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

          // 드래프트 DTO에 맞는 안전한 컷 데이터 생성 (식별자, 이미지, 삭제 플래그 제외)
          return {
            order: cleanNumber(cut.shotNumber) || (index + 1),
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
            }
          } as CutDraftResponseDto;
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
lighting - ${JSON.stringify({
  description: scene.lighting.description,
  colorTemperature: scene.lighting.setup.overall.colorTemperature,
  mood: scene.lighting.setup.overall.mood
})}
place - ${scene.scenePlace}
cast - ${JSON.stringify(scene.cast)}
visualDescription - ${scene.visualDescription}
vfxRequired - ${scene.vfxRequired}
sfxRequired - ${scene.sfxRequired}
genre - ${genre.join(', ')}
estimatedDuration - ${scene.estimatedDuration}

최대 ${maxCuts}개 컷을 다음 형식으로 생성:
{
  "cutList": [
    {
      "order": 1,
      "title": "컷 제목",
      "description": "컷 설명",
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
      },
      "cutDelta": {
        "additionalCrew": {
          "cinematography": {
            "droneOperator": [],
            "craneOperator": [],
            "jibOperator": [],
            "underwaterOperator": [],
            "aerialOperator": []
          },
          "lighting": {
            "specialEffectsGaffer": [],
            "laserOperator": [],
            "strobeOperator": [],
            "fogOperator": []
          },
          "sound": {
            "foleyArtist": [],
            "ambienceRecordist": [],
            "specialSoundEngineer": []
          },
          "art": {
            "vfxSupervisor": [],
            "sfxSupervisor": [],
            "pyrotechnician": [],
            "stuntCoordinator": [],
            "animatronicsOperator": [],
            "prostheticsArtist": [],
            "bloodEffectsArtist": [],
            "makeupEffectsArtist": [],
            "setEffectsArtist": [],
            "specialPropsMaster": [],
            "specialCostumeDesigner": []
          },
          "production": {
            "safetySupervisor": [],
            "fireSafetyOfficer": [],
            "medic": [],
            "emergencyCoordinator": []
          },
          "etc": []
        },
        "additionalEquipment": {
          "cinematography": {
            "drones": [],
            "cranes": [],
            "jibs": [],
            "underwaterHousings": [],
            "aerialRigs": []
          },
          "lighting": {
            "specialKeyLights": [],
            "specialFillLights": [],
            "specialBackLights": [],
            "specialBackgroundLights": [],
            "specialEffectsLights": [],
            "specialSoftLights": [],
            "specialGripModifiers": {
              "flags": [],
              "diffusion": [],
              "reflectors": [],
              "colorGels": []
            },
            "specialPower": []
          },
          "sound": {
            "foleyEquipment": [],
            "ambienceRecorders": [],
            "specialMicrophones": [],
            "soundEffects": []
          },
          "art": {
            "vfxEquipment": [],
            "pyrotechnics": [],
            "smokeMachines": [],
            "fogMachines": [],
            "windMachines": [],
            "rainMachines": [],
            "snowMachines": [],
            "animatronics": [],
            "prosthetics": [],
            "bloodEffects": [],
            "makeupEffects": [],
            "setEffects": [],
            "props": {
              "characterProps": [],
              "setProps": []
            },
            "costumes": []
          },
          "production": {
            "safetyGear": [],
            "fireSuppression": [],
            "medicalEquipment": [],
            "emergencyEquipment": []
          },
          "etc": []
        }
      }
    }
  ]
}

각 컷은 다음을 고려하여 생성:

**컷 디자인 패턴 및 몰입감 구성 원칙:**

1. **시퀀스 구조 (Sequence Structure):**
   - **Establishing Shot (설정 샷)**: 장소와 상황을 보여주는 와이드 샷
   - **Medium Shot (중간 샷)**: 캐릭터와 액션을 보여주는 중간 거리
   - **Close-up (클로즈업)**: 감정과 세부사항을 강조하는 근접 샷
   - **Reaction Shot (반응 샷)**: 캐릭터의 반응을 보여주는 샷

2. **몰입감을 위한 샷 구성:**
   - **POV (Point of View)**: 캐릭터의 시점으로 몰입감 증대
   - **OTS (Over the Shoulder)**: 대화 시 자연스러운 시점
   - **Dutch Angle**: 긴장감과 불안정한 분위기 연출
   - **Low Angle**: 힘과 위엄을 강조
   - **High Angle**: 약점이나 무력감을 표현

3. **카메라 움직임으로 몰입감 증대:**
   - **Dolly**: 부드러운 추적으로 자연스러운 움직임
   - **Handheld**: 현실감과 긴장감 연출
   - **Steadicam**: 안정적이면서도 유연한 움직임
   - **Drone**: 공중에서의 독특한 시점
   - **Crane**: 극적인 상승/하강 효과

4. **감정적 몰입을 위한 샷 사이즈:**
   - **EWS (Extreme Wide Shot)**: 장소의 규모와 분위기
   - **WS (Wide Shot)**: 전체 상황 파악
   - **MS (Medium Shot)**: 캐릭터와 액션의 균형
   - **CU (Close Up)**: 감정과 세부사항
   - **ECU (Extreme Close Up)**: 극적인 강조

5. **시각적 스토리텔링:**
   - **Rule of Thirds**: 화면을 3등분하여 시각적 균형
   - **Leading Lines**: 시선을 유도하는 선적 요소
   - **Depth of Field**: 초점으로 주목할 요소 강조
   - **Color Contrast**: 색상 대비로 감정 강조

6. **리듬과 페이스:**
   - **Fast Cuts**: 긴장감과 에너지
   - **Slow Motion**: 감정적 순간의 연장
   - **Long Takes**: 현실감과 몰입감
   - **Montage**: 시간의 압축과 감정의 집중

7. **시퀀스별 컷 구성 패턴:**
   - **액션 시퀀스**: EWS → WS → MS → CU → ECU (긴장감 증가)
   - **대화 시퀀스**: MS → OTS → CU → Reaction Shot (감정 교류)
   - **감정 시퀀스**: CU → ECU → POV → Dutch Angle (내면 탐구)
   - **환경 시퀀스**: EWS → WS → MS → Detail Shot (공간 탐색)
   - **클라이맥스**: Low Angle → Dutch Angle → Handheld → Fast Cuts (극적 효과)

8. **몰입감 증대 기법:**
   - **Subjective Camera**: 캐릭터의 시점으로 관객을 스토리에 참여시킴
   - **Tracking Shot**: 캐릭터와 함께 움직이며 현실감 증대
   - **Depth of Field**: 초점을 통해 주목할 요소를 명확히 함
   - **Lighting Contrast**: 조명 대비로 감정적 분위기 강조
   - **Sound Design**: 음향과 시각의 조화로 몰입감 증대

9. **감정별 컷 구성 가이드:**
   - **긴장감**: Dutch Angle + Handheld + Fast Cuts + Low Key Lighting
   - **로맨스**: Soft Lighting + CU + Slow Motion + Gentle Camera Movement
   - **액션**: Wide Shots + Fast Movement + Dynamic Angles + High Energy
   - **드라마**: MS + CU + Static Camera + Natural Lighting
   - **공포**: Dutch Angle + ECU + Handheld + Dark Lighting
   - **희극**: Wide Shots + Eye-level + Bright Lighting + Simple Movement

10. **시각적 스토리텔링 원칙:**
    - **Show, Don't Tell**: 대사보다 시각적 요소로 스토리 전달
    - **Emotional Journey**: 감정의 변화를 시각적으로 표현
    - **Character Arc**: 캐릭터의 성장을 샷 구성으로 표현
    - **Theme Reinforcement**: 주제를 반복되는 시각적 모티프로 강조
    - **Audience Engagement**: 관객의 감정적 참여를 유도하는 구성

11. **컷 간 연관성 및 대비 효과 설계:**
    - **Cut-in**: 같은 액션의 다른 각도로 시점 변화 (예: WS → CU)
    - **Overlapping Action**: 동일 동작을 여러 각도에서 반복하여 리듬감 증대
    - **Matching Movement**: 이전 컷의 움직임을 다음 컷에서 자연스럽게 연결
    - **Rhythm Change**: 긴 샷과 짧은 샷의 교대로 리듬감 창출
    - **Eye-line Match**: 캐릭터의 시선을 따라 다음 컷으로 자연스럽게 전환
    - **Graphic Match**: 형태나 색상의 유사성을 통해 시각적 연결
    - **Action Match**: 동일한 액션을 다른 각도에서 연속 촬영

12. **감정 곡선에 따른 점진적 구성:**
    - **Tension Build-up**: WS → MS → CU → ECU (긴장감 점진적 증가)
    - **Emotional Release**: ECU → CU → MS → WS (감정 해방)
    - **Rhythm Acceleration**: 긴 샷 → 중간 샷 → 짧은 샷 (속도감 증가)
    - **Rhythm Deceleration**: 짧은 샷 → 중간 샷 → 긴 샷 (속도감 감소)
    - **Emotional Contrast**: 밝은 샷 ↔ 어두운 샷, 정적 샷 ↔ 동적 샷

13. **시퀀스 리듬 설계:**
    - **Establishing Rhythm**: 첫 컷으로 전체 분위기 설정
    - **Development Rhythm**: 중간 컷들로 스토리 발전
    - **Climax Rhythm**: 클라이맥스에서 리듬 최고조
    - **Resolution Rhythm**: 마무리에서 리듬 안정화
    - **Pause and Breath**: 긴장 후 이완으로 감정적 호흡

14. **컷 전환 기법:**
    - **Cut on Action**: 액션 중간에 컷하여 자연스러운 전환
    - **Cut on Reaction**: 반응을 통해 감정적 전환
    - **Cut on Movement**: 움직임을 통해 시각적 연결
    - **Cut on Sound**: 소리를 통해 청각적 연결
    - **Cut on Emotion**: 감정 변화를 통해 내적 연결

15. **시각적 대비 효과:**
    - **Size Contrast**: WS ↔ CU (규모 대비)
    - **Angle Contrast**: High Angle ↔ Low Angle (시점 대비)
    - **Movement Contrast**: Static ↔ Dynamic (움직임 대비)
    - **Lighting Contrast**: Bright ↔ Dark (조명 대비)
    - **Color Contrast**: Warm ↔ Cool (색감 대비)

16. **시퀀스 내 컷 간 연관성 강화:**
    - **Continuity of Action**: 이전 컷의 액션이 다음 컷에서 자연스럽게 이어짐
    - **Continuity of Direction**: 캐릭터나 물체의 움직임 방향이 일관됨
    - **Continuity of Position**: 캐릭터의 위치가 논리적으로 연결됨
    - **Continuity of Time**: 시간적 흐름이 자연스럽게 연결됨
    - **Continuity of Space**: 공간적 관계가 일관되게 유지됨

17. **감정적 몰입을 위한 컷 설계:**
    - **Emotional Pacing**: 감정의 강도에 따라 컷 길이 조절
    - **Suspense Building**: 긴장감을 위한 점진적 클로즈업
    - **Catharsis**: 감정 해방을 위한 시각적 폭발
    - **Intimacy**: 감정적 친밀감을 위한 클로즈업
    - **Distance**: 객관적 거리감을 위한 와이드 샷

18. **리듬감 있는 시퀀스 구성:**
    - **Staccato Rhythm**: 짧고 빠른 컷으로 에너지 증대
    - **Legato Rhythm**: 길고 부드러운 컷으로 감정 연장
    - **Syncopated Rhythm**: 예상과 다른 타이밍으로 놀라움
    - **Crescendo Rhythm**: 점진적으로 강해지는 리듬
    - **Decrescendo Rhythm**: 점진적으로 약해지는 리듬

19. **시각적 모티프 반복:**
    - **Recurring Shot**: 특정 샷을 반복하여 주제 강조
    - **Visual Echo**: 이전 컷의 시각적 요소를 다음 컷에서 재해석
    - **Color Motif**: 특정 색상을 반복하여 감정 강조
    - **Shape Motif**: 특정 형태를 반복하여 시각적 통일감
    - **Movement Motif**: 특정 움직임을 반복하여 리듬감 창출

20. **컷 시퀀스 설계 원칙:**
    - **Unity**: 전체 시퀀스가 하나의 감정적 목표를 향함
    - **Variety**: 단조로움을 피하기 위한 다양한 구성
    - **Balance**: 긴장과 이완의 균형
    - **Progression**: 감정적 여정의 자연스러운 발전
    - **Closure**: 시퀀스의 만족스러운 마무리

21. **창의적 실험적 컷 디자인 (전체의 10%):**
    - **Jump Cut**: 시간의 급격한 압축으로 놀라움 연출
    - **Match Cut**: 형태나 움직임의 유사성으로 시각적 연결
    - **Graphic Match**: 색상, 형태, 구도의 유사성으로 전환
    - **Split Screen**: 동시성이나 대비를 시각적으로 표현
    - **Object POV**: 물체의 시점으로 독특한 관점 제공
    - **Silhouette Composition**: 실루엣으로 미스터리한 분위기 연출
    - **Whip Pan**: 빠른 팬으로 에너지와 긴장감 증대
    - **360도 회전**: 캐릭터나 공간의 완전한 탐색
    - **Dutch Tilt**: 불안정한 각도로 긴장감 연출
    - **Extreme Close-up**: 극단적 클로즈업으로 강렬한 인상
    - **Slow Motion**: 시간의 연장으로 감정적 순간 강조
    - **Fast Motion**: 시간의 압축으로 에너지 증대

22. **실험적 컷의 적절한 배치:**
    - **Climax Point**: 감정의 절정에서 강렬한 시각적 충격
    - **Transition Point**: 장면 전환에서 독특한 연결
    - **Emotional Peak**: 감정의 최고점에서 실험적 표현
    - **Narrative Twist**: 이야기 전환점에서 놀라운 시각
    - **Character Revelation**: 캐릭터의 중요한 순간에서 특별한 각도

23. **실험적 컷의 서사 통합:**
    - **Narrative Justification**: 실험적 컷이 스토리에 의미를 더함
    - **Emotional Enhancement**: 감정적 충격을 시각적으로 증폭
    - **Character Insight**: 캐릭터의 내면을 독특한 방식으로 표현
    - **Thematic Reinforcement**: 주제를 실험적 기법으로 강조
    - **Audience Engagement**: 관객의 주의를 끌면서 몰입 유지

24. **실험적 컷의 기술적 고려사항:**
    - **Technical Feasibility**: 실제 촬영 가능한 기법 선택
    - **Post-production Integration**: 편집 후 작업과의 조화
    - **Audience Comprehension**: 관객이 이해할 수 있는 수준 유지
    - **Genre Appropriateness**: 장르에 맞는 실험적 기법 선택
    - **Budget Consideration**: 제작 비용을 고려한 기법 선택

25. **창의적 컷의 감정적 효과:**
    - **Surprise Factor**: 예상치 못한 시각적 충격
    - **Memory Anchor**: 강렬한 인상으로 기억에 남는 순간
    - **Emotional Amplification**: 감정을 시각적으로 증폭
    - **Narrative Emphasis**: 중요한 순간을 특별하게 강조
    - **Visual Poetry**: 시각적 시로 표현하는 감정

26. **실험적 컷의 구체적 적용 예시:**
    - **Jump Cut**: "문을 열고 → 바로 방 안" (시간 압축)
    - **Match Cut**: "달리는 발 → 달리는 바퀴" (움직임 연결)
    - **Graphic Match**: "원형 창문 → 원형 태양" (형태 연결)
    - **Split Screen**: "동시에 다른 장소의 두 캐릭터" (동시성)
    - **Object POV**: "카메라가 물체의 시점으로 촬영" (독특한 관점)
    - **Silhouette**: "실루엣으로만 보이는 캐릭터" (미스터리)
    - **Whip Pan**: "빠른 팬으로 긴장감 증대" (에너지)
    - **360도 회전**: "캐릭터 주변을 완전히 탐색" (공간 탐색)

27. **실험적 컷의 배치 전략:**
    - **85% 몰입감 있는 컷**: 서사 흐름과 감정 곡선에 충실
    - **15% 실험적 컷**: 클라이맥스나 전환점에서 강렬한 인상
    - **균형 유지**: 실험적 컷이 서사를 방해하지 않도록 주의
    - **감정적 정당성**: 실험적 컷이 감정을 증폭시켜야 함
    - **기억에 남는 순간**: 관객이 오래 기억할 수 있는 강렬한 시각

28. **실험적 컷의 품질 기준:**
    - **Narrative Relevance**: 스토리에 의미를 더하는 실험적 컷
    - **Emotional Impact**: 감정적 충격을 주는 실험적 컷
    - **Visual Innovation**: 시각적으로 혁신적인 실험적 컷
    - **Technical Excellence**: 기술적으로 완성도 높은 실험적 컷
    - **Audience Engagement**: 관객의 몰입을 유지하는 실험적 컷

**기술적 선택 가이드:**
- shotSize: EWS, VWS, WS, FS, LS, MLS, MS, MCS, CU, MCU, BCU, ECU, TCU, OTS, POV, TS, GS, AS, PS, BS 중 선택
- angleDirection: Eye-level, High, Low, Dutch, Bird_eye, Worm_eye, Canted, Oblique, Aerial, Ground, Overhead, Under, Side, Front, Back, Three_quarter, Profile, Reverse, POV, Subjective 중 선택  
- cameraMovement: Static, Pan, Tilt, Dolly, Zoom, Handheld, Tracking, Crane, Steadicam, Gimbal, Drone, Jib, Slider, Dolly_zoom, Arc, Circle, Spiral, Vertigo, Whip_pan, Crash_zoom, Push_in, Pull_out, Follow, Lead, Reveal, Conceal, Parallax, Time_lapse, Slow_motion, Fast_motion, Bullet_time, Matrix_style, 360_degree, VR_style 중 선택
- estimatedDuration: 1-30초 사이의 값
- productionMethod: live_action 또는 ai_generated 중 선택

특별 요구사항(specialRequirements)과 추가 인력/장비(cutDelta) 연관 관계:
1. specialCinematography가 true인 경우:
   - drone: true → cutDelta.additionalCrew.cinematography.droneOperator에 "드론 조작자" 추가
   - crane: true → cutDelta.additionalCrew.cinematography.craneOperator에 "크레인 조작자" 추가
   - jib: true → cutDelta.additionalCrew.cinematography.jibOperator에 "집 조작자" 추가
   - underwater: true → cutDelta.additionalCrew.cinematography.underwaterOperator에 "수중 촬영자" 추가
   - aerial: true → cutDelta.additionalCrew.cinematography.aerialOperator에 "공중 촬영자" 추가

2. specialEffects가 true인 경우:
   - vfx: true → cutDelta.additionalCrew.art.vfxSupervisor에 "VFX 감독" 추가, cutDelta.additionalEquipment.art.vfxEquipment에 "VFX 장비" 추가
   - pyrotechnics: true → cutDelta.additionalCrew.art.pyrotechnician에 "폭발 효과 기술자" 추가, cutDelta.additionalEquipment.art.pyrotechnics에 "폭발 효과 장비" 추가
   - smoke: true → cutDelta.additionalEquipment.art.smokeMachines에 "연기 기계" 추가
   - fog: true → cutDelta.additionalCrew.lighting.fogOperator에 "안개 효과 오퍼레이터" 추가, cutDelta.additionalEquipment.art.fogMachines에 "안개 기계" 추가
   - wind: true → cutDelta.additionalEquipment.art.windMachines에 "바람 기계" 추가
   - rain: true → cutDelta.additionalEquipment.art.rainMachines에 "비 효과 기계" 추가
   - snow: true → cutDelta.additionalEquipment.art.snowMachines에 "눈 효과 기계" 추가
   - fire: true → cutDelta.additionalEquipment.art.fireMachines에 "화재 효과 기계" 추가
   - explosion: true → cutDelta.additionalCrew.art.pyrotechnician에 "폭발 효과 기술자" 추가
   - stunt: true → cutDelta.additionalCrew.art.stuntCoordinator에 "스턴트 코디네이터" 추가

3. specialLighting이 true인 경우:
   - laser: true → cutDelta.additionalCrew.lighting.laserOperator에 "레이저 오퍼레이터" 추가
   - strobe: true → cutDelta.additionalCrew.lighting.strobeOperator에 "스트로브 오퍼레이터" 추가
   - blackLight: true → cutDelta.additionalEquipment.lighting.specialEffectsLights에 "블랙라이트" 추가
   - uvLight: true → cutDelta.additionalEquipment.lighting.specialEffectsLights에 "UV라이트" 추가
   - movingLight: true → cutDelta.additionalEquipment.lighting.specialEffectsLights에 "무빙라이트" 추가
   - colorChanger: true → cutDelta.additionalEquipment.lighting.specialEffectsLights에 "컬러체인저" 추가

4. safety가 true인 경우:
   - requiresMedic: true → cutDelta.additionalCrew.production.medic에 "의료 담당자" 추가, cutDelta.additionalEquipment.production.medicalEquipment에 "의료 장비" 추가
   - requiresFireSafety: true → cutDelta.additionalCrew.production.fireSafetyOfficer에 "소화 안전 담당자" 추가, cutDelta.additionalEquipment.production.fireSuppression에 "소화 장비" 추가
   - requiresSafetyOfficer: true → cutDelta.additionalCrew.production.safetySupervisor에 "안전 감독" 추가, cutDelta.additionalEquipment.production.safetyGear에 "안전 장비" 추가

5. 기타 특수 효과:
   - animatronics: true → cutDelta.additionalCrew.art.animatronicsOperator에 "애니매트로닉스 조작자" 추가, cutDelta.additionalEquipment.art.animatronics에 "애니매트로닉스" 추가
   - prosthetics: true → cutDelta.additionalCrew.art.prostheticsArtist에 "특수 의상 아티스트" 추가, cutDelta.additionalEquipment.art.prosthetics에 "특수 의상" 추가
   - bloodEffects: true → cutDelta.additionalCrew.art.bloodEffectsArtist에 "혈액 효과 아티스트" 추가, cutDelta.additionalEquipment.art.bloodEffects에 "혈액 효과" 추가
   - makeupEffects: true → cutDelta.additionalCrew.art.makeupEffectsArtist에 "특수 분장 아티스트" 추가, cutDelta.additionalEquipment.art.makeupEffects에 "분장 효과" 추가
   - setEffects: true → cutDelta.additionalCrew.art.setEffectsArtist에 "세트 효과 아티스트" 추가, cutDelta.additionalEquipment.art.setEffects에 "세트 효과" 추가

6. 음향 관련:
   - foleyArtist: true → cutDelta.additionalCrew.sound.foleyArtist에 "폴리 아티스트" 추가, cutDelta.additionalEquipment.sound.foleyEquipment에 "폴리 장비" 추가
   - ambienceRecordist: true → cutDelta.additionalCrew.sound.ambienceRecordist에 "환경음 녹음사" 추가, cutDelta.additionalEquipment.sound.ambienceRecorders에 "환경음 녹음기" 추가

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

  /**
   * sourceCutId로 컷을 조회합니다 (VideoService에서 사용)
   */
  async findBySourceCutId(projectId: string, sourceCutId: string): Promise<CutResponseDto> {
    if (!Types.ObjectId.isValid(sourceCutId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid sourceCutId or projectId');
    }

    const cut = await this.cutModel.findOne({
      _id: new Types.ObjectId(sourceCutId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return this.mapToResponseDto(cut);
  }

  /**
   * sourceCutId로 컷의 sceneId를 조회합니다
   */
  async findSceneIdByCutId(projectId: string, cutId: string): Promise<string> {
    if (!Types.ObjectId.isValid(cutId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid cutId or projectId');
    }

    const cut = await this.cutModel.findOne({
      _id: new Types.ObjectId(cutId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).select('sceneId').exec();

    if (!cut) {
      throw new NotFoundException('Cut not found');
    }

    return cut.sceneId.toString();
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

    // 연관된 비디오 정리 (백그라운드에서 비동기 처리)
    try {
      await this.videoService.removeBySourceCut(projectId, cutId);
    } catch (error) {
      console.warn(`컷 ${cutId}에서 생성된 비디오 정리 실패:`, error.message);
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

  async getImage(projectId: string, sceneId: string, cutId: string): Promise<string> {
    const cut = await this.findById(projectId, sceneId, cutId);
    return cut.imageUrl || '';
  }

  async uploadImage(
    projectId: string, 
    sceneId: string, 
    cutId: string, 
    file: Express.Multer.File
  ): Promise<string> {
    // 컷 존재 확인
    const cut = await this.findById(projectId, sceneId, cutId);
    
    // 기존 이미지가 있다면 삭제
    if (cut.imageUrl) {
      try {
        await this.storageFactoryService.deleteImage(cut.imageUrl);
      } catch (error) {
        console.warn('기존 이미지 삭제 실패:', error);
      }
    }

    // 파일을 base64로 변환
    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype;
    const imageData = `data:${mimeType};base64,${base64Data}`;

    // 새 이미지 업로드
    const fileName = `cut_${cutId}_${Date.now()}_${file.originalname}`;
    const imageUrl = await this.storageFactoryService.uploadImage(
      imageData,
      fileName
    );

    // 컷 업데이트
    await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        projectId: new Types.ObjectId(projectId),
        sceneId: new Types.ObjectId(sceneId),
        isDeleted: false
      },
      {
        imageUrl: imageUrl
      }
    );

    return imageUrl;
  }

  async deleteImage(projectId: string, sceneId: string, cutId: string): Promise<string> {
    const cut = await this.findById(projectId, sceneId, cutId);
    
    if (cut.imageUrl) {
      try {
        await this.storageFactoryService.deleteImage(cut.imageUrl);
      } catch (error) {
        console.warn('이미지 삭제 실패:', error);
      }
    }

    // 컷에서 이미지 URL 제거
    await this.cutModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(cutId),
        projectId: new Types.ObjectId(projectId),
        sceneId: new Types.ObjectId(sceneId),
        isDeleted: false
      },
      {
        imageUrl: ''
      }
    );

    return '이미지가 성공적으로 삭제되었습니다.';
  }

  async generateImage(projectId: string, sceneId: string, cutId: string): Promise<string> {
    const cut = await this.findById(projectId, sceneId, cutId);
    const scene = await this.sceneService.findById(projectId, sceneId);
    const project = await this.projectService.findById(projectId);
    
    // AI 이미지 생성 프롬프트 작성
    const prompt = this.buildImageGenerationPrompt(project, scene, cut);
    
    try {
      // AI 서비스를 통해 이미지 생성
      const imageResult = await this.aiService.callImageGenerations(prompt, {
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'standard'
      });

      if (imageResult.data && imageResult.data.length > 0) {
        const imageUrl = imageResult.data[0].url;
        
        // 기존 이미지가 있다면 삭제
        if (cut.imageUrl) {
          try {
            await this.storageFactoryService.deleteImage(cut.imageUrl);
          } catch (error) {
            console.warn('기존 이미지 삭제 실패:', error);
          }
        }

        // AI에서 생성된 이미지를 다운로드
        const fileName = `ai_generated_${cutId}_${Date.now()}.png`;
        const tempFilePath = await this.aiService.downloadImageFromUrl(imageUrl, fileName);

        try {
          // 다운로드한 파일을 base64로 변환
          const fileBuffer = fs.readFileSync(tempFilePath);
          const base64Data = fileBuffer.toString('base64');
          const imageData = `data:image/png;base64,${base64Data}`;

          // 스토리지 서비스에 업로드
          const storageFileName = `cut_${cutId}_${Date.now()}_ai_generated.png`;
          const storageImageUrl = await this.storageFactoryService.uploadImage(
            imageData,
            storageFileName
          );

          // 컷 업데이트
          await this.cutModel.findOneAndUpdate(
            {
              _id: new Types.ObjectId(cutId),
              projectId: new Types.ObjectId(projectId),
              sceneId: new Types.ObjectId(sceneId),
              isDeleted: false
            },
            {
              imageUrl: storageImageUrl
            }
          );

          return storageImageUrl;
        } finally {
          // 임시 파일 정리
          await this.aiService.cleanupTempFile(tempFilePath);
        }
      } else {
        throw new Error('AI 이미지 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 이미지 생성 실패:', error);
      throw new Error('AI 이미지 생성에 실패했습니다.');
    }
  }

  private buildImageGenerationPrompt(project: ProjectResponseDto, scene: SceneResponseDto, cut: CutResponseDto): string {
    const { title, description, cameraSetup, subjectMovement, productionMethod } = cut;
    const { cast, extra, location, weather, timeOfDay, scenePlace, sceneDateTime, vfxRequired, sfxRequired } = scene;
    const { genre, tags, synopsis, story } = project;

    // 기본 컷 정보
    let prompt = `Cinematic film still: ${title || 'Cut'}. `;
    
    // 컷 설명
    if (description) {
      prompt += `Scene description: ${description}. `;
    }

    // 카메라 설정
    if (cameraSetup) {
      const { shotSize, angleDirection, cameraMovement, lensSpecs, cameraSettings } = cameraSetup;
      prompt += `Camera setup: ${shotSize || 'medium'} shot, ${angleDirection || 'eye-level'} angle`;
      if (cameraMovement) prompt += `, ${cameraMovement} movement`;
      if (lensSpecs) prompt += `, ${lensSpecs} lens`;
      if (cameraSettings) {
        const { aperture, shutterSpeed, iso } = cameraSettings;
        if (aperture) prompt += `, f/${aperture}`;
        if (shutterSpeed) prompt += `, ${shutterSpeed} shutter`;
        if (iso) prompt += `, ISO ${iso}`;
      }
      prompt += '. ';
    }

    // 피사체 움직임
    if (subjectMovement && subjectMovement.length > 0) {
      prompt += `Subject movement: `;
      const movements = subjectMovement.map(movement => 
        `${movement.name || 'Character'} ${movement.action || 'acting'} ${movement.emotion || 'emotionally'} at ${movement.position || 'position'}`
      ).join(', ');
      prompt += movements + '. ';
    }

    // 씬 정보
    if (location) prompt += `Location: ${location}. `;
    if (weather) prompt += `Weather: ${weather}. `;
    if (timeOfDay) prompt += `Time of day: ${timeOfDay}. `;
    if (scenePlace) prompt += `Scene place: ${scenePlace}. `;
    if (sceneDateTime) prompt += `Scene date/time: ${sceneDateTime}. `;

    // 출연진 정보
    if (cast && cast.length > 0) {
      const castInfo = cast.map(actor => `${actor.role || 'Character'}: ${actor.name || 'Actor'}`).join(', ');
      prompt += `Cast: ${castInfo}. `;
    }
    if (extra && extra.length > 0) {
      const extraInfo = extra.map(extra => `${extra.role || 'Extra'}: ${extra.number || 'Background'}`).join(', ');
      prompt += `Extras: ${extraInfo}. `;
    }

    // 특수 효과
    if (vfxRequired) prompt += `VFX required: ${vfxRequired}. `;
    if (sfxRequired) prompt += `SFX required: ${sfxRequired}. `;

    // 프로젝트 정보
    if (genre) prompt += `Genre: ${genre}. `;
    if (tags && tags.length > 0) {
      prompt += `Tags: ${tags.join(', ')}. `;
    }
    if (synopsis) {
      prompt += `Project synopsis: ${synopsis}. `;
    }
    if (story) {
      prompt += `Story context: ${story}. `;
    }

    // 제작 방법
    if (productionMethod) {
      prompt += `Production method: ${productionMethod}. `;
    }

    // 콘티 아티스트 역할 및 카메라 움직임 화살표 표기 규칙
    prompt += ` You are a professional storyboard artist. Render a storyboard-style frame (not photoreal), with clean outlines, high readability, and clear directional overlays. `;
    if (cameraSetup?.cameraMovement) {
      prompt += this.getCameraMovementOverlay(cameraSetup.cameraMovement);
    }

    // 시네마틱/콘티 스타일 강조
    prompt += `High quality storyboard frame, clean line art, high contrast, simple shading, annotations allowed, cinematic composition, legible arrows.`;

    return prompt;
  }

  private getCameraMovementOverlay(movement: string): string {
    const original = movement || '';
    const mv = original.toLowerCase();
    const parts: string[] = [];
    parts.push('Overlay arrow guidance for camera movement: ');

    // 기본
    if (mv.includes('static')) parts.push('static: no arrow overlays. ');

    // 수평/수직
    if (mv.includes('pan') || mv.includes('whip_pan')) parts.push('pan: horizontal arrow showing left/right direction; for whip-pan, add motion streaks. ');
    if (mv.includes('tilt')) parts.push('tilt: vertical arrow up or down at frame edge. ');

    // 이동식
    if (mv.includes('dolly') || mv.includes('tracking') || mv.includes('track') || mv.includes('push_in') || mv.includes('pull_out')) parts.push('dolly/track: hatched arrow toward subject for in/push, away for out/pull. ');
    if (mv.includes('slider')) parts.push('slider: small horizontal double-headed arrow near bottom frame indicating rail direction. ');
    if (mv.includes('crane') || mv.includes('jib')) parts.push('crane/jib: long diagonal/vertical arrow indicating boom up/down with slight arc. ');
    if (mv.includes('steadicam') || mv.includes('gimbal')) parts.push('steadicam/gimbal: smooth curved arrow following subject path. ');
    if (mv.includes('handheld')) parts.push('handheld: same arrow as movement plus subtle jitter markers around frame. ');
    if (mv.includes('drone')) parts.push('drone: aerial path arrow with small altitude indicator (↑/↓) if ascending/descending. ');

    // 줌/복합
    if (mv.includes('zoom') && !mv.includes('dolly_zoom') && !mv.includes('crash_zoom')) parts.push('zoom: inward/outward arrow centered on subject; add bracket lines indicating magnification. ');
    if (mv.includes('dolly_zoom') || mv.includes('vertigo')) parts.push('dolly-zoom/vertigo: two opposite arrows—camera arrow forward/back plus zoom arrow opposite. ');
    if (mv.includes('crash_zoom')) parts.push('crash-zoom: thick rapid arrow toward or away from subject with motion streaks. ');

    // 곡선/원형
    if (mv.includes('arc')) parts.push('arc: curved arrow around subject indicating orbit direction. ');
    if (mv.includes('circle') || mv.includes('360') || mv.includes('vr_style')) parts.push('360 orbit: full circular arrow around subject or frame. ');
    if (mv.includes('spiral')) parts.push('spiral: spiral arrow inward/outward around subject. ');

    // 주체 추적/리드
    if (mv.includes('follow')) parts.push('follow: path arrow behind subject indicating camera following direction. ');
    if (mv.includes('lead')) parts.push('lead: path arrow ahead of subject indicating camera leading the motion. ');

    // 리빌/컨실
    if (mv.includes('reveal') || mv.includes('conceal')) parts.push('reveal/conceal: lateral arrow from behind an occluder showing reveal direction. ');

    // 시차
    if (mv.includes('parallax')) parts.push('parallax: foreground small arrow opposite to background arrow indicating parallax effect. ');

    // 시간 계열 (아이콘 보조)
    if (mv.includes('time_lapse')) parts.push('time-lapse: normal movement arrows plus small clock icon. ');
    if (mv.includes('slow_motion')) parts.push('slow-motion: normal arrows but thin and long, indicating slower pace. ');
    if (mv.includes('fast_motion')) parts.push('fast-motion: bold short arrows with multiple duplicates to indicate speed. ');
    if (mv.includes('bullet_time') || mv.includes('matrix_style')) parts.push('bullet-time/matrix: circular segmented arrows frozen around subject, implying orbit while action pauses. ');

    // 작은 라벨 표기 지시
    parts.push(`Add a small, unobtrusive text label near the arrow head that shows the movement name: "${original}" (8-12px, semi-transparent white with thin black outline), keep it outside the subject's face area. `);

    return parts.join('');
  }

  getStorageInfo(): { type: string; bucket?: string; localPath?: string } {
    return this.storageFactoryService.getStorageInfo();
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
      createdAt: (cut as any).createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: (cut as any).updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }
} 