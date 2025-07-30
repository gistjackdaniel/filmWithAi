/**
 * 씬 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 대화 타입
 * @typedef {Object} Dialogue
 * @property {string} [character] - 대화하는 캐릭터 이름
 * @property {string} [text] - 대화 내용
 */
export const Dialogue = {
  character: String,
  text: String,
}

/**
 * 조명 설정 타입
 * @typedef {Object} LightSetup
 * @property {string} [type] - 조명 타입
 * @property {string} [equipment] - 조명 장비
 * @property {string} [intensity] - 조명 강도
 */
export const LightSetup = {
  type: String,
  equipment: String,
  intensity: String,
}

/**
 * 그립 모디파이어 타입
 * @typedef {Object} GripModifier
 * @property {Array<string>} [flags] - 플래그 목록
 * @property {Array<string>} [diffusion] - 디퓨전 목록
 * @property {Array<string>} [reflectors] - 리플렉터 목록
 * @property {Array<string>} [colorGels] - 컬러 젤 목록
 */
export const GripModifier = {
  flags: [String],
  diffusion: [String],
  reflectors: [String],
  colorGels: [String],
}

/**
 * 조명 전체 설정 타입
 * @typedef {Object} LightOverall
 * @property {string} [colorTemperature] - 색온도
 * @property {string} [mood] - 분위기
 */
export const LightOverall = {
  colorTemperature: String,
  mood: String,
}

/**
 * 조명 설정 타입
 * @typedef {Object} LightingSetup
 * @property {LightSetup} [keyLight] - 키 라이트
 * @property {LightSetup} [fillLight] - 필 라이트
 * @property {LightSetup} [backLight] - 백 라이트
 * @property {LightSetup} [backgroundLight] - 배경 라이트
 * @property {LightSetup} [specialEffects] - 특수 효과 라이트
 * @property {LightSetup} [softLight] - 소프트 라이트
 * @property {GripModifier} [gripModifier] - 그립 모디파이어
 * @property {LightOverall} [overall] - 전체 조명 설정
 */
export const LightingSetup = {
  keyLight: LightSetup,
  fillLight: LightSetup,
  backLight: LightSetup,
  backgroundLight: LightSetup,
  specialEffects: LightSetup,
  softLight: LightSetup,
  gripModifier: GripModifier,
  overall: LightOverall,
}

/**
 * 조명 타입
 * @typedef {Object} Lighting
 * @property {string} [description] - 조명 설명
 * @property {LightingSetup} [setup] - 조명 설정
 */
export const Lighting = {
  description: String,
  setup: LightingSetup,
}

/**
 * 실제 위치 타입
 * @typedef {Object} RealLocation
 * @property {string} [name] - 위치 이름
 * @property {string} [address] - 실제 주소
 * @property {string} [group_name] - 위치 그룹명
 */
export const RealLocation = {
  name: String,
  address: String,
  group_name: String,
}

/**
 * 인력 멤버 타입
 * @typedef {Object} CrewMember
 * @property {string} role - 역할
 * @property {string} [contact] - 연락처
 * @property {string} [profileId] - 프로필 ID
 */
export const CrewMember = {
  role: String,
  contact: String,
  profileId: String,
}

/**
 * 인력 역할 타입
 * @typedef {Object} Direction
 * @property {Array<CrewMember>} [director] - 감독
 * @property {Array<CrewMember>} [assistantDirector] - 조감독
 * @property {Array<CrewMember>} [scriptSupervisor] - 스크립트 슈퍼바이저
 * @property {Array<CrewMember>} [continuity] - 컨티뉴이티
 */
export const Direction = {
  director: [CrewMember],
  assistantDirector: [CrewMember],
  scriptSupervisor: [CrewMember],
  continuity: [CrewMember],
}

/**
 * 제작팀 타입
 * @typedef {Object} Production
 * @property {Array<CrewMember>} [producer] - 프로듀서
 * @property {Array<CrewMember>} [lineProducer] - 라인 프로듀서
 * @property {Array<CrewMember>} [productionManager] - 프로덕션 매니저
 * @property {Array<CrewMember>} [productionAssistant] - 프로덕션 어시스턴트
 */
