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
exports.SceneService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const scene_schema_1 = require("./schema/scene.schema");
const ai_service_1 = require("../ai/ai.service");
const project_service_1 = require("../project/project.service");
let SceneService = class SceneService {
    sceneModel;
    aiService;
    projectService;
    constructor(sceneModel, aiService, projectService) {
        this.sceneModel = sceneModel;
        this.aiService = aiService;
        this.projectService = projectService;
    }
    async create(projectId, createSceneDto) {
        const scene = new this.sceneModel({
            ...createSceneDto,
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        });
        const savedScene = await scene.save();
        return savedScene;
    }
    async findByProjectId(projectId) {
        if (!mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid project ID');
        }
        const scenes = await this.sceneModel.find({
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        })
            .sort({ order: 1 })
            .exec();
        return scenes;
    }
    async findById(projectId, sceneId) {
        if (!mongoose_2.Types.ObjectId.isValid(sceneId) || !mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid scene ID or project ID');
        }
        const scene = await this.sceneModel.findOne({
            _id: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }).exec();
        if (!scene) {
            throw new common_1.NotFoundException('Scene not found');
        }
        return scene;
    }
    async update(projectId, sceneId, updateSceneDto) {
        if (!mongoose_2.Types.ObjectId.isValid(sceneId) || !mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid scene ID or project ID');
        }
        const scene = await this.sceneModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }, {
            ...updateSceneDto,
        }, { new: true }).exec();
        if (!scene) {
            throw new common_1.NotFoundException('Scene not found');
        }
        return scene;
    }
    async delete(projectId, sceneId) {
        if (!mongoose_2.Types.ObjectId.isValid(sceneId) || !mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid scene ID or project ID');
        }
        const scene = await this.sceneModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: false
        }, {
            isDeleted: true,
        }, { new: true }).exec();
        if (!scene) {
            throw new common_1.NotFoundException('Scene not found');
        }
        return scene;
    }
    async restore(projectId, sceneId) {
        if (!mongoose_2.Types.ObjectId.isValid(sceneId) || !mongoose_2.Types.ObjectId.isValid(projectId)) {
            throw new common_1.BadRequestException('Invalid scene ID or project ID');
        }
        const scene = await this.sceneModel.findOneAndUpdate({
            _id: new mongoose_2.Types.ObjectId(sceneId),
            projectId: new mongoose_2.Types.ObjectId(projectId),
            isDeleted: true
        }, {
            isDeleted: false,
        }, { new: true }).exec();
        if (!scene) {
            throw new common_1.NotFoundException('Deleted scene not found');
        }
        return scene;
    }
    async createDraft(projectId, createSceneDraftRequestDto) {
        const project = await this.projectService.findById(projectId);
        const scenePrompt = await this.buildScenePrompt(createSceneDraftRequestDto.maxScenes, project);
        const result = await this.aiService.callChatCompletions([
            {
                role: 'system',
                content: '당신은 영화 캡션 카드 작가입니다. 상세하고 전문적인 캡션 카드를 작성해주세요.'
            },
            {
                role: 'user',
                content: scenePrompt
            }
        ], { max_tokens: 10000, temperature: 0.7 });
        const parsedScene = this.parseSceneDraftResponse(result);
        return parsedScene;
    }
    parseSceneDraftResponse(content) {
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
        try {
            const sceneList = JSON.parse(jsonContent);
            if (sceneList.scenes && Array.isArray(sceneList.scenes)) {
                const sceneData = sceneList.scenes.map((scene) => {
                    return {
                        ...scene,
                    };
                });
                return sceneData;
            }
            else {
                console.error(`sceneList: ${JSON.stringify(sceneList)}`);
                throw new Error('AI 응답을 파싱할 수 없습니다.');
            }
        }
        catch (error) {
            console.error('JSON 파싱 실패:', error);
            console.error('파싱 시도한 내용:', jsonContent);
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }
    }
    async buildScenePrompt(maxScenes, project) {
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
9. **timeOfDay**: 촬영 시간대 (enum: ['새벽', '아침', '오후', '저녁', '밤', '낮'])
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

**분류 기준:**
**"generated_video" (AI 생성 비디오)로 분류하는 경우:**
- 특수효과나 CG가 필요한 장면
- 환상적이거나 초자연적인 요소가 포함된 장면
- AI 시각효과가 포함된 장면
- 실제로 촬영하기 어려운 장면들
- 단순한 자연 풍경 장면

**"live_action" (실사 촬영)로 분류하는 경우:**
- 실제 배우의 연기가 중요한 장면
- 실제 소품과 물리적 상호작용이 필요한 장면
- 자연광이나 실제 조명 효과가 중요한 장면
- 특정 실제 장소에서 촬영이 필요한 장면
- 실제 감정 표현이나 인간적 상호작용이 중심인 장면

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
- AI 생성 비디오: -0.5분
- 최소 1분, 최대 8분으로 제한

**대사 생성 지침:**
- 각 장면의 예상 시간에 맞는 충분한 대사량을 생성해주세요
- 1분당 약 150-200자 정도의 대사가 적절합니다
- 대사는 자연스러운 대화 흐름을 따라야 합니다
- 내레이션, 음성 효과, 배경 음성도 포함해주세요
- 대사가 없는 장면도 있지만, 대부분의 장면에는 적절한 대사가 있어야 합니다

**시간대 구분:**
- **새벽**: 오전 3시 ~ 6시
- **아침**: 오전 6시 ~ 9시
- **오후**: 오전 9시 ~ 오후 6시
- **저녁**: 오후 6시 ~ 9시
- **밤**: 오후 9시 ~ 오전 3시
- **낮**: 해가 떠있는 시간대 (아침 + 오후)

**중요:**
- 반드시 timeOfDay(촬영 시간대)를 명확히 설정해야 합니다
- 이전 씬과의 연속성을 고려하여 자연스러운 흐름을 만들어주세요
- 각 필드의 길이 제한을 준수해주세요

input:
${JSON.stringify(project)}

반드시 다음 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:

  {
    "scenes": [
      {
        "order": 1,
        "title": "제목",
        "description": "설명",
        "dialogues": [
          {
            "character": "캐릭터",
            "text": "대사"
          }
        ],
        "weather": "날씨 묘사",
        "lighting": {
          "description": "조명 설명",
          "setup": {
            "keyLight": { "type": "키 라이트", "equipment": "조명 장비", "intensity": "조명 강도" },
            "fillLight": { "type": "필 라이트", "equipment": "조명 장비", "intensity": "조명 강도" },
            "backLight": { "type": "백 라이트", "equipment": "조명 장비", "intensity": "조명 강도" },
            "backgroundLight": { "type": "백그라운드 라이트", "equipment": "조명 장비", "intensity": "조명 강도" },
            "specialEffects": { "type": "스페셜 이펙트", "equipment": "조명 장비", "intensity": "조명 강도" },
            "softLight": { "type": "소프트 라이트", "equipment": "조명 장비", "intensity": "조명 강도" },
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
        "vfxRequired": true || false,
        "sfxRequired": true || false,
        "estimatedDuration": "예상 지속 시간",
        "location": {
          "address": "실제 장소 주소",
          "name": "address에 해당하는 실제 장소 이름",
          "group_name": "가까운 위치에 있는 Location의 집합 이름"
        },
        "timeOfDay": "촬영 시간대 (새벽, 아침, 오후, 저녁, 밤, 낮)",
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
      },
      ...
    ]
  }
`;
    }
};
exports.SceneService = SceneService;
exports.SceneService = SceneService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(scene_schema_1.Scene.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        ai_service_1.AiService,
        project_service_1.ProjectService])
], SceneService);
//# sourceMappingURL=scene.service.js.map