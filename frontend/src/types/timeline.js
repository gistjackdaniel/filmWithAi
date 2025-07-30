/**
 * 타임라인 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 타임라인 인터페이스
 * @typedef {Object} Timeline
 * @property {string} id - 타임라인 고유 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {Array<CaptionCard>} captionCards - 캡션카드 배열
 * @property {number} totalDuration - 총 지속 시간
 * @property {Date} createdAt - 생성일
 * @property {Date} updatedAt - 수정일
 */
export const Timeline = {
  id: String,
  projectId: String,
  captionCards: [CaptionCard],
  totalDuration: Number,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * 캡션 카드 타입
 * @typedef {Object} CaptionCard
 * @property {string} id - 카드 고유 ID
 * @property {string} title - 카드 제목
 * @property {string} description - 카드 설명
 * @property {number} duration - 지속 시간 (초)
 * @property {number} startTime - 시작 시간 (초)
 * @property {number} endTime - 끝 시간 (초)
 * @property {Object} position - 타임라인에서의 위치
 * @property {number} position.x - X 좌표
 * @property {number} position.y - Y 좌표
 * @property {string} type - 카드 타입 (scene, cut, transition 등)
 * @property {Object} metadata - 추가 메타데이터
 */
export const CaptionCard = {
  id: String,
  title: String,
  description: String,
  duration: Number,
  startTime: Number,
  endTime: Number,
  position: {
    x: Number,
    y: Number,
  },
  type: String,
  metadata: Object,
};

/**
 * 타임라인 필터 옵션
 * @typedef {Object} TimelineFilter
 * @property {string} type - 타입별 필터
 * @property {Object} dateRange - 날짜 범위
 * @property {Date} dateRange.start - 시작 날짜
 * @property {Date} dateRange.end - 끝 날짜
 * @property {Object} timeRange - 시간 범위 필터 (시간 기반 타임라인용)
 * @property {number} timeRange.start - 시작 시간 (초)
 * @property {number} timeRange.end - 끝 시간 (초)
 * @property {string} location - 장소별 필터
 * @property {string} character - 등장인물별 필터
 * @property {string} equipment - 장비별 필터
 * @property {Object} duration - 지속 시간 필터
 * @property {number} duration.min - 최소 지속 시간 (초)
 * @property {number} duration.max - 최대 지속 시간 (초)
 */
export const TimelineFilter = {
  type: SceneType,
  dateRange: {
    start: Date,
    end: Date,
  },
  timeRange: {
    start: Number,
    end: Number,
  },
  location: String,
  character: String,
  equipment: String,
  duration: {
    min: Number,
    max: Number,
  },
};

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
};

/**
 * 스케줄링 결과 인터페이스
 * @typedef {Object} SchedulingResult
 * @property {Array<Object>} dailySchedule - 일일 촬영 스케줄
 * @property {Date} dailySchedule.date - 촬영 날짜
 * @property {Array<CaptionCard>} dailySchedule.scenes - 씬 목록
 * @property {string} dailySchedule.location - 촬영 장소
 * @property {Array<string>} dailySchedule.equipment - 장비 목록
 * @property {Array<string>} dailySchedule.crew - 인력 목록
 * @property {Array<Object>} breakdown - 브레이크다운 표
 * @property {string} breakdown.category - 카테고리 (장비, 소품, 인물 등)
 * @property {Array<string>} breakdown.items - 항목들
 * @property {number} breakdown.totalCost - 총 비용
 * @property {number} optimizedWeight - 최적화된 가중치
 */
export const SchedulingResult = {
  dailySchedule: [{
    date: Date,
    scenes: [CaptionCard],
    location: String,
    equipment: [String],
    crew: [String],
  }],
  breakdown: [{
    category: String,
    items: [String],
    totalCost: Number,
  }],
  optimizedWeight: Number,
};

/**
 * 시간 기반 타임라인 설정 인터페이스
 * @typedef {Object} TimelineTimeSettings
 * @property {number} zoomLevel - 줌 레벨 (1, 2, 4, 8, 16 등)
 * @property {number} timeScale - 픽셀당 시간 (초)
 * @property {number} baseScale - 기본 스케일 (픽셀당 초)
 * @property {number} minSceneWidth - 최소 씬 너비 (픽셀)
 * @property {number} tickInterval - 눈금 간격 (초)
 * @property {string} timeUnit - 시간 단위 ('seconds', 'minutes', 'hours')
 */
export const TimelineTimeSettings = {
  zoomLevel: Number,
  timeScale: Number,
  baseScale: Number,
  minSceneWidth: Number,
  tickInterval: Number,
  timeUnit: String,
};

/**
 * 타임라인 생성 요청 타입
 * @typedef {Object} CreateTimelineRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {Array<CaptionCard>} captionCards - 캡션 카드 배열
 * @property {number} totalDuration - 총 지속 시간
 */
export const CreateTimelineRequest = {
  projectId: String,
  captionCards: [CaptionCard],
  totalDuration: Number,
};

/**
 * 타임라인 수정 요청 타입
 * @typedef {Object} UpdateTimelineRequest
 * @property {Array<CaptionCard>} [captionCards] - 캡션 카드 배열
 * @property {number} [totalDuration] - 총 지속 시간
 */