export const Production = {
  producer: [CrewMember],
  lineProducer: [CrewMember],
  productionManager: [CrewMember],
  productionAssistant: [CrewMember],
}

/**
 * 촬영팀 타입
 * @typedef {Object} Cinematography
 * @property {Array<CrewMember>} [cinematographer] - 촬영감독
 * @property {Array<CrewMember>} [cameraOperator] - 카메라 오퍼레이터
 * @property {Array<CrewMember>} [firstAssistant] - 퍼스트 어시스턴트
 * @property {Array<CrewMember>} [secondAssistant] - 세컨드 어시스턴트
 * @property {Array<CrewMember>} [dollyGrip] - 돌리 그립
 */
export const Cinematography = {
  cinematographer: [CrewMember],
  cameraOperator: [CrewMember],
  firstAssistant: [CrewMember],
  secondAssistant: [CrewMember],
  dollyGrip: [CrewMember],
}

/**
 * 조명팀 타입
 * @typedef {Object} LightingCrew
 * @property {Array<CrewMember>} [gaffer] - 개퍼
 * @property {Array<CrewMember>} [bestBoy] - 베스트 보이
 * @property {Array<CrewMember>} [electrician] - 일렉트리션
 * @property {Array<CrewMember>} [generatorOperator] - 제너레이터 오퍼레이터
 */
export const LightingCrew = {
  gaffer: [CrewMember],
  bestBoy: [CrewMember],
  electrician: [CrewMember],
  generatorOperator: [CrewMember],
}

/**
 * 음향팀 타입
 * @typedef {Object} Sound
 * @property {Array<CrewMember>} [soundMixer] - 사운드 믹서
 * @property {Array<CrewMember>} [boomOperator] - 붐 오퍼레이터
 * @property {Array<CrewMember>} [soundAssistant] - 사운드 어시스턴트
 * @property {Array<CrewMember>} [utility] - 유틸리티
 */
export const Sound = {
  soundMixer: [CrewMember],
  boomOperator: [CrewMember],
  soundAssistant: [CrewMember],
  utility: [CrewMember],
}

/**
 * 미술팀 타입
 * @typedef {Object} Art
 * @property {Array<CrewMember>} [productionDesigner] - 프로덕션 디자이너
 * @property {Array<CrewMember>} [artDirector] - 아트 디렉터
 * @property {Array<CrewMember>} [setDecorator] - 세트 데코레이터
 * @property {Array<CrewMember>} [propMaster] - 소품 마스터
 * @property {Array<CrewMember>} [makeupArtist] - 메이크업 아티스트
 * @property {Array<CrewMember>} [costumeDesigner] - 코스튬 디자이너
 * @property {Array<CrewMember>} [hairStylist] - 헤어 스타일리스트
 */
export const Art = {
  productionDesigner: [CrewMember],
  artDirector: [CrewMember],
  setDecorator: [CrewMember],
  propMaster: [CrewMember],
  makeupArtist: [CrewMember],
  costumeDesigner: [CrewMember],
  hairStylist: [CrewMember],
}

/**
 * 인력 구성 타입
 * @typedef {Object} Crew
 * @property {Direction} [direction] - 연출팀
 * @property {Production} [production] - 제작팀
 * @property {Cinematography} [cinematography] - 촬영팀
 * @property {LightingCrew} [lighting] - 조명팀
 * @property {Sound} [sound] - 음향팀
 * @property {Art} [art] - 미술팀
 */
export const Crew = {
  direction: Direction,
  production: Production,
  cinematography: Cinematography,
  lighting: LightingCrew,
  sound: Sound,
  art: Art,
}

/**
 * 연출 장비 타입
 * @typedef {Object} DirectionEquipment
 * @property {Array<string>} [monitors] - 모니터
 * @property {Array<string>} [communication] - 통신장비
 * @property {Array<string>} [scriptBoards] - 스크립트 보드
 */
export const DirectionEquipment = {
  monitors: [String],
  communication: [String],
  scriptBoards: [String],
}

/**
 * 제작 장비 타입
 * @typedef {Object} ProductionEquipment
 * @property {Array<string>} [scheduling] - 스케줄링
 * @property {Array<string>} [safety] - 안전장비
 * @property {Array<string>} [transportation] - 운송장비
 */
