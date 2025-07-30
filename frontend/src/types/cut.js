/**
 * 컷 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 카메라 설정 타입
 * @typedef {Object} CameraSettings
 * @property {string} [aperture] - 조리개 값 (예: f/2.8)
 * @property {string} [shutterSpeed] - 셔터 스피드 (예: 1/60)
 * @property {string} [iso] - ISO 값 (예: 800)
 */
export const CameraSettings = {
  aperture: String,
  shutterSpeed: String,
  iso: String,
};

/**
 * 피사체 타입
 * @typedef {Object} Subject
 * @property {string} name - 피사체 이름
 * @property {string} type - 피사체 타입 (character, object, animal, background)
 * @property {string} [position] - 위치
 * @property {string} [action] - 행동/움직임
 * @property {string} [emotion] - 감정
 * @property {string} [description] - 설명
 */
export const Subject = {
  name: String,
  type: String, // 'character', 'object', 'animal', 'background'
  position: String,
  action: String,
  emotion: String,
  description: String,
};

/**
 * 특수 촬영 타입
 * @typedef {Object} SpecialCinematography
 * @property {boolean} [drone] - 드론 촬영 필요 여부
 * @property {boolean} [crane] - 크레인 촬영 필요 여부
 * @property {boolean} [jib] - 집 촬영 필요 여부
 * @property {boolean} [underwater] - 수중 촬영 필요 여부
 * @property {boolean} [aerial] - 공중 촬영 필요 여부
 */
export const SpecialCinematography = {
  drone: Boolean,
  crane: Boolean,
  jib: Boolean,
  underwater: Boolean,
  aerial: Boolean,
};

/**
 * 특수 효과 타입
 * @typedef {Object} SpecialEffects
 * @property {boolean} [vfx] - VFX 필요 여부
 * @property {boolean} [pyrotechnics] - 폭발 효과 필요 여부
 * @property {boolean} [smoke] - 연기 효과 필요 여부
 * @property {boolean} [fog] - 안개 효과 필요 여부
 * @property {boolean} [wind] - 바람 효과 필요 여부
 * @property {boolean} [rain] - 비 효과 필요 여부
 * @property {boolean} [snow] - 눈 효과 필요 여부
 * @property {boolean} [fire] - 불 효과 필요 여부
 * @property {boolean} [explosion] - 폭발 필요 여부
 * @property {boolean} [stunt] - 스턴트 필요 여부
 */
export const SpecialEffects = {
  vfx: Boolean,
  pyrotechnics: Boolean,
  smoke: Boolean,
  fog: Boolean,
  wind: Boolean,
  rain: Boolean,
  snow: Boolean,
  fire: Boolean,
  explosion: Boolean,
  stunt: Boolean,
};

/**
 * 특수 조명 타입
 * @typedef {Object} SpecialLighting
 * @property {boolean} [laser] - 레이저 조명 필요 여부
 * @property {boolean} [strobe] - 스트로브 조명 필요 여부
 * @property {boolean} [blackLight] - 블랙라이트 필요 여부
 * @property {boolean} [uvLight] - UV 라이트 필요 여부
 * @property {boolean} [movingLight] - 무빙라이트 필요 여부
 * @property {boolean} [colorChanger] - 컬러체인저 필요 여부
 */
export const SpecialLighting = {
  laser: Boolean,
  strobe: Boolean,
  blackLight: Boolean,
  uvLight: Boolean,
  movingLight: Boolean,
  colorChanger: Boolean,
};

/**
 * 안전 요구사항 타입
 * @typedef {Object} Safety
 * @property {boolean} [requiresMedic] - 의료진 필요 여부
 * @property {boolean} [requiresFireSafety] - 소방 안전 필요 여부
 * @property {boolean} [requiresSafetyOfficer] - 안전 담당관 필요 여부
 */
export const Safety = {
  requiresMedic: Boolean,
  requiresFireSafety: Boolean,
  requiresSafetyOfficer: Boolean,
};

/**
 * 특수 요구사항 타입
 * @typedef {Object} SpecialRequirements
 * @property {SpecialCinematography} [specialCinematography] - 특수 촬영 요구사항
 * @property {SpecialEffects} [specialEffects] - 특수 효과 요구사항
 * @property {SpecialLighting} [specialLighting] - 특수 조명 요구사항
 * @property {Safety} [safety] - 안전 요구사항
 */
export const SpecialRequirements = {
  specialCinematography: SpecialCinematography,
  specialEffects: SpecialEffects,
  specialLighting: SpecialLighting,
  safety: Safety,
};

