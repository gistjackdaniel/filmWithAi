import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scene, SceneDocument } from './schema/scene.schema';
import { 
  CreateSceneDraftRequestDto,
  CreateSceneRequestDto, 
  UpdateSceneRequestDto, 
} from './dto/request.dto';
import { 
  SceneDraftResponseDto,
  SceneResponseDto
} from './dto/response.dto';
import { AiService } from 'src/ai/ai.service';
import { ConfigService } from '@nestjs/config';
import { ProjectService } from 'src/project/project.service';
import { ProjectResponseDto } from 'src/project/dto/response.dto';

@Injectable()
export class SceneService {
  constructor(
    @InjectModel(Scene.name) private sceneModel: Model<SceneDocument>,
    private aiService: AiService,
    private projectService: ProjectService,
    private configService: ConfigService,
  ) {}

  async create(projectId: string, createSceneDto: CreateSceneRequestDto): Promise<SceneResponseDto> {
    const scene = new this.sceneModel({
      ...createSceneDto,
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    });
    const savedScene = await scene.save();
    return savedScene;
  }

  async findByProjectId(projectId: string): Promise<SceneResponseDto[]> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid project ID');
    }

    const scenes = await this.sceneModel.find({
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    })
    .sort({ order: 1 })
    .exec();

    return scenes;
  }

  async findById(projectId: string, sceneId: string): Promise<SceneResponseDto> {
    if (!Types.ObjectId.isValid(sceneId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid scene ID or project ID');
    }

    const scene = await this.sceneModel.findOne({
      _id: new Types.ObjectId(sceneId),
      projectId: new Types.ObjectId(projectId),
      isDeleted: false
    }).exec();

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    return scene;
  }

  async update(projectId: string, sceneId: string, updateSceneDto: UpdateSceneRequestDto): Promise<SceneResponseDto> {
    if (!Types.ObjectId.isValid(sceneId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid scene ID or project ID');
    }

    const scene = await this.sceneModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        ...updateSceneDto,
      },
      { new: true }
    ).exec();

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    return scene;
  }

  async delete(projectId: string, sceneId: string): Promise<SceneResponseDto> {
    if (!Types.ObjectId.isValid(sceneId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid scene ID or project ID');
    }

    const scene = await this.sceneModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: false
      },
      {
        isDeleted: true,
      },
      { new: true }
    ).exec();

    if (!scene) {
      throw new NotFoundException('Scene not found');
    }

    return scene;
  }

  async restore(projectId: string, sceneId: string): Promise<SceneResponseDto> {
    if (!Types.ObjectId.isValid(sceneId) || !Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid scene ID or project ID');
    }

    const scene = await this.sceneModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sceneId),
        projectId: new Types.ObjectId(projectId),
        isDeleted: true
      },
      {
        isDeleted: false,
      },
      { new: true }
    ).exec();

    if (!scene) {
      throw new NotFoundException('Deleted scene not found');
    }

    return scene;
  }

  async createDraft(projectId: string, createSceneDraftRequestDto: CreateSceneDraftRequestDto): Promise<SceneDraftResponseDto[]> {
    const project = await this.projectService.findById(projectId);

    // 단일 단계: 부서별 crew/equipment를 포함한 전체 씬 생성
    const scenePrompt = await this.buildScenePrompt(createSceneDraftRequestDto.maxScenes, project);

    const result = await this.aiService.callChatCompletions([
      {
        role: 'system',
        content: `당신은 영화 씬 생성기입니다. 프로젝트 정보에 따라 최대 ${createSceneDraftRequestDto.maxScenes}개의 완성된 씬을 생성하고, 각 씬에 부서별 crew와 equipment를 포함하세요.`
      },
      {
        role: 'user',
        content: scenePrompt
      }
    ], {
      max_tokens: 12000,
      temperature: 0.7
    });

    const scenes = this.parseSceneDraftResponse(result);

    // 카탈로그 확장 (장비/인력 세트 해석)
    const expandedScenes: SceneDraftResponseDto[] = [];
    for (const s of scenes) {
      // 1) DTO 스키마에 맞춰 정규화 (6부서 강제)
      const normalized = this.normalizeSceneDraft(s);
      // 2) 선택적 카탈로그 확장
      const expanded = await this.expandWithCatalog(normalized);
      expandedScenes.push(expanded);
    }

    return expandedScenes;
  }

  // Draft를 실제 씬으로 저장
  async saveDraftAsScene(projectId: string, sceneDrafts: SceneDraftResponseDto[]): Promise<SceneResponseDto[]> {
    const savedScenes: SceneResponseDto[] = [];
    
    for (const draft of sceneDrafts) {
      // Draft를 실제 씬으로 변환
      const sceneData = {
        projectId: new Types.ObjectId(projectId),
        order: draft.order,
        title: draft.title,
        description: draft.description,
        dialogues: draft.dialogues || [],
        weather: draft.weather || '',
        visualDescription: draft.visualDescription || '',
        lighting: draft.lighting || {},
        location: draft.location || { name: '', address: '' },
        timeOfDay: draft.timeOfDay || '오후',
        // category 필드는 SceneDraftResponseDto에 없으므로 기본값 사용
        estimatedDuration: draft.estimatedDuration || '5분',
        crew: draft.crew || {},
        equipment: draft.equipment || {},
        cast: draft.cast || [],
        specialRequirements: draft.specialRequirements || [],
        vfxRequired: draft.vfxRequired || false,
        sfxRequired: draft.sfxRequired || false,
        isDeleted: false
      };

      const newScene = new this.sceneModel(sceneData);
      const savedScene = await newScene.save();
      
      savedScenes.push(savedScene.toObject());
    }

    return savedScenes;
  }


  private parseSceneDraftResponse(content: string): SceneDraftResponseDto[] {
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

    try {
      const sceneList = JSON.parse(jsonContent);
      
      // 1. scenes 배열인 경우 (올바른 형식)
      if (sceneList.scenes && Array.isArray(sceneList.scenes)) {
        const sceneData: Array<SceneDraftResponseDto> = sceneList.scenes.map((scene: any) => {
          return {
            ...scene,
          };
        });
        return sceneData;
      }
      
      // 2. 씬 배열인 경우 (현재 잘못된 형식)
      if (Array.isArray(sceneList)) {
        const sceneData: Array<SceneDraftResponseDto> = sceneList.map((scene: any) => {
          return {
            ...scene,
          };
        });
        return sceneData;
      }
      
      // 3. 단일 씬인 경우
      if (sceneList.order && sceneList.title) {
        return [sceneList];
      }

      console.error(`sceneList: ${JSON.stringify(sceneList)}`);
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    } catch (error) {
      console.error('JSON 파싱 실패:', {
        message: error.message,
        stack: error.stack,
        content: jsonContent,
        contentLength: jsonContent.length,
      });
      throw new Error('AI 응답을 파싱할 수 없습니다.');
    }
  }

  async buildScenePrompt(maxScenes: number, project: ProjectResponseDto): Promise<string> {
    return `
다음 스토리를 바탕으로 영화 씬을 최대 ${maxScenes}개 생성해주세요.

**중요: 최대 ${maxScenes}개의 씬을 생성해주세요.**
Scene 스키마에 따라 다음 필드들을 포함해야 합니다:

**기본 정보:**
1. **scene**: 씬 번호 (숫자)
2. **title**: 씬 제목 (문자열)
3. **description**: 씬 설명 - 인물들의 상황, 감정, 배경 설명 (1000자 이내)

**대화 및 환경:**
4. **dialogues**: 씬 전체 대사 배열 (선택적)
   - character: 대사하는 인물
   - text: 대사 내용 (500자 이내)
5. **weather**: 날씨 조건 (문자열)
6. **visualDescription**: 시각적 묘사 (500자 이내)

**조명 설정:**
7. **lighting**: 조명 설정 객체
   - description: 조명 묘사 (200자 이내)
   - setup: 상세 조명 설정
     * keyLight: 메인광 (type, equipment, intensity)
     * fillLight: 보조광 (type, equipment, intensity)
     * backLight: 배경광 (type, equipment, intensity)
     * backgroundLight: 배경조명 (type, equipment, intensity)
     * specialEffects: 특수조명 (type, equipment, intensity)
     * softLight: 부드러운광 (type, equipment, intensity)
     * gripModifier: 보조도구 (flags, diffusion, reflectors, colorGels)
     * overall: 전체설정 (colorTemperature, mood)

**스케줄링 정보:**
8. **location**: scene을 촬영할 실제 촬영 장소 정보. 촬영지에 대한 지도 검색 후 반영. 프로젝트와 씬에 대한 정보를 고려하여 장소를 선정
   - address: 실제 장소 주소
   - name: address에 해당하는 실제 장소 이름
   - group_name: 가까운 위치에 있는 Location의 집합 이름
9. **timeOfDay**: 촬영 시간대 (enum: ['새벽', '아침', '오후', '저녁', '밤'])
10. **estimatedDuration**: 예상 지속시간 (문자열, 예: "5분")

**인력 구성:**
11. **crew**: 필요 인력 수 (부서별, 숫자로 명시)
    - direction: 연출부 필요 인원 수 (director, assistantDirector, scriptSupervisor, continuity)
    - production: 제작부 필요 인원 수 (producer, lineProducer, productionManager, productionAssistant)
    - cinematography: 촬영부 필요 인원 수 (cinematographer, cameraOperator, firstAssistant, secondAssistant, dollyGrip)
    - lighting: 조명부 필요 인원 수 (gaffer, bestBoy, electrician, generatorOperator)
    - sound: 음향부 필요 인원 수 (soundMixer, boomOperator, soundAssistant, utility)
    - art: 미술부 필요 인원 수 (productionDesigner, artDirector, setDecorator, propMaster, makeupArtist, costumeDesigner, hairStylist)

**장비 구성:**
12. **equipment**: 필요 장비 (부서별, 씬 특성에 맞는 장비 선택)

**씬 특성별 장비 선택 기준:**

**카메라 선택 기준:**
- **액션/빠른 움직임**: RED Komodo 6K (고프레임레이트), Sony FX6 (안정화)
- **정적인 대화**: Canon C300 Mark III (고품질), ARRI Alexa Mini (영화감)
- **야외 촬영**: Sony FX6 (가벼움), Canon C300 Mark III (내구성)
- **실내 촬영**: RED Komodo 6K (고해상도), ARRI Alexa Mini (색감)

**렌즈 선택 기준:**
- **와이드 쇼트 (풍경, 실내)**: Zeiss CP.3 24mm T2.1, Canon CN-E 16-35mm T2.8
- **미디엄 쇼트 (대화, 중간거리)**: Zeiss CP.3 50mm T2.1, Canon CN-E 24-70mm T2.8
- **클로즈업 (감정표현)**: Sigma Cine 85mm T1.5, Zeiss CP.3 100mm T2.1
- **액션/움직임**: Canon CN-E 24-70mm T2.8 (줌), Sigma Cine 50mm T1.5 (빠른 조리개)

**지지대 선택 기준:**
- **정적 촬영**: Manfrotto 504HD (안정성), Sachtler Video 18 (부드러움)
- **움직임 촬영**: DJI RS 3 Pro (짐벌), Steadicam (손촬영)
- **야외 촬영**: Sachtler Video 18 (내구성), Manfrotto 504HD (무게)
- **실내 촬영**: Manfrotto 504HD (정밀도), DJI RS 3 Pro (유연성)

**필터 선택 기준:**
- **야외 촬영**: Tiffen Variable ND (노출 조절), Polarizing Filter (반사 제거)
- **인물 촬영**: Black Pro-Mist 1/4 (부드러운 피부), Tiffen Soft/FX (미스트)
- **액션 촬영**: Tiffen Variable ND (빠른 조절), Polarizing Filter (선명도)
- **분위기 촬영**: Black Pro-Mist 1/4 (로맨틱), Tiffen Warm Pro-Mist (따뜻함)

**액세서리 선택 기준:**
- **액션 촬영**: Teradek Bolt 4K (무선 모니터링), DJI Focus Motor (자동 포커스)
- **정적 촬영**: SmallHD 7" Monitor (정밀 모니터링), DJI Focus Motor (수동 포커스)
- **야외 촬영**: Teradek Bolt 4K (원격 모니터링), DJI Focus Motor (안정성)
- **실내 촬영**: SmallHD 7" Monitor (색감 확인), DJI Focus Motor (정밀도)

**조명 장비 선택 기준:**
- **야외 촬영**: HMI 조명 (자연광 보조), LED 패널 (휴대성)
- **실내 촬영**: Tungsten 조명 (따뜻한 색감), LED 조명 (에너지 효율)
- **액션 촬영**: LED 조명 (빠른 설정), HMI 조명 (강한 빛)
- **인물 촬영**: Softbox (부드러운 빛), Ring Light (균등한 조명)

**음향 장비 선택 기준:**
- **대화 촬영**: Sennheiser MKH416 (클로즈업 마이크), Shure SM7B (보이스)
- **액션 촬영**: 무선 마이크 (움직임), Boom 마이크 (자유도)
- **야외 촬영**: Wind Shield (바람 차단), 무선 마이크 (거리)
- **실내 촬영**: Boom 마이크 (품질), 클로즈업 마이크 (정밀도)

**미술 장비 선택 기준:**
- **실내 세트**: Set Construction 도구, Set Dressing 소품
- **야외 촬영**: Portable Set Dressing, Weather Protection
- **액션 촬영**: Safety Equipment, Stunt Props
- **인물 촬영**: Makeup Station, Costume Dressing Room

**씬 분석 후 장비 선택:**
- 씬의 내용, 분위기, 촬영 환경을 분석하여 적합한 장비 선택
- 예산과 시간을 고려한 현실적인 장비 구성
- 씬의 특성에 맞는 최적의 장비 조합 제시

**출연진:**
13. **cast**: 출연진 정보 (배열), 역할마다 하나의 object로 표현
      - role: 역할 (문자열)
      - name: 역할의 이름 (문자열)
    - extra: 추가 출연진 정보 (배열)
      - role: 역할 (문자열)
      - number: 인원 (숫자)

**특별 요구사항:**
14. **specialRequirements**: 특별 요구사항 배열 (문자열 배열)
15. **vfxRequired**: VFX 필요 여부 (boolean)
16. **sfxRequired**: SFX 필요 여부 (boolean)

**예상 시간 계산 기준:**
- 기본 시간: 2분
- 대사가 있는 장면: +0.5분
- 긴 대사 (100자 이상): +1분
- 중간 길이 대사 (50자 이상): +0.5분
- 많은 단어 (20개 이상): +0.5분
- 중간 단어 수 (10개 이상): +0.25분
- 감정적 대사 (!, ?, ..., ㅠ, ㅜ): +0.25분
- 특수효과/CG 장면: +1분  
- 액션 장면: +1분
- 감정적 장면: +1분
- 단순 자연 풍경: -1분
- 최소 1분, 최대 8분으로 제한

**대사 생성 지침:**
- 각 장면의 예상 시간에 맞는 충분한 대사량을 생성해주세요
- 1분당 약 150-200자 정도의 대사가 적절합니다
- 대사는 자연스러운 대화 흐름을 따라야 합니다
- 내레이션, 음성 효과, 배경 음성도 포함해주세요
- 대사가 없는 장면도 있지만, 대부분의 장면에는 적절한 대사가 있어야 합니다

**시간대 구분:**
- **새벽**: 오전 0시 ~ 6시
- **아침**: 오전 6시 ~ 11시
- **점심**: 오전 11시 ~ 오후 4시
- **저녁**: 오후 4시 ~ 8시
- **밤**: 오후 8시 ~ 오전 12시

**중요:**
- 반드시 timeOfDay(촬영 시간대)를 명확히 설정해야 합니다
- 이전 씬과의 연속성을 고려하여 자연스러운 흐름을 만들어주세요
- 각 필드의 길이 제한을 준수해주세요

input:
${JSON.stringify({
  title: project.title,
  synopsis: project.synopsis,
  genre: project.genre,
  estimatedDuration: project.estimatedDuration,
  story: project.story
})}

반드시 다음 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:

{
  "scenes": [
    {
      "order": 1,
      "title": "씬 제목",
      "description": "씬 설명 (1000자 이내)",
      "dialogues": [
        {
          "character": "캐릭터명",
          "text": "대사 내용"
        }
      ],
      "weather": "날씨",
      "lighting": {
        "description": "조명 설명",
        "setup": {
          "keyLight": { "type": "키 라이트", "equipment": "조명 장비", "intensity": "강도" },
          "fillLight": { "type": "필 라이트", "equipment": "조명 장비", "intensity": "강도" },
          "backLight": { "type": "백 라이트", "equipment": "조명 장비", "intensity": "강도" },
          "backgroundLight": { "type": "배경 조명", "equipment": "조명 장비", "intensity": "강도" },
          "specialEffects": { "type": "특수 조명", "equipment": "조명 장비", "intensity": "강도" },
          "softLight": { "type": "소프트 라이트", "equipment": "조명 장비", "intensity": "강도" },
          "gripModifier": {
            "flags": ["플래그"],
            "diffusion": ["디퓨전"],
            "reflectors": ["리플렉터"],
            "colorGels": ["컬러 겔"]
          },
          "overall": {
            "colorTemperature": "컬러 온도",
            "mood": "분위기"
          }
        }
      },
      "visualDescription": "시각적 설명",
      "scenePlace": "스토리 장소",
      "sceneDateTime": "스토리 시간",
      "vfxRequired": false,
      "sfxRequired": false,
      "estimatedDuration": "예상 지속 시간",
      "location": {
        "address": "실제 장소 주소",
        "name": "장소 이름",
        "group_name": "그룹 이름"
      },
      "timeOfDay": "새벽, 아침, 점심, 저녁, 밤 중 하나",
      "crew": {
        "direction": {
          "director": [{"role": "역할"}],
          "assistantDirector": [{"role": "역할"}],
          "scriptSupervisor": [{"role": "역할"}],
          "continuity": [{"role": "역할"}]
        },
        "production": {
          "producer": [{"role": "역할"}],
          "lineProducer": [{"role": "역할"}],
          "productionManager": [{"role": "역할"}],
          "productionAssistant": [{"role": "역할"}]
        },
        "cinematography": {
          "cinematographer": [{"role": "역할"}],
          "cameraOperator": [{"role": "역할"}],
          "firstAssistant": [{"role": "역할"}],
          "secondAssistant": [{"role": "역할"}],
          "dollyGrip": [{"role": "역할"}]
        },
        "lighting": {
          "gaffer": [{"role": "역할"}],
          "bestBoy": [{"role": "역할"}],
          "electrician": [{"role": "역할"}],
          "generatorOperator": [{"role": "역할"}]
        },
        "sound": {
          "soundMixer": [{"role": "역할"}],
          "boomOperator": [{"role": "역할"}],
          "soundAssistant": [{"role": "역할"}],
          "utility": [{"role": "역할"}]
        },
        "art": {
          "productionDesigner": [{"role": "역할"}],
          "artDirector": [{"role": "역할"}],
          "setDecorator": [{"role": "역할"}],
          "propMaster": [{"role": "역할"}],
          "makeupArtist": [{"role": "역할"}],
          "costumeDesigner": [{"role": "역할"}],
          "hairStylist": [{"role": "역할"}]
        }
      },
      "equipment": {
        "direction": {
          "monitors": ["장비 이름"],
          "communication": ["장비 이름"],
          "scriptBoards": ["장비 이름"]
        },
        "production": {
          "scheduling": ["장비 이름"],
          "safety": ["장비 이름"],
          "transportation": ["장비 이름"]
        },
        "cinematography": {
          "cameras": ["장비 이름"],
          "lenses": ["장비 이름"],
          "supports": ["장비 이름"],
          "filters": ["장비 이름"],
          "accessories": ["장비 이름"]
        },
        "lighting": {
          "keyLights": ["장비 이름"],
          "fillLights": ["장비 이름"],
          "backLights": ["장비 이름"],
          "backgroundLights": ["장비 이름"],
          "specialEffectsLights": ["장비 이름"],
          "softLights": ["장비 이름"],
          "gripModifiers": {
            "flags": ["장비 이름"],
            "diffusion": ["장비 이름"],
            "reflectors": ["장비 이름"],
            "colorGels": ["장비 이름"]
          },
          "power": ["장비 이름"]
        },
        "sound": {
          "microphones": ["장비 이름"],
          "recorders": ["장비 이름"],
          "wireless": ["장비 이름"],
          "monitoring": ["장비 이름"]
        },
        "art": {
          "setConstruction": ["장비 이름"],
          "props": {
            "characterProps": ["소품 이름"],
            "setProps": ["소품 이름"]
          },
          "setDressing": ["세트 장식"],
          "costumes": ["의상 이름"],
          "specialEffects": ["특수 효과"]
        }
      },
      "cast": [{"role": "역할", "name": "역할이름"}],
      "extra": [{"role": "역할", "number": 1}],
      "specialRequirements": ["특별 요구사항"]
    }
  ]
}
`;
  }

  // LLM 응답을 DTO 스키마에 맞도록 강제 정규화 (6부서 보장)
  private normalizeSceneDraft(scene: any): SceneDraftResponseDto {
    const draft = JSON.parse(JSON.stringify(scene || {}));

    // crew 정규화
    draft.crew = draft.crew || {};
    const crewDepts = ['direction','production','cinematography','lighting','sound','art'];
    for (const dept of crewDepts) {
      draft.crew[dept] = draft.crew[dept] || {};
      for (const [key, val] of Object.entries(draft.crew[dept])) {
        if (!Array.isArray(val)) {
          // 문자열이면 role로 감싼 객체 배열, 객체면 배열로 감싸기
          if (typeof val === 'string') {
            (draft.crew[dept] as any)[key] = [{ role: val }];
          } else if (val && typeof val === 'object') {
            (draft.crew[dept] as any)[key] = [val];
          } else {
            (draft.crew[dept] as any)[key] = [];
          }
        }
      }
    }

    // equipment 정규화
    draft.equipment = draft.equipment || {};
    // 레거시 상위 키(camera/lenses/lighting/sound)를 6부서로 매핑
    const eq = draft.equipment;
    // 보조: 배열 강제 함수
    const ensureArray = (v: any) => (Array.isArray(v) ? v : v != null ? [v] : []);

    // cinematography
    eq.cinematography = eq.cinematography || {};
    if (eq.camera && !eq.cinematography.cameras) eq.cinematography.cameras = ensureArray(eq.camera);
    if (eq.lenses && !eq.cinematography.lenses) eq.cinematography.lenses = ensureArray(eq.lenses);
    if (eq.supports && !eq.cinematography.supports) eq.cinematography.supports = ensureArray(eq.supports);
    if (eq.filters && !eq.cinematography.filters) eq.cinematography.filters = ensureArray(eq.filters);
    if (eq.accessories && !eq.cinematography.accessories) eq.cinematography.accessories = ensureArray(eq.accessories);

    // lighting (장비 섹션)
    eq.lighting = eq.lighting || {};
    if (eq.keyLights && !eq.lighting.keyLights) eq.lighting.keyLights = ensureArray(eq.keyLights);
    if (eq.fillLights && !eq.lighting.fillLights) eq.lighting.fillLights = ensureArray(eq.fillLights);
    if (eq.backLights && !eq.lighting.backLights) eq.lighting.backLights = ensureArray(eq.backLights);
    if (eq.backgroundLights && !eq.lighting.backgroundLights) eq.lighting.backgroundLights = ensureArray(eq.backgroundLights);
    if (eq.specialEffectsLights && !eq.lighting.specialEffectsLights) eq.lighting.specialEffectsLights = ensureArray(eq.specialEffectsLights);
    if (eq.softLights && !eq.lighting.softLights) eq.lighting.softLights = ensureArray(eq.softLights);
    if (eq.power && !eq.lighting.power) eq.lighting.power = ensureArray(eq.power);
    if (eq.gripModifiers) {
      eq.lighting.gripModifiers = eq.lighting.gripModifiers || {};
      const g = eq.gripModifiers;
      if (g.flags && !eq.lighting.gripModifiers.flags) eq.lighting.gripModifiers.flags = ensureArray(g.flags);
      if (g.diffusion && !eq.lighting.gripModifiers.diffusion) eq.lighting.gripModifiers.diffusion = ensureArray(g.diffusion);
      if (g.reflectors && !eq.lighting.gripModifiers.reflectors) eq.lighting.gripModifiers.reflectors = ensureArray(g.reflectors);
      if (g.colorGels && !eq.lighting.gripModifiers.colorGels) eq.lighting.gripModifiers.colorGels = ensureArray(g.colorGels);
    }

    // sound
    eq.sound = eq.sound || {};
    if (eq.microphones && !eq.sound.microphones) eq.sound.microphones = ensureArray(eq.microphones);
    if (eq.recorders && !eq.sound.recorders) eq.sound.recorders = ensureArray(eq.recorders);
    if (eq.wireless && !eq.sound.wireless) eq.sound.wireless = ensureArray(eq.wireless);
    if (eq.monitoring && !eq.sound.monitoring) eq.sound.monitoring = ensureArray(eq.monitoring);

    // direction
    eq.direction = eq.direction || {};
    if (eq.monitors && !eq.direction.monitors) eq.direction.monitors = ensureArray(eq.monitors);
    if (eq.communication && !eq.direction.communication) eq.direction.communication = ensureArray(eq.communication);
    if (eq.scriptBoards && !eq.direction.scriptBoards) eq.direction.scriptBoards = ensureArray(eq.scriptBoards);

    // production
    eq.production = eq.production || {};
    if (eq.scheduling && !eq.production.scheduling) eq.production.scheduling = ensureArray(eq.scheduling);
    if (eq.safety && !eq.production.safety) eq.production.safety = ensureArray(eq.safety);
    if (eq.transportation && !eq.production.transportation) eq.production.transportation = ensureArray(eq.transportation);

    // art
    eq.art = eq.art || {};
    if (eq.setConstruction && !eq.art.setConstruction) eq.art.setConstruction = ensureArray(eq.setConstruction);
    if (eq.props) {
      eq.art.props = eq.art.props || {};
      if (eq.props.characterProps && !eq.art.props.characterProps) eq.art.props.characterProps = ensureArray(eq.props.characterProps);
      if (eq.props.setProps && !eq.art.props.setProps) eq.art.props.setProps = ensureArray(eq.props.setProps);
    }
    if (eq.setDressing && !eq.art.setDressing) eq.art.setDressing = ensureArray(eq.setDressing);
    if (eq.costumes && !eq.art.costumes) eq.art.costumes = ensureArray(eq.costumes);
    if (eq.specialEffects && !eq.art.specialEffects) eq.art.specialEffects = ensureArray(eq.specialEffects);

    // 반환 (타입 캐스팅은 호출부에서 SceneDraftResponseDto 기대)
    return draft as SceneDraftResponseDto;
  }

  // 3단계: 서버 카탈로그 시스템으로 전문 정보 확장
  private async expandWithCatalog(sceneDetail: SceneDraftResponseDto): Promise<SceneDraftResponseDto> {
    // 플래그로 전체 확장 on/off (기본: off)
    const enableCatalog = this.configService.get<boolean>('ENABLE_CATALOG_EXPANSION') === true
      || this.configService.get<string>('ENABLE_CATALOG_EXPANSION') === 'true';

    if (!enableCatalog) {
      // 카탈로그가 준비되기 전에는 원문 구조와 문자열을 그대로 유지
      return sceneDetail;
    }

    // 장비 카탈로그 확장 (부서별 in-place)
    if (sceneDetail.equipment) {
      sceneDetail.equipment = await this.expandEquipmentCatalog(sceneDetail.equipment);
    }

    // 인력 카탈로그 확장 (부서별 in-place)
    if (sceneDetail.crew) {
      sceneDetail.crew = await this.expandCrewCatalog(sceneDetail.crew);
    }

    // 조명 카탈로그 확장 제거: 장비 카탈로그와 중복되어 더 이상 확장하지 않음

    return sceneDetail;
  }

  // 장비 카탈로그 확장
  private async expandEquipmentCatalog(equipment: any): Promise<any> {
    // 카탈로그 사전 (세트 코드 → 상세) - 필요 시 확장
    const equipmentCatalog = {
      "CAM_SET_A": {
        "name": "RED Komodo 6K Camera Kit",
        "description": "액션/빠른 움직임에 최적화된 고프레임레이트 카메라",
        "items": [
          "RED Komodo 6K Camera Body",
          "Teradek Bolt 4K Wireless Transmitter",
          "DJI RS 3 Pro Gimbal",
          "Samsung T7 SSD 1TB"
        ],
        "reason": "액션 씬의 빠른 움직임을 포착하기 위한 고프레임레이트 지원",
        "alternatives": ["Sony FX6 Kit", "Canon C300 Mark III Kit"]
      },
      "CAM_SET_B": {
        "name": "Canon C300 Mark III Camera Kit",
        "description": "정적 대화 씬에 최적화된 고품질 카메라",
        "items": [
          "Canon C300 Mark III Camera Body",
          "Canon CN-E 50mm T1.3 Lens",
          "DJI RS 3 Pro Gimbal",
          "Samsung T7 SSD 1TB"
        ],
        "reason": "대화 씬의 자연스러운 색감과 부드러운 포커스",
        "alternatives": ["ARRI Alexa Mini Kit", "Sony FX9 Kit"]
      },
      "CAM_SET_C": {
        "name": "Sony FX6 Camera Kit",
        "description": "야외 촬영에 최적화된 가벼운 카메라",
        "items": [
          "Sony FX6 Camera Body",
          "Sony FE 24-70mm f/2.8 GM Lens",
          "DJI RS 3 Pro Gimbal",
          "Samsung T7 SSD 1TB"
        ],
        "reason": "야외 촬영의 가벼움과 내구성",
        "alternatives": ["Canon C300 Mark III Kit", "RED Komodo 6K Kit"]
      },
      "CAM_SET_D": {
        "name": "ARRI Alexa Mini Camera Kit",
        "description": "실내 촬영에 최적화된 영화감 카메라",
        "items": [
          "ARRI Alexa Mini Camera Body",
          "Zeiss CP.3 50mm T2.1 Lens",
          "DJI RS 3 Pro Gimbal",
          "Samsung T7 SSD 1TB"
        ],
        "reason": "실내 촬영의 영화감 색감과 부드러운 톤",
        "alternatives": ["Canon C300 Mark III Kit", "Sony FX6 Kit"]
      },
      "LENS_SET_A": {
        "name": "Wide Angle Lens Set",
        "description": "풍경과 실내 촬영용 와이드 렌즈",
        "items": [
          "Zeiss CP.3 24mm T2.1",
          "Canon CN-E 16-35mm T2.8",
          "Sigma Cine 18-35mm T2.0"
        ],
        "reason": "와이드 쇼트로 공간감과 분위기 표현",
        "alternatives": ["LENS_SET_B", "LENS_SET_C"]
      },
      "LENS_SET_B": {
        "name": "Medium Angle Lens Set",
        "description": "대화와 중간거리 촬영용 미디엄 렌즈",
        "items": [
          "Zeiss CP.3 50mm T2.1",
          "Canon CN-E 24-70mm T2.8",
          "Sigma Cine 50mm T1.5"
        ],
        "reason": "자연스러운 시점과 부드러운 포커스",
        "alternatives": ["LENS_SET_A", "LENS_SET_C"]
      },
      "LENS_SET_C": {
        "name": "Close-up Lens Set",
        "description": "감정표현과 클로즈업 촬영용 렌즈",
        "items": [
          "Sigma Cine 85mm T1.5",
          "Zeiss CP.3 100mm T2.1",
          "Canon CN-E 85mm T1.3"
        ],
        "reason": "감정표현과 세밀한 포커스",
        "alternatives": ["LENS_SET_B", "LENS_SET_D"]
      },
      "LENS_SET_D": {
        "name": "Action Lens Set",
        "description": "액션과 움직임 촬영용 렌즈",
        "items": [
          "Canon CN-E 24-70mm T2.8",
          "Sigma Cine 50mm T1.5",
          "Zeiss CP.3 35mm T2.1"
        ],
        "reason": "빠른 움직임과 줌 기능",
        "alternatives": ["LENS_SET_B", "LENS_SET_C"]
      },
      "LIGHT_SET_A": {
        "name": "Outdoor Natural Light Kit",
        "description": "야외 자연광 보조 조명",
        "items": [
          "Aputure 600D Pro LED",
          "Aputure 300D Pro LED",
          "Aputure Light Dome II",
          "Matthews Hollywood Grip Kit"
        ],
        "reason": "자연광을 보조하는 자연스러운 조명",
        "alternatives": ["LIGHT_SET_B", "LIGHT_SET_C"]
      },
      "LIGHT_SET_B": {
        "name": "Indoor Artificial Light Kit",
        "description": "실내 인공광 조명",
        "items": [
          "Aputure 600D Pro LED",
          "Aputure 300D Pro LED",
          "Aputure Light Dome II",
          "Matthews Hollywood Grip Kit"
        ],
        "reason": "실내 환경에 최적화된 인공 조명",
        "alternatives": ["LIGHT_SET_A", "LIGHT_SET_C"]
      },
      "LIGHT_SET_C": {
        "name": "Dramatic Light Kit",
        "description": "강렬하고 드라마틱한 조명 효과",
        "items": [
          "Aputure 600D Pro LED",
          "Aputure 300D Pro LED",
          "Aputure Light Dome II",
          "Matthews Hollywood Grip Kit"
        ],
        "reason": "강렬하고 드라마틱한 조명 효과",
        "alternatives": ["LIGHT_SET_B", "LIGHT_SET_D"]
      },
      "LIGHT_SET_D": {
        "name": "Natural Light Kit",
        "description": "자연스러운 분위기 조명",
        "items": [
          "Aputure 600D Pro LED",
          "Aputure 300D Pro LED",
          "Aputure Light Dome II",
          "Matthews Hollywood Grip Kit"
        ],
        "reason": "자연스럽고 부드러운 조명",
        "alternatives": ["LIGHT_SET_A", "LIGHT_SET_B"]
      },
      "SOUND_SET_A": {
        "name": "Indoor Sound Kit",
        "description": "실내 음향 녹음 장비",
        "items": [
          "Sennheiser MKH 416 Shotgun Mic",
          "Zoom F8n Field Recorder",
          "Sennheiser G4 Wireless Lavalier",
          "Rycote Windshield"
        ],
        "reason": "실내 환경에 최적화된 음향 녹음",
        "alternatives": ["SOUND_SET_B", "SOUND_SET_D"]
      },
      "SOUND_SET_B": {
        "name": "Outdoor Sound Kit",
        "description": "야외 음향 녹음 장비",
        "items": [
          "Sennheiser MKH 416 Shotgun Mic",
          "Zoom F8n Field Recorder",
          "Sennheiser G4 Wireless Lavalier",
          "Rycote Windshield"
        ],
        "reason": "야외 환경에 최적화된 음향 녹음",
        "alternatives": ["SOUND_SET_A", "SOUND_SET_C"]
      },
      "SOUND_SET_C": {
        "name": "Action Sound Kit",
        "description": "액션 씬 음향 녹음 장비",
        "items": [
          "Sennheiser MKH 416 Shotgun Mic",
          "Zoom F8n Field Recorder",
          "Sennheiser G4 Wireless Lavalier",
          "Rycote Windshield"
        ],
        "reason": "액션 씬의 동적인 음향 녹음",
        "alternatives": ["SOUND_SET_B", "SOUND_SET_D"]
      },
      "SOUND_SET_D": {
        "name": "Dialogue Sound Kit",
        "description": "대화 씬 음향 녹음 장비",
        "items": [
          "Sennheiser MKH 416 Shotgun Mic",
          "Zoom F8n Field Recorder",
          "Sennheiser G4 Wireless Lavalier",
          "Rycote Windshield"
        ],
        "reason": "대화 씬의 명확한 음향 녹음",
        "alternatives": ["SOUND_SET_A", "SOUND_SET_B"]
      }
    };

    // 부서별 in-place 확장: 기존 키 구조(direction/production/cinematography/lighting/sound/art)를 보존
    const clone = JSON.parse(JSON.stringify(equipment || {}));

    // 헬퍼: 배열을 세트코드 → 상세객체로 매핑하되, 카탈로그 없으면 원문 유지
    const mapSetArray = (arr: any[]) =>
      Array.isArray(arr)
        ? arr.map((id) => (equipmentCatalog[id] ? { id, ...equipmentCatalog[id] } : id))
        : arr;

    // cinematography: cameras/lenses/supports/filters/accessories
    if (clone.cinematography) {
      const c = clone.cinematography;
      if (c.cameras) c.cameras = mapSetArray(c.cameras);
      if (c.lenses) c.lenses = mapSetArray(c.lenses);
      if (c.supports) c.supports = mapSetArray(c.supports);
      if (c.filters) c.filters = mapSetArray(c.filters);
      if (c.accessories) c.accessories = mapSetArray(c.accessories);
    }

    // lighting: keyLights/fillLights/backLights/backgroundLights/specialEffectsLights/softLights + gripModifiers(flags/diffusion/reflectors/colorGels) + power
    if (clone.lighting) {
      const l = clone.lighting;
      if (l.keyLights) l.keyLights = mapSetArray(l.keyLights);
      if (l.fillLights) l.fillLights = mapSetArray(l.fillLights);
      if (l.backLights) l.backLights = mapSetArray(l.backLights);
      if (l.backgroundLights) l.backgroundLights = mapSetArray(l.backgroundLights);
      if (l.specialEffectsLights) l.specialEffectsLights = mapSetArray(l.specialEffectsLights);
      if (l.softLights) l.softLights = mapSetArray(l.softLights);
      if (l.power) l.power = mapSetArray(l.power);
      if (l.gripModifiers) {
        const g = l.gripModifiers;
        if (g.flags) g.flags = mapSetArray(g.flags);
        if (g.diffusion) g.diffusion = mapSetArray(g.diffusion);
        if (g.reflectors) g.reflectors = mapSetArray(g.reflectors);
        if (g.colorGels) g.colorGels = mapSetArray(g.colorGels);
      }
    }

    // sound: microphones/recorders/wireless/monitoring
    if (clone.sound) {
      const s = clone.sound;
      if (s.microphones) s.microphones = mapSetArray(s.microphones);
      if (s.recorders) s.recorders = mapSetArray(s.recorders);
      if (s.wireless) s.wireless = mapSetArray(s.wireless);
      if (s.monitoring) s.monitoring = mapSetArray(s.monitoring);
    }

    // direction: monitors/communication/scriptBoards
    if (clone.direction) {
      const d = clone.direction;
      if (d.monitors) d.monitors = mapSetArray(d.monitors);
      if (d.communication) d.communication = mapSetArray(d.communication);
      if (d.scriptBoards) d.scriptBoards = mapSetArray(d.scriptBoards);
    }

    // production: scheduling/safety/transportation
    if (clone.production) {
      const p = clone.production;
      if (p.scheduling) p.scheduling = mapSetArray(p.scheduling);
      if (p.safety) p.safety = mapSetArray(p.safety);
      if (p.transportation) p.transportation = mapSetArray(p.transportation);
    }

    // art: setConstruction/props(characterProps,setProps)/setDressing/costumes/specialEffects
    if (clone.art) {
      const a = clone.art;
      if (a.setConstruction) a.setConstruction = mapSetArray(a.setConstruction);
      if (a.props) {
        if (a.props.characterProps) a.props.characterProps = mapSetArray(a.props.characterProps);
        if (a.props.setProps) a.props.setProps = mapSetArray(a.props.setProps);
      }
      if (a.setDressing) a.setDressing = mapSetArray(a.setDressing);
      if (a.costumes) a.costumes = mapSetArray(a.costumes);
      if (a.specialEffects) a.specialEffects = mapSetArray(a.specialEffects);
    }

    return clone;
  }

  // 인력 카탈로그 확장
  private async expandCrewCatalog(crew: any): Promise<any> {
    const crewCatalog = {
      "DIR_SET_A": {
        "name": "액션 감독",
        "description": "액션 씬 전문 감독",
        "experience": "10년 이상",
        "specialty": ["액션", "스턴트", "카 스턴트"],
        "rate": "일당 50만원"
      },
      "DIR_SET_B": {
        "name": "드라마 감독",
        "description": "감정선과 연기 지도 전문",
        "experience": "8년 이상",
        "specialty": ["연기 지도", "감정선", "캐릭터 개발"],
        "rate": "일당 45만원"
      },
      "DIR_SET_C": {
        "name": "코미디 감독",
        "description": "코미디 톤과 타이밍 전문",
        "experience": "6년 이상",
        "specialty": ["코미디", "타이밍", "리듬"],
        "rate": "일당 40만원"
      },
      "CIN_SET_A": {
        "name": "고품질 촬영감독",
        "description": "영화감 촬영 전문",
        "experience": "12년 이상",
        "specialty": ["영화감", "색감", "구도"],
        "rate": "일당 60만원"
      },
      "CIN_SET_B": {
        "name": "빠른 촬영감독",
        "description": "효율적 촬영 전문",
        "experience": "8년 이상",
        "specialty": ["빠른 촬영", "효율성", "스케줄링"],
        "rate": "일당 50만원"
      },
      "CIN_SET_C": {
        "name": "자연스러운 촬영감독",
        "description": "자연스러운 촬영 전문",
        "experience": "10년 이상",
        "specialty": ["자연스러운", "다큐멘터리", "리얼리즘"],
        "rate": "일당 55만원"
      },
      "LIGHT_DIR_A": {
        "name": "드라마틱 조명감독",
        "description": "드라마틱한 조명 전문",
        "experience": "10년 이상",
        "specialty": ["드라마틱", "분위기", "색감"],
        "rate": "일당 45만원"
      },
      "LIGHT_DIR_B": {
        "name": "자연스러운 조명감독",
        "description": "자연스러운 조명 전문",
        "experience": "8년 이상",
        "specialty": ["자연스러운", "부드러운", "리얼리즘"],
        "rate": "일당 40만원"
      },
      "LIGHT_DIR_C": {
        "name": "액션 조명감독",
        "description": "액션 씬 조명 전문",
        "experience": "6년 이상",
        "specialty": ["액션", "동적", "스턴트"],
        "rate": "일당 45만원"
      },
      "SOUND_DIR_A": {
        "name": "실내 음향감독",
        "description": "실내 음향 녹음 전문",
        "experience": "8년 이상",
        "specialty": ["실내", "대화", "명확한 음향"],
        "rate": "일당 40만원"
      },
      "SOUND_DIR_B": {
        "name": "야외 음향감독",
        "description": "야외 음향 녹음 전문",
        "experience": "10년 이상",
        "specialty": ["야외", "환경음", "노이즈 제거"],
        "rate": "일당 45만원"
      },
      "SOUND_DIR_C": {
        "name": "액션 음향감독",
        "description": "액션 씬 음향 전문",
        "experience": "6년 이상",
        "specialty": ["액션", "동적", "스턴트"],
        "rate": "일당 45만원"
      }
    };

    // in-place 확장: 기존 부서 구조 보존, 카탈로그 없으면 원문 유지
    const expandedCrew: any = JSON.parse(JSON.stringify(crew || {}));

    // 감독 확장
    if (expandedCrew.direction && expandedCrew.direction.director) {
      for (const director of expandedCrew.direction.director) {
        if (crewCatalog[director.role]) {
          Object.assign(director, { id: director.role, ...crewCatalog[director.role] });
        }
      }
    }

    // 촬영감독 확장
    if (expandedCrew.cinematography && expandedCrew.cinematography.cinematographer) {
      for (const cinematographer of expandedCrew.cinematography.cinematographer) {
        if (crewCatalog[cinematographer.role]) {
          Object.assign(cinematographer, { id: cinematographer.role, ...crewCatalog[cinematographer.role] });
        }
      }
    }

    // 조명감독 확장
    if (expandedCrew.lighting && expandedCrew.lighting.gaffer) {
      for (const gaffer of expandedCrew.lighting.gaffer) {
        if (crewCatalog[gaffer.role]) {
          Object.assign(gaffer, { id: gaffer.role, ...crewCatalog[gaffer.role] });
        }
      }
    }

    // 음향감독 확장
    if (expandedCrew.sound && expandedCrew.sound.soundMixer) {
      for (const soundMixer of expandedCrew.sound.soundMixer) {
        if (crewCatalog[soundMixer.role]) {
          Object.assign(soundMixer, { id: soundMixer.role, ...crewCatalog[soundMixer.role] });
        }
      }
    }

    // production 부서 확장 (존재 시)
    if (expandedCrew.production) {
      for (const key of Object.keys(expandedCrew.production)) {
        const arr = expandedCrew.production[key];
        if (Array.isArray(arr)) {
          for (const member of arr) {
            if (member?.role && crewCatalog[member.role]) {
              Object.assign(member, { id: member.role, ...crewCatalog[member.role] });
            }
          }
        }
      }
    }

    // art 부서 확장 (존재 시)
    if (expandedCrew.art) {
      for (const key of Object.keys(expandedCrew.art)) {
        const arr = expandedCrew.art[key];
        if (Array.isArray(arr)) {
          for (const member of arr) {
            if (member?.role && crewCatalog[member.role]) {
              Object.assign(member, { id: member.role, ...crewCatalog[member.role] });
            }
          }
        }
      }
    }

    return expandedCrew;
  }

  // 조명 카탈로그 확장 제거됨 (장비 카탈로그와 중복)
}