export const ProductionEquipment = {
  scheduling: [String],
  safety: [String],
  transportation: [String],
}

/**
 * 촬영 장비 타입
 * @typedef {Object} CinematographyEquipment
 * @property {Array<string>} [cameras] - 카메라
 * @property {Array<string>} [lenses] - 렌즈
 * @property {Array<string>} [supports] - 지지대
 * @property {Array<string>} [filters] - 필터
 * @property {Array<string>} [accessories] - 액세서리
 */
export const CinematographyEquipment = {
  cameras: [String],
  lenses: [String],
  supports: [String],
  filters: [String],
  accessories: [String],
}

/**
 * 조명 장비 타입
 * @typedef {Object} LightingEquipment
 * @property {Array<string>} [keyLights] - 키 라이트
 * @property {Array<string>} [fillLights] - 필 라이트
 * @property {Array<string>} [backLights] - 백 라이트
 * @property {Array<string>} [backgroundLights] - 배경 라이트
 * @property {Array<string>} [specialEffectsLights] - 특수 효과 라이트
 * @property {Array<string>} [softLights] - 소프트 라이트
 * @property {GripModifier} [gripModifiers] - 그립 모디파이어
 * @property {Array<string>} [power] - 전원장비
 */
export const LightingEquipment = {
  keyLights: [String],
  fillLights: [String],
  backLights: [String],
  backgroundLights: [String],
  specialEffectsLights: [String],
  softLights: [String],
  gripModifiers: GripModifier,
  power: [String],
}

/**
 * 음향 장비 타입
 * @typedef {Object} SoundEquipment
 * @property {Array<string>} [microphones] - 마이크
 * @property {Array<string>} [recorders] - 레코더
 * @property {Array<string>} [wireless] - 무선장비
 * @property {Array<string>} [monitoring] - 모니터링
 */
export const SoundEquipment = {
  microphones: [String],
  recorders: [String],
  wireless: [String],
  monitoring: [String],
}

/**
 * 미술 소품 타입
 * @typedef {Object} ArtProps
 * @property {Array<string>} [characterProps] - 캐릭터 소품
 * @property {Array<string>} [setProps] - 세트 소품
 */
export const ArtProps = {
  characterProps: [String],
  setProps: [String],
}

/**
 * 미술 장비 타입
 * @typedef {Object} ArtEquipment
 * @property {Array<string>} [setConstruction] - 세트 제작
 * @property {ArtProps} [props] - 소품
 * @property {Array<string>} [setDressing] - 세트 드레싱
 * @property {Array<string>} [costumes] - 의상
 * @property {Array<string>} [specialEffects] - 특수 효과
 */
export const ArtEquipment = {
  setConstruction: [String],
  props: ArtProps,
  setDressing: [String],
  costumes: [String],
  specialEffects: [String],
}

/**
 * 장비 구성 타입
 * @typedef {Object} Equipment
 * @property {DirectionEquipment} [direction] - 연출 장비
 * @property {ProductionEquipment} [production] - 제작 장비
 * @property {CinematographyEquipment} [cinematography] - 촬영 장비
 * @property {LightingEquipment} [lighting] - 조명 장비
 * @property {SoundEquipment} [sound] - 음향 장비
 * @property {ArtEquipment} [art] - 미술 장비
 */
export const Equipment = {
  direction: DirectionEquipment,
  production: ProductionEquipment,
  cinematography: CinematographyEquipment,
  lighting: LightingEquipment,
  sound: SoundEquipment,
  art: ArtEquipment,
}

/**
 * 출연진 멤버 타입
 * @typedef {Object} CastMember
 * @property {string} role - 역할
 * @property {string} name - 이름
 * @property {string} [profileId] - 프로필 ID
 */
export const CastMember = {
  role: String,
  name: String,
  profileId: String,
}

/**
 * 추가 인원 타입
 * @typedef {Object} ExtraMember
 * @property {string} role - 역할
 * @property {number} number - 인원 수
 */
export const ExtraMember = {
  role: String,
  number: Number,
}