export const UpdateTimelineRequest = {
  captionCards: [CaptionCard],
  totalDuration: Number,
};

/**
 * 타임라인 응답 타입
 * @typedef {Object} TimelineResponse
 * @property {string} _id - 타임라인 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {Array<CaptionCard>} captionCards - 캡션 카드 배열
 * @property {number} totalDuration - 총 지속 시간
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const TimelineResponse = {
  _id: String,
  projectId: String,
  captionCards: [CaptionCard],
  totalDuration: Number,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * 타임라인 목록 응답 타입
 * @typedef {Object} TimelineListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<TimelineResponse>} data - 타임라인 목록
 * @property {string} message - 응답 메시지
 */
export const TimelineListResponse = {
  success: Boolean,
  data: [TimelineResponse],
  message: String,
};

/**
 * 타임라인 상세 응답 타입
 * @typedef {Object} TimelineDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {TimelineResponse} data - 타임라인 상세 정보
 * @property {string} message - 응답 메시지
 */
export const TimelineDetailResponse = {
  success: Boolean,
  data: TimelineResponse,
  message: String,
};

/**
 * API 응답 타입
 * @typedef {Object} ApiResponse
 * @property {boolean} success - 성공 여부
 * @property {string} message - 응답 메시지
 * @property {Object} data - 응답 데이터
 * @property {string} error - 에러 메시지
 */
export const ApiResponse = {
  success: Boolean,
  message: String,
  data: Object,
  error: String,
};

// 기본 타임라인 객체 생성 함수
export const createDefaultTimeline = () => ({
  _id: '',
  projectId: '',
  captionCards: [],
  totalDuration: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 기본 캡션 카드 객체 생성 함수
export const createDefaultCaptionCard = () => ({
  id: '',
  title: '',
  description: '',
  duration: 0,
  startTime: 0,
  endTime: 0,
  position: {
    x: 0,
    y: 0,
  },
  type: 'scene',
  metadata: {},
});

// 타임라인 유효성 검사 함수
export const validateTimeline = (timeline) => {
  const errors = [];
  
  if (!timeline.projectId || timeline.projectId.trim() === '') {
    errors.push('프로젝트 ID는 필수입니다.');
  }
  
  if (!timeline.captionCards || timeline.captionCards.length === 0) {
    errors.push('캡션 카드는 최소 하나 이상 필요합니다.');
  }
  
  if (!timeline.totalDuration || timeline.totalDuration < 0) {
    errors.push('총 지속 시간은 0 이상이어야 합니다.');
  }
  
  return errors;
};

// 캡션 카드 유효성 검사 함수
export const validateCaptionCard = (card) => {
  const errors = [];
  
  if (!card.title || card.title.trim() === '') {
    errors.push('카드 제목은 필수입니다.');
  }
  
  if (!card.description || card.description.trim() === '') {
    errors.push('카드 설명은 필수입니다.');
  }
  
  if (!card.duration || card.duration < 0) {
    errors.push('지속 시간은 0 이상이어야 합니다.');
  }
  
  if (!card.type || card.type.trim() === '') {
    errors.push('카드 타입은 필수입니다.');
  }
  
  return errors;
};

// 타임라인 정렬 함수
export const sortTimelines = (timelines, sortBy = 'createdAt', order = 'desc') => {
  return [...timelines].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

// 타임라인 필터링 함수
export const filterTimelines = (timelines, filters) => {
  return timelines.filter(timeline => {
    // 프로젝트 ID 필터
    if (filters.projectId && timeline.projectId !== filters.projectId) {
      return false;
    }
    
    // 총 지속 시간 필터
    if (filters.minDuration && timeline.totalDuration < filters.minDuration) {
      return false;
    }
    
    if (filters.maxDuration && timeline.totalDuration > filters.maxDuration) {
      return false;
    }
    
    // 카드 수 필터
    if (filters.minCards && timeline.captionCards.length < filters.minCards) {
      return false;
    }
    
    if (filters.maxCards && timeline.captionCards.length > filters.maxCards) {
      return false;
    }
    
    return true;
  });
};

// 타임라인 통계 계산 함수
export const calculateTimelineStatistics = (timeline) => {
  const cardTypes = new Set();
  const totalDuration = timeline.captionCards.reduce((sum, card) => sum + card.duration, 0);
  
  timeline.captionCards.forEach(card => {
    if (card.type) cardTypes.add(card.type);
  });
  
  return {
    totalCards: timeline.captionCards.length,
    totalDuration: totalDuration,
    averageCardDuration: timeline.captionCards.length > 0 ? totalDuration / timeline.captionCards.length : 0,
    uniqueCardTypes: Array.from(cardTypes),
    timelineEfficiency: timeline.totalDuration > 0 ? (totalDuration / timeline.totalDuration) * 100 : 0,
  };
};

export default {
  Timeline,
  CaptionCard,
  TimelineFilter,
  TimelineSort,
  SchedulingResult,
  TimelineTimeSettings,
  CreateTimelineRequest,
  UpdateTimelineRequest,
  TimelineResponse,
  TimelineListResponse,
  TimelineDetailResponse,
  ApiResponse,
  createDefaultTimeline,
  createDefaultCaptionCard,
  validateTimeline,
  validateCaptionCard,
  sortTimelines,
  filterTimelines,
  calculateTimelineStatistics,
}; 