/**
 * 카메라 설정 타입
 * @typedef {Object} CameraSetup
 * @property {string} [shotSize] - 샷 사이즈 (EWS, VWS, WS, FS, LS, MLS, MS, MCS, CU, MCU, BCU, ECU, TCU, OTS, POV, TS, GS, AS, PS, BS)
 * @property {string} [angleDirection] - 앵글 방향 (Eye-level, High, Low, Dutch, Bird_eye, Worm_eye, Canted, Oblique, Aerial, Ground, Overhead, Under, Side, Front, Back, Three_quarter, Profile, Reverse, POV, Subjective)
 * @property {string} [cameraMovement] - 카메라 움직임 (Static, Pan, Tilt, Dolly, Zoom, Handheld, Tracking, Crane, Steadicam, Gimbal, Drone, Jib, Slider, Dolly_zoom, Arc, Circle, Spiral, Vertigo, Whip_pan, Crash_zoom, Push_in, Pull_out, Follow, Lead, Reveal, Conceal, Parallax, Time_lapse, Slow_motion, Fast_motion, Bullet_time, Matrix_style, 360_degree, VR_style)
 * @property {string} [lensSpecs] - 렌즈 사양
 * @property {CameraSettings} [cameraSettings] - 카메라 설정
 */
export const CameraSetup = {
  shotSize: String,
  angleDirection: String,
  cameraMovement: String,
  lensSpecs: String,
  cameraSettings: CameraSettings,
};

/**
 * 컷 생성 요청 타입
 * @typedef {Object} CreateCutRequest
 * @property {string} sceneId - 씬 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {number} order - 순서
 * @property {string} [title] - 컷 제목
 * @property {string} [description] - 컷 설명
 * @property {CameraSetup} [cameraSetup] - 카메라 설정
 * @property {string} [vfxEffects] - VFX 효과
 * @property {string} [soundEffects] - 음향 효과
 * @property {string} [directorNotes] - 감독 노트
 * @property {string} [dialogue] - 대사
 * @property {string} [narration] - 내레이션
 * @property {Array<Subject>} [subjectMovement] - 피사체 움직임
 * @property {string} [productionMethod] - 제작 방법 (live_action, ai_generated)
 * @property {string} [productionMethodReason] - 제작 방법 선택 근거
 * @property {number} [estimatedDuration] - 예상 지속 시간 (초)
 * @property {SpecialRequirements} [specialRequirements] - 특수 요구사항
 * @property {string} [imageUrl] - 이미지 URL
 */
export const CreateCutRequest = {
  sceneId: String,
  projectId: String,
  order: Number,
  title: String,
  description: String,
  cameraSetup: CameraSetup,
  vfxEffects: String,
  soundEffects: String,
  directorNotes: String,
  dialogue: String,
  narration: String,
  subjectMovement: [Subject],
  productionMethod: String, // 'live_action', 'ai_generated'
  productionMethodReason: String,
  estimatedDuration: Number,
  specialRequirements: SpecialRequirements,
  imageUrl: String,
};

/**
 * 컷 수정 요청 타입
 * @typedef {Object} UpdateCutRequest
 * @property {string} [title] - 컷 제목
 * @property {string} [description] - 컷 설명
 * @property {CameraSetup} [cameraSetup] - 카메라 설정
 * @property {string} [vfxEffects] - VFX 효과
 * @property {string} [soundEffects] - 음향 효과
 * @property {string} [directorNotes] - 감독 노트
 * @property {string} [dialogue] - 대사
 * @property {string} [narration] - 내레이션
 * @property {Array<Subject>} [subjectMovement] - 피사체 움직임
 * @property {string} [productionMethod] - 제작 방법
 * @property {string} [productionMethodReason] - 제작 방법 선택 근거
 * @property {number} [estimatedDuration] - 예상 지속 시간 (초)
 * @property {SpecialRequirements} [specialRequirements] - 특수 요구사항
 * @property {string} [imageUrl] - 이미지 URL
 * @property {number} [order] - 순서
 */
export const UpdateCutRequest = {
  title: String,
  description: String,
  cameraSetup: CameraSetup,
  vfxEffects: String,
  soundEffects: String,
  directorNotes: String,
  dialogue: String,
  narration: String,
  subjectMovement: [Subject],
  productionMethod: String,
  productionMethodReason: String,
  estimatedDuration: Number,
  specialRequirements: SpecialRequirements,
  imageUrl: String,
  order: Number,
};

/**
 * 컷 초안 생성 요청 타입
 * @typedef {Object} CreateCutDraftRequest
 * @property {number} maxCuts - 최대 컷 수
 * @property {string} genre - 장르
 */
export const CreateCutDraftRequest = {
  maxCuts: Number,
  genre: String,
};

/**
 * 이미지 업로드 요청 타입
 * @typedef {Object} UploadImageRequest
 * @property {File} file - 이미지 파일
 */
export const UploadImageRequest = {
  file: File,
};