/**
 * 씬 생성 요청 타입
 * @typedef {Object} CreateSceneRequest
 * @property {string} title - 씬 제목
 * @property {string} description - 씬 설명
 * @property {Array<Dialogue>} dialogues - 씬 대사
 * @property {string} weather - 씬 날씨
 * @property {Lighting} lighting - 씬 조명
 * @property {string} visualDescription - 씬 시각 설명
 * @property {string} scenePlace - 씬 장소
 * @property {string} sceneDateTime - 씬 시간
 * @property {boolean} vfxRequired - VFX 필요 여부
 * @property {boolean} sfxRequired - SFX 필요 여부
 * @property {string} estimatedDuration - 예상 지속 시간
 * @property {RealLocation} location - 씬 위치
 * @property {string} timeOfDay - 씬 시간대
 * @property {Crew} crew - 인력 구성
 * @property {Equipment} equipment - 장비 구성
 * @property {Array<CastMember>} cast - 출연진
 * @property {Array<ExtraMember>} extra - 추가 인원
 * @property {Array<string>} specialRequirements - 특별 요구사항
 * @property {number} order - 순서
 */
export const CreateSceneRequest = {
  title: String,
  description: String,
  dialogues: [Dialogue],
  weather: String,
  lighting: Lighting,
  visualDescription: String,
  scenePlace: String,
  sceneDateTime: String,
  vfxRequired: Boolean,
  sfxRequired: Boolean,
  estimatedDuration: String,
  location: RealLocation,
  timeOfDay: String,
  crew: Crew,
  equipment: Equipment,
  cast: [CastMember],
  extra: [ExtraMember],
  specialRequirements: [String],
  order: Number,
}

/**
 * 씬 수정 요청 타입
 * @typedef {Object} UpdateSceneRequest
 * @property {string} [title] - 씬 제목
 * @property {string} [description] - 씬 설명
 * @property {Array<Dialogue>} [dialogues] - 씬 대사
 * @property {string} [weather] - 씬 날씨
 * @property {Lighting} [lighting] - 씬 조명
 * @property {string} [visualDescription] - 씬 시각 설명
 * @property {string} [scenePlace] - 씬 장소
 * @property {string} [sceneDateTime] - 씬 시간
 * @property {boolean} [vfxRequired] - VFX 필요 여부
 * @property {boolean} [sfxRequired] - SFX 필요 여부
 * @property {string} [estimatedDuration] - 예상 지속 시간
 * @property {RealLocation} [location] - 씬 위치
 * @property {string} [timeOfDay] - 씬 시간대
 * @property {Crew} [crew] - 인력 구성
 * @property {Equipment} [equipment] - 장비 구성
 * @property {Array<CastMember>} [cast] - 출연진
 * @property {Array<ExtraMember>} [extra] - 추가 인원
 * @property {Array<string>} [specialRequirements] - 특별 요구사항
 * @property {number} [order] - 순서
 */
export const UpdateSceneRequest = {
  title: String,
  description: String,
  dialogues: [Dialogue],
  weather: String,
  lighting: Lighting,
  visualDescription: String,
  scenePlace: String,
  sceneDateTime: String,
  vfxRequired: Boolean,
  sfxRequired: Boolean,
  estimatedDuration: String,
  location: RealLocation,
  timeOfDay: String,
  crew: Crew,
  equipment: Equipment,
  cast: [CastMember],
  extra: [ExtraMember],
  specialRequirements: [String],
  order: Number,
}

/**
 * 씬 초안 생성 요청 타입
 * @typedef {Object} CreateSceneDraftRequest
 * @property {number} maxScenes - 생성할 씬 개수
 */
export const CreateSceneDraftRequest = {
  maxScenes: Number,
}

