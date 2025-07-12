/**
 * SceneForge 타임라인 관련 타입 정의
 * 캡션카드와 타임라인 데이터 구조를 정의
 */

/**
 * 캡션카드 노드 타입 - 그래프 구조의 기본 단위
 */
export const NodeType = {
  USER: 'user',           // 사용자 정보
  LOCATION: 'location',   // 촬영 장소
  DATE: 'date',          // 촬영 날짜
  EQUIPMENT: 'equipment', // 장비 정보
  CHARACTER: 'character', // 등장인물
  PROPS: 'props',        // 소품
  WEATHER: 'weather',    // 날씨
  LIGHTING: 'lighting',  // 조명
  CAMERA: 'camera',      // 카메라 설정
  EFFECTS: 'effects',    // 시각효과
}

/**
 * 캡션카드 타입 - AI 생성 vs 실사 촬영
 */
export const CaptionCardType = {
  GENERATED_VIDEO: 'generated_video', // AI 생성 비디오
  LIVE_ACTION: 'live_action',         // 실사 촬영용
}

/**
 * 캡션카드 노드 인터페이스
 */
export const CaptionCardNode = {
  id: String,           // 노드 고유 ID
  type: NodeType,       // 노드 타입
  value: String,        // 노드 값
  metadata: Object,     // 추가 메타데이터
  relationships: Array, // 다른 노드와의 관계
}

/**
 * 캡션카드 구성요소 인터페이스
 */
export const CaptionCardComponents = {
  // 기본 정보
  sceneNumber: Number,        // 씬 번호
  description: String,        // 인물들이 처한 상황에 대한 대략적인 설명
  dialogue: String,          // 해당 장면을 대표하는 대사
  
  // 시각적 요소
  cameraAngle: String,       // 카메라/그림 앵글과 구도 설명
  cameraWork: String,        // 카메라 워크 및 장면 전환 화살표
  characterLayout: String,   // 인물 배치도와 동선 화살표
  propsLayout: String,       // 소품 배치
  
  // 환경 요소
  weather: String,           // 날씨와 지형
  lighting: String,          // 조명
  representativeImage: String, // 대표적인 그림 설명
  
  // 촬영 정보
  transitionPoint: String,   // 장면, 시퀀스의 전환점
  lensLength: String,        // 렌즈 길이
  cameraSpecs: String,       // 요구되는 카메라의 특성
  shootingMethod: String,    // 촬영 방식
  
  // 후처리 정보
  graphicsTools: String,     // 사용할 그래픽 툴
  visualEffects: String,     // 넣어야하는 시각효과
}

/**
 * 캡션카드 인터페이스
 */
export const CaptionCard = {
  id: String,                    // 캡션카드 고유 ID
  type: CaptionCardType,         // 타입 (AI 생성 / 실사 촬영)
  components: CaptionCardComponents, // 구성요소
  nodes: [CaptionCardNode],      // 노드 배열 (그래프 구조)
  position: {                    // 타임라인에서의 위치
    x: Number,
    y: Number,
  },
  duration: Number,              // 장면 지속 시간 (초)
  startTime: Number,             // 시작 시간 (초) - 시간 기반 타임라인용
  endTime: Number,               // 끝 시간 (초) - 시간 기반 타임라인용
  createdAt: Date,              // 생성일
  updatedAt: Date,              // 수정일
}

/**
 * 타임라인 인터페이스
 */
export const Timeline = {
  id: String,                    // 타임라인 고유 ID
  projectId: String,             // 프로젝트 ID
  captionCards: [CaptionCard],   // 캡션카드 배열
  totalDuration: Number,         // 총 지속 시간
  createdAt: Date,               // 생성일
  updatedAt: Date,               // 수정일
}

/**
 * 타임라인 필터 옵션
 */
export const TimelineFilter = {
  type: CaptionCardType,         // 타입별 필터
  dateRange: {                   // 날짜 범위
    start: Date,
    end: Date,
  },
  timeRange: {                   // 시간 범위 필터 (시간 기반 타임라인용)
    start: Number,               // 시작 시간 (초)
    end: Number,                 // 끝 시간 (초)
  },
  location: String,              // 장소별 필터
  character: String,             // 등장인물별 필터
  equipment: String,             // 장비별 필터
  duration: {                    // 지속 시간 필터
    min: Number,                 // 최소 지속 시간 (초)
    max: Number,                 // 최대 지속 시간 (초)
  }
}

/**
 * 타임라인 정렬 옵션
 */
export const TimelineSort = {
  SCENE_NUMBER: 'scene_number',  // 씬 번호순
  DURATION: 'duration',          // 지속 시간순
  DURATION_ASC: 'duration_asc',  // 지속 시간순 (오름차순)
  DURATION_DESC: 'duration_desc', // 지속 시간순 (내림차순)
  START_TIME: 'start_time',      // 시작 시간순
  END_TIME: 'end_time',          // 끝 시간순
  CREATED_AT: 'created_at',      // 생성일순
  TYPE: 'type',                  // 타입별
}

/**
 * 스케줄링 결과 인터페이스
 */
export const SchedulingResult = {
  dailySchedule: [{              // 일일 촬영 스케줄
    date: Date,
    scenes: [CaptionCard],
    location: String,
    equipment: [String],
    crew: [String],
  }],
  breakdown: [{                  // 브레이크다운 표
    category: String,            // 카테고리 (장비, 소품, 인물 등)
    items: [String],             // 항목들
    totalCost: Number,           // 총 비용
  }],
  optimizedWeight: Number,       // 최적화된 가중치
}

/**
 * 시간 기반 타임라인 설정 인터페이스
 */
export const TimelineTimeSettings = {
  zoomLevel: Number,              // 줌 레벨 (1, 2, 4, 8, 16 등)
  timeScale: Number,              // 픽셀당 시간 (초)
  baseScale: Number,              // 기본 스케일 (픽셀당 초)
  minSceneWidth: Number,          // 최소 씬 너비 (픽셀)
  tickInterval: Number,           // 눈금 간격 (초)
  timeUnit: String,               // 시간 단위 ('seconds', 'minutes', 'hours')
}

export default {
  NodeType,
  CaptionCardType,
  CaptionCardNode,
  CaptionCardComponents,
  CaptionCard,
  Timeline,
  TimelineFilter,
  TimelineSort,
  SchedulingResult,
  TimelineTimeSettings,
} 