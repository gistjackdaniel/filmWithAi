/**
 * 스케줄 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 시간 범위 타입
 * @typedef {Object} SchedulerTimeRange
 * @property {string} start - 시작 시간 (예: '09:00')
 * @property {string} end - 종료 시간 (예: '17:00')
 */
export const SchedulerTimeRange = {
  start: String,
  end: String,
};

/**
 * 스케줄러 씬 타입
 * @typedef {Object} SchedulerScene
 * @property {number} scene - 씬 번호
 * @property {string} title - 씬 제목
 * @property {string} description - 씬 설명
 * @property {string} timeOfDay - 시간대 (낮, 밤, 미정)
 * @property {Object} cast - 캐스트 정보
 * @property {string} cast.role - 역할
 * @property {string} cast.name - 이름
 * @property {number} estimatedDuration - 예상 지속 시간
 * @property {Array<string>} costumes - 코스튬 목록
 * @property {Object} props - 속성 정보
 * @property {Array<string>} props.characterProps - 캐릭터 속성
 * @property {Array<string>} props.setProps - 세트 속성
 */
export const SchedulerScene = {
  scene: Number,
  title: String,
  description: String,
  timeOfDay: String, // '낮', '밤', '미정'
  cast: {
    role: String,
    name: String,
  },
  estimatedDuration: Number,
  costumes: [String],
  props: {
    characterProps: [String],
    setProps: [String],
  },
};

/**
 * 스케줄러 생성 요청 타입
 * @typedef {Object} CreateSchedulerRequest
 * @property {number} maxDailyHours - 최대 일일 촬영 시간
 * @property {number} maxWeeklyHours - 최대 주간 촬영 시간
 * @property {number} restDay - 휴게 일
 */
export const CreateSchedulerRequest = {
  maxDailyHours: Number,
  maxWeeklyHours: Number,
  restDay: Number,
};

/**
 * 스케줄러 일 수정 요청 타입
 * @typedef {Object} UpdateSchedulerDayRequest
 * @property {number} [day] - 일차
 * @property {string} [date] - 날짜 표시 (예: 'Day 1')
 * @property {string} [location] - 촬영 장소
 * @property {string} [timeOfDay] - 시간대
 * @property {SchedulerTimeRange} [timeRange] - 시간 범위
 * @property {Array<SchedulerScene>} [scenes] - 씬 배열
 * @property {number} [estimatedDuration] - 예상 지속 시간 (분)
 * @property {Object} [breakdown] - 브레이크다운 정보
 */
export const UpdateSchedulerDayRequest = {
  day: Number,
  date: String,
  location: String,
  timeOfDay: String,
  timeRange: SchedulerTimeRange,
  scenes: [SchedulerScene],
  estimatedDuration: Number,
  breakdown: Object,
};

/**
 * 스케줄러 수정 요청 타입
 * @typedef {Object} UpdateSchedulerRequest
 * @property {Array<UpdateSchedulerDayRequest>} [days] - 스케줄러 일일 배열
 * @property {number} [totalDays] - 총 일수
 * @property {number} [totalScenes] - 총 씬 수
 * @property {number} [totalDuration] - 총 촬영 시간
 */
export const UpdateSchedulerRequest = {
  days: [UpdateSchedulerDayRequest],
  totalDays: Number,
  totalScenes: Number,
  totalDuration: Number,
};