/**
 * 씬 응답 타입
 * @typedef {Object} SceneResponse
 * @property {string} _id - 씬 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {string} title - 씬 제목
 * @property {string} description - 씬 설명
 * @property {Array<Dialogue>} dialogues - 대화 목록
 * @property {string} weather - 날씨
 * @property {Lighting} lighting - 조명 설정
 * @property {string} visualDescription - 시각적 설명
 * @property {string} sceneDateTime - 씬 시간
 * @property {boolean} vfxRequired - VFX 필요 여부
 * @property {boolean} sfxRequired - SFX 필요 여부
 * @property {string} estimatedDuration - 예상 지속 시간
 * @property {string} scenePlace - 씬 위치
 * @property {RealLocation} location - 실제 위치
 * @property {string} timeOfDay - 씬 시간대
 * @property {Crew} crew - 인력 구성
 * @property {Equipment} equipment - 장비 구성
 * @property {Array<CastMember>} cast - 출연진
 * @property {Array<ExtraMember>} extra - 추가 인원
 * @property {Array<string>} specialRequirements - 특별 요구사항
 * @property {number} order - 순서
 * @property {boolean} isDeleted - 삭제 여부
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const SceneResponse = {
  _id: String,
  projectId: String,
  title: String,
  description: String,
  dialogues: [Dialogue],
  weather: String,
  lighting: Lighting,
  visualDescription: String,
  sceneDateTime: String,
  vfxRequired: Boolean,
  sfxRequired: Boolean,
  estimatedDuration: String,
  scenePlace: String,
  location: RealLocation,
  timeOfDay: String,
  crew: Crew,
  equipment: Equipment,
  cast: [CastMember],
  extra: [ExtraMember],
  specialRequirements: [String],
  order: Number,
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date,
}

/**
 * 씬 목록 응답 타입
 * @typedef {Object} SceneListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<SceneResponse>} data - 씬 목록
 * @property {string} message - 응답 메시지
 */
export const SceneListResponse = {
  success: Boolean,
  data: [SceneResponse],
  message: String,
}

/**
 * 씬 상세 응답 타입
 * @typedef {Object} SceneDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {SceneResponse} data - 씬 상세 정보
 * @property {string} message - 응답 메시지
 */
export const SceneDetailResponse = {
  success: Boolean,
  data: SceneResponse,
  message: String,
}

