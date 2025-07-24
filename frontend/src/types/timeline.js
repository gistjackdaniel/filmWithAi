/**
 * 타임라인 관련 타입 정의
 * 시간 기반 타임라인과 컷 표시에 관련된 타입들
 */

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
  type: SceneType,         // 타입별 필터
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

/**
 * API 응답 타입
 */
export const ApiResponse = {
  success: Boolean,
  message: String,
  data: Object,
  error: String,
}

export default {
  Timeline,
  TimelineFilter,
  TimelineSort,
  SchedulingResult,
  TimelineTimeSettings,
  ApiResponse,
} 