/**
 * 스케줄러 일 타입
 * @typedef {Object} SchedulerDay
 * @property {number} day - 일차
 * @property {string} date - 날짜 표시
 * @property {string} location - 촬영 장소
 * @property {string} timeOfDay - 시간대
 * @property {SchedulerTimeRange} timeRange - 시간 범위
 * @property {Array<SchedulerScene>} scenes - 씬 배열
 * @property {number} estimatedDuration - 예상 지속 시간 (분)
 * @property {Object} breakdown - 브레이크다운 정보
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const SchedulerDay = {
  day: Number,
  date: String,
  location: String,
  timeOfDay: String,
  timeRange: SchedulerTimeRange,
  scenes: [SchedulerScene],
  estimatedDuration: Number,
  breakdown: Object,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * 스케줄러 응답 타입
 * @typedef {Object} SchedulerResponse
 * @property {string} _id - 스케줄러 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {number} maxDailyHours - 최대 일일 촬영 시간
 * @property {number} maxWeeklyHours - 최대 주간 촬영 시간
 * @property {number} restDay - 휴게 일
 * @property {Array<SchedulerDay>} days - 일일 스케줄
 * @property {number} totalDays - 총 일수
 * @property {number} totalScenes - 총 씬 수
 * @property {number} totalDuration - 총 촬영 시간
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const SchedulerResponse = {
  _id: String,
  projectId: String,
  maxDailyHours: Number,
  maxWeeklyHours: Number,
  restDay: Number,
  days: [SchedulerDay],
  totalDays: Number,
  totalScenes: Number,
  totalDuration: Number,
  createdAt: Date,
  updatedAt: Date,
};

/**
 * 스케줄러 목록 응답 타입
 * @typedef {Object} SchedulerListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<SchedulerResponse>} data - 스케줄러 목록
 * @property {string} message - 응답 메시지
 */
export const SchedulerListResponse = {
  success: Boolean,
  data: [SchedulerResponse],
  message: String,
};

/**
 * 스케줄러 상세 응답 타입
 * @typedef {Object} SchedulerDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {SchedulerResponse} data - 스케줄러 상세 정보
 * @property {string} message - 응답 메시지
 */
export const SchedulerDetailResponse = {
  success: Boolean,
  data: SchedulerResponse,
  message: String,
};

/**
 * 브레이크다운 정보 타입
 * @typedef {Object} BreakdownInfo
 * @property {Object} locations - 장소별 정보
 * @property {Object} actors - 배우별 정보
 * @property {Object} equipment - 장비별 정보
 * @property {Object} props - 소품별 정보
 * @property {Object} costumes - 코스튬별 정보
 */
export const BreakdownInfo = {
  locations: Object,
  actors: Object,
  equipment: Object,
  props: Object,
  costumes: Object,
};

/**
 * 일일 스케줄 요약 타입
 * @typedef {Object} DailyScheduleSummary
 * @property {number} day - 일차
 * @property {string} date - 날짜
 * @property {string} location - 촬영 장소
 * @property {number} sceneCount - 씬 수
 * @property {number} totalDuration - 총 지속 시간
 * @property {Array<string>} cast - 출연진
 * @property {Array<string>} equipment - 장비
 */
export const DailyScheduleSummary = {
  day: Number,
  date: String,
  location: String,
  sceneCount: Number,
  totalDuration: Number,
  cast: [String],
  equipment: [String],
};

/**
 * 스케줄 통계 타입
 * @typedef {Object} ScheduleStatistics
 * @property {number} totalDays - 총 촬영 일수
 * @property {number} totalScenes - 총 씬 수
 * @property {number} totalDuration - 총 촬영 시간
 * @property {number} averageScenesPerDay - 일평균 씬 수
 * @property {number} averageDurationPerDay - 일평균 촬영 시간
 * @property {Array<string>} uniqueLocations - 고유 장소 목록
 * @property {Array<string>} uniqueCast - 고유 출연진 목록
 */
export const ScheduleStatistics = {
  totalDays: Number,
  totalScenes: Number,
  totalDuration: Number,
  averageScenesPerDay: Number,
  averageDurationPerDay: Number,
  uniqueLocations: [String],
  uniqueCast: [String],
};