// 기본 씬 객체 생성 함수
export const createDefaultScene = () => ({
  _id: '',
  projectId: '',
  title: '',
  description: '',
  dialogues: [],
  weather: '',
  lighting: {
    description: '',
    setup: {
      keyLight: { type: '', equipment: '', intensity: '' },
      fillLight: { type: '', equipment: '', intensity: '' },
      backLight: { type: '', equipment: '', intensity: '' },
      backgroundLight: { type: '', equipment: '', intensity: '' },
      specialEffects: { type: '', equipment: '', intensity: '' },
      softLight: { type: '', equipment: '', intensity: '' },
      gripModifier: {
        flags: [],
        diffusion: [],
        reflectors: [],
        colorGels: [],
      },
      overall: {
        colorTemperature: '',
        mood: '',
      },
    },
  },
  visualDescription: '',
  sceneDateTime: '',
  vfxRequired: false,
  sfxRequired: false,
  estimatedDuration: '',
  scenePlace: '',
  location: {
    name: '',
    address: '',
    group_name: '',
  },
  timeOfDay: '오후',
  crew: {
    direction: {
      director: [],
      assistantDirector: [],
      scriptSupervisor: [],
      continuity: [],
    },
    production: {
      producer: [],
      lineProducer: [],
      productionManager: [],
      productionAssistant: [],
    },
    cinematography: {
      cinematographer: [],
      cameraOperator: [],
      firstAssistant: [],
      secondAssistant: [],
      dollyGrip: [],
    },
    lighting: {
      gaffer: [],
      bestBoy: [],
      electrician: [],
      generatorOperator: [],
    },
    sound: {
      soundMixer: [],
      boomOperator: [],
      soundAssistant: [],
      utility: [],
    },
    art: {
      productionDesigner: [],
      artDirector: [],
      setDecorator: [],
      propMaster: [],
      makeupArtist: [],
      costumeDesigner: [],
      hairStylist: [],
    },
  },
  equipment: {
    direction: {
      monitors: [],
      communication: [],
      scriptBoards: [],
    },
    production: {
      scheduling: [],
      safety: [],
      transportation: [],
    },
    cinematography: {
      cameras: [],
      lenses: [],
      supports: [],
      filters: [],
      accessories: [],
    },
    lighting: {
      keyLights: [],
      fillLights: [],
      backLights: [],
      backgroundLights: [],
      specialEffectsLights: [],
      softLights: [],
      gripModifiers: {
        flags: [],
        diffusion: [],
        reflectors: [],
        colorGels: [],
      },
      power: [],
    },
    sound: {
      microphones: [],
      recorders: [],
      wireless: [],
      monitoring: [],
    },
    art: {
      setConstruction: [],
      props: {
        characterProps: [],
        setProps: [],
      },
      setDressing: [],
      costumes: [],
      specialEffects: [],
    },
  },
  cast: [],
  extra: [],
  specialRequirements: [],
  order: 1,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// 씬 유효성 검사 함수
export const validateScene = (scene) => {
  const errors = []
  
  if (!scene.title || scene.title.trim() === '') {
    errors.push('씬 제목은 필수입니다.')
  }
  
  if (!scene.description || scene.description.trim() === '') {
    errors.push('씬 설명은 필수입니다.')
  }
  
  if (!scene.dialogues || scene.dialogues.length === 0) {
    errors.push('씬 대사는 최소 하나 이상 필요합니다.')
  }
  
  if (!scene.weather || scene.weather.trim() === '') {
    errors.push('씬 날씨는 필수입니다.')
  }
  
  if (!scene.visualDescription || scene.visualDescription.trim() === '') {
    errors.push('씬 시각 설명은 필수입니다.')
  }
  
  if (!scene.scenePlace || scene.scenePlace.trim() === '') {
    errors.push('씬 장소는 필수입니다.')
  }
  
  if (!scene.sceneDateTime || scene.sceneDateTime.trim() === '') {
    errors.push('씬 시간은 필수입니다.')
  }
  
  if (!scene.estimatedDuration || scene.estimatedDuration.trim() === '') {
    errors.push('예상 지속 시간은 필수입니다.')
  }
  
  if (!scene.timeOfDay || scene.timeOfDay.trim() === '') {
    errors.push('씬 시간대는 필수입니다.')
  }
  
  if (!scene.order || scene.order < 1) {
    errors.push('순서는 1 이상이어야 합니다.')
  }
  
  return errors
}

// 씬 정렬 함수
export const sortScenes = (scenes, sortBy = 'order', order = 'asc') => {
  return [...scenes].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'order') {
      aValue = parseInt(aValue) || 0
      bValue = parseInt(bValue) || 0
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// 씬 필터링 함수
export const filterScenes = (scenes, filters) => {
  return scenes.filter(scene => {
    // 제목 필터
    if (filters.title && !scene.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false
    }
    
    // 설명 필터
    if (filters.description && !scene.description.toLowerCase().includes(filters.description.toLowerCase())) {
      return false
    }
    
    // 날씨 필터
    if (filters.weather && scene.weather !== filters.weather) {
      return false
    }
    
    // 시간대 필터
    if (filters.timeOfDay && scene.timeOfDay !== filters.timeOfDay) {
      return false
    }
    
    // VFX/SFX 필터
    if (filters.vfxRequired !== undefined && scene.vfxRequired !== filters.vfxRequired) {
      return false
    }
    
    if (filters.sfxRequired !== undefined && scene.sfxRequired !== filters.sfxRequired) {
      return false
    }
    
    // 순서 필터
    if (filters.minOrder && scene.order < filters.minOrder) {
      return false
    }
    
    if (filters.maxOrder && scene.order > filters.maxOrder) {
      return false
    }
    
    return true
  })
}

export default {
  Dialogue,
  LightSetup,
  GripModifier,
  LightOverall,
  LightingSetup,
  Lighting,
  RealLocation,
  CrewMember,
  Direction,
  Production,
  Cinematography,
  LightingCrew,
  Sound,
  Art,
  Crew,
  DirectionEquipment,
  ProductionEquipment,
  CinematographyEquipment,
  LightingEquipment,
  SoundEquipment,
  ArtProps,
  ArtEquipment,
  Equipment,
  CastMember,
  ExtraMember,
  CreateSceneRequest,
  UpdateSceneRequest,
  CreateSceneDraftRequest,
  SceneResponse,
  SceneListResponse,
  SceneDetailResponse,
  createDefaultScene,
  validateScene,
  sortScenes,
  filterScenes,
} 