/**
 * 컷 응답 타입
 * @typedef {Object} CutResponse
 * @property {string} _id - 컷 ID
 * @property {string} sceneId - 씬 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {number} order - 순서
 * @property {string} title - 컷 제목
 * @property {string} description - 컷 설명
 * @property {CameraSetup} [cameraSetup] - 카메라 설정
 * @property {string} [vfxEffects] - VFX 효과
 * @property {string} [soundEffects] - 음향 효과
 * @property {string} [directorNotes] - 감독 노트
 * @property {string} [dialogue] - 대사
 * @property {string} [narration] - 내레이션
 * @property {Array<Subject>} [subjectMovement] - 피사체 움직임
 * @property {string} [productionMethod] - 제작 방법
 * @property {string} [productionMethodReason] - 제작 방법 선택 근거
 * @property {number} [estimatedDuration] - 예상 지속 시간 (초)
 * @property {SpecialRequirements} [specialRequirements] - 특수 요구사항
 * @property {string} [imageUrl] - 이미지 URL
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const CutResponse = {
  _id: String,
  sceneId: String,
  projectId: String,
  order: Number,
  title: String,
  description: String,
  cameraSetup: CameraSetup,
  vfxEffects: String,
  soundEffects: String,
  directorNotes: String,
  dialogue: String,
  narration: String,
  subjectMovement: [Subject],
  productionMethod: String,
  productionMethodReason: String,
  estimatedDuration: Number,
  specialRequirements: SpecialRequirements,
  imageUrl: String,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * 컷 목록 응답 타입
 * @typedef {Object} CutListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<CutResponse>} data - 컷 목록
 * @property {string} message - 응답 메시지
 */
export const CutListResponse = {
  success: Boolean,
  data: [CutResponse],
  message: String,
};

/**
 * 컷 상세 응답 타입
 * @typedef {Object} CutDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {CutResponse} data - 컷 상세 정보
 * @property {string} message - 응답 메시지
 */
export const CutDetailResponse = {
  success: Boolean,
  data: CutResponse,
  message: String,
};

/**
 * 이미지 생성 응답 타입
 * @typedef {Object} ImageGenerationResponse
 * @property {boolean} success - 성공 여부
 * @property {string} data - 생성된 이미지 URL
 * @property {string} message - 응답 메시지
 */
export const ImageGenerationResponse = {
  success: Boolean,
  data: String,
  message: String,
};

// 기본 컷 객체 생성 함수
export const createDefaultCut = () => ({
  _id: '',
  sceneId: '',
  projectId: '',
  order: 1,
  title: '',
  description: '',
  cameraSetup: {
    shotSize: '',
    angleDirection: '',
    cameraMovement: '',
    lensSpecs: '',
    cameraSettings: {
      aperture: '',
      shutterSpeed: '',
      iso: '',
    },
  },
  vfxEffects: '',
  soundEffects: '',
  directorNotes: '',
  dialogue: '',
  narration: '',
  subjectMovement: [],
  productionMethod: 'live_action',
  productionMethodReason: '',
  estimatedDuration: 0,
  specialRequirements: {
    specialCinematography: {
      drone: false,
      crane: false,
      jib: false,
      underwater: false,
      aerial: false,
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
      stunt: false,
    },
    specialLighting: {
      laser: false,
      strobe: false,
      blackLight: false,
      uvLight: false,
      movingLight: false,
      colorChanger: false,
    },
    safety: {
      requiresMedic: false,
      requiresFireSafety: false,
      requiresSafetyOfficer: false,
    },
  },
  imageUrl: '',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 컷 유효성 검사 함수
export const validateCut = (cut) => {
  const errors = [];
  
  if (!cut.sceneId || cut.sceneId.trim() === '') {
    errors.push('씬 ID는 필수입니다.');
  }
  
  if (!cut.projectId || cut.projectId.trim() === '') {
    errors.push('프로젝트 ID는 필수입니다.');
  }
  
  if (!cut.order || cut.order < 1) {
    errors.push('순서는 1 이상이어야 합니다.');
  }
  
  if (!cut.title || cut.title.trim() === '') {
    errors.push('컷 제목은 필수입니다.');
  }
  
  if (!cut.description || cut.description.trim() === '') {
    errors.push('컷 설명은 필수입니다.');
  }
  
  return errors;
};

// 컷 정렬 함수
export const sortCuts = (cuts, sortBy = 'order', order = 'asc') => {
  return [...cuts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'order') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

// 컷 필터링 함수
export const filterCuts = (cuts, filters) => {
  return cuts.filter(cut => {
    // 제목 필터
    if (filters.title && !cut.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false;
    }
    
    // 설명 필터
    if (filters.description && !cut.description.toLowerCase().includes(filters.description.toLowerCase())) {
      return false;
    }
    
    // 제작 방법 필터
    if (filters.productionMethod && cut.productionMethod !== filters.productionMethod) {
      return false;
    }
    
    // 샷 사이즈 필터
    if (filters.shotSize && cut.cameraSetup?.shotSize !== filters.shotSize) {
      return false;
    }
    
    return true;
  });
};

export default {
  CameraSettings,
  Subject,
  SpecialCinematography,
  SpecialEffects,
  SpecialLighting,
  Safety,
  SpecialRequirements,
  CameraSetup,
  CreateCutRequest,
  UpdateCutRequest,
  CreateCutDraftRequest,
  UploadImageRequest,
  CutResponse,
  CutListResponse,
  CutDetailResponse,
  ImageGenerationResponse,
  createDefaultCut,
  validateCut,
  sortCuts,
  filterCuts,
};