// 기본 스케줄러 객체 생성 함수
export const createDefaultScheduler = () => ({
  _id: '',
  projectId: '',
  maxDailyHours: 8,
  maxWeeklyHours: 40,
  restDay: 1,
  days: [],
  totalDays: 0,
  totalScenes: 0,
  totalDuration: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 기본 스케줄러 일 객체 생성 함수
export const createDefaultSchedulerDay = () => ({
  day: 1,
  date: 'Day 1',
  location: '',
  timeOfDay: '낮',
  timeRange: {
    start: '09:00',
    end: '17:00',
  },
  scenes: [],
  estimatedDuration: 0,
  breakdown: {
    locations: {},
    actors: {},
    equipment: {},
    props: {},
    costumes: {},
  },
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 기본 스케줄러 씬 객체 생성 함수
export const createDefaultSchedulerScene = () => ({
  scene: 1,
  title: '',
  description: '',
  timeOfDay: '낮',
  cast: {
    role: '',
    name: '',
  },
  estimatedDuration: 0,
  costumes: [],
  props: {
    characterProps: [],
    setProps: [],
  },
});

// 스케줄러 유효성 검사 함수
export const validateScheduler = (scheduler) => {
  const errors = [];
  
  if (!scheduler.projectId || scheduler.projectId.trim() === '') {
    errors.push('프로젝트 ID는 필수입니다.');
  }
  
  if (!scheduler.maxDailyHours || scheduler.maxDailyHours < 1) {
    errors.push('최대 일일 촬영 시간은 1시간 이상이어야 합니다.');
  }
  
  if (!scheduler.maxWeeklyHours || scheduler.maxWeeklyHours < 1) {
    errors.push('최대 주간 촬영 시간은 1시간 이상이어야 합니다.');
  }
  
  if (scheduler.restDay < 0 || scheduler.restDay > 7) {
    errors.push('휴게 일은 0-7 사이여야 합니다.');
  }
  
  return errors;
};

// 스케줄러 일 유효성 검사 함수
export const validateSchedulerDay = (day) => {
  const errors = [];
  
  if (!day.day || day.day < 1) {
    errors.push('일차는 1 이상이어야 합니다.');
  }
  
  if (!day.date || day.date.trim() === '') {
    errors.push('날짜는 필수입니다.');
  }
  
  if (!day.location || day.location.trim() === '') {
    errors.push('촬영 장소는 필수입니다.');
  }
  
  if (!day.timeOfDay || !['낮', '밤', '미정'].includes(day.timeOfDay)) {
    errors.push('시간대는 낮, 밤, 미정 중 하나여야 합니다.');
  }
  
  return errors;
};

// 스케줄러 정렬 함수
export const sortSchedulers = (schedulers, sortBy = 'createdAt', order = 'desc') => {
  return [...schedulers].sort((a, b) => {
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

// 스케줄러 필터링 함수
export const filterSchedulers = (schedulers, filters) => {
  return schedulers.filter(scheduler => {
    // 프로젝트 ID 필터
    if (filters.projectId && scheduler.projectId !== filters.projectId) {
      return false;
    }
    
    // 총 일수 필터
    if (filters.minDays && scheduler.totalDays < filters.minDays) {
      return false;
    }
    
    if (filters.maxDays && scheduler.totalDays > filters.maxDays) {
      return false;
    }
    
    // 총 씬 수 필터
    if (filters.minScenes && scheduler.totalScenes < filters.minScenes) {
      return false;
    }
    
    if (filters.maxScenes && scheduler.totalScenes > filters.maxScenes) {
      return false;
    }
    
    return true;
  });
};

// 스케줄 통계 계산 함수
export const calculateScheduleStatistics = (scheduler) => {
  const uniqueLocations = new Set();
  const uniqueCast = new Set();
  let totalScenes = 0;
  
  scheduler.days.forEach(day => {
    if (day.location) uniqueLocations.add(day.location);
    
    day.scenes.forEach(scene => {
      totalScenes += 1;
      if (scene.cast?.name) uniqueCast.add(scene.cast.name);
    });
  });
  
  return {
    totalDays: scheduler.totalDays,
    totalScenes: totalScenes,
    totalDuration: scheduler.totalDuration,
    averageScenesPerDay: scheduler.totalDays > 0 ? totalScenes / scheduler.totalDays : 0,
    averageDurationPerDay: scheduler.totalDays > 0 ? scheduler.totalDuration / scheduler.totalDays : 0,
    uniqueLocations: Array.from(uniqueLocations),
    uniqueCast: Array.from(uniqueCast),
  };
};

export default {
  SchedulerTimeRange,
  SchedulerScene,
  CreateSchedulerRequest,
  UpdateSchedulerDayRequest,
  UpdateSchedulerRequest,
  SchedulerDay,
  SchedulerResponse,
  SchedulerListResponse,
  SchedulerDetailResponse,
  BreakdownInfo,
  DailyScheduleSummary,
  ScheduleStatistics,
  createDefaultScheduler,
  createDefaultSchedulerDay,
  createDefaultSchedulerScene,
  validateScheduler,
  validateSchedulerDay,
  sortSchedulers,
  filterSchedulers,
  calculateScheduleStatistics,
};
