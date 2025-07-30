/**
 * 프로젝트 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 프로젝트 상태 타입
 */
export const ProjectStatus = {
  DRAFT: 'draft',                     // 초안
  STORY_READY: 'story_ready',         // 스토리 준비됨
  CONTE_READY: 'conte_ready',         // 콘티 준비됨
  CUT_GENERATING: 'cut_generating',   // 컷 생성 중
  CUT_GENERATED: 'cut_generated',     // 컷 생성 완료
  PRODUCTION_READY: 'production_ready', // 제작 준비됨
}

/**
 * 프로젝트 생성 요청 타입
 * @typedef {Object} CreateProjectRequest
 * @property {string} title - 프로젝트 제목
 * @property {string} synopsis - 시놉시스
 * @property {string} story - 스토리
 * @property {Array<string>} tags - 프로젝트 태그
 * @property {Array<string>} genre - 장르
 * @property {boolean} isPublic - 공개 여부
 * @property {string} estimatedDuration - 예상 지속 시간
 */
export const CreateProjectRequest = {
  title: String,
  synopsis: String,
  story: String,
  tags: [String],
  genre: [String],
  isPublic: Boolean,
  estimatedDuration: String,
}

/**
 * 프로젝트 수정 요청 타입
 * @typedef {Object} UpdateProjectRequest
 * @property {string} [title] - 프로젝트 제목
 * @property {string} [synopsis] - 시놉시스
 * @property {string} [story] - 스토리
 * @property {Array<string>} [tags] - 프로젝트 태그
 * @property {Array<string>} [genre] - 장르
 * @property {boolean} [isPublic] - 공개 여부
 * @property {string} [estimatedDuration] - 예상 지속 시간
 */
export const UpdateProjectRequest = {
  title: String,
  synopsis: String,
  story: String,
  tags: [String],
  genre: [String],
  isPublic: Boolean,
  estimatedDuration: String,
}

/**
 * 프로젝트 응답 타입
 * @typedef {Object} ProjectResponse
 * @property {string} _id - 프로젝트 ID
 * @property {string} title - 프로젝트 제목
 * @property {string} synopsis - 시놉시스
 * @property {string} story - 스토리
 * @property {Array<string>} tags - 프로젝트 태그
 * @property {Array<string>} genre - 장르
 * @property {boolean} isPublic - 공개 여부
 * @property {string} estimatedDuration - 예상 지속 시간
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 */
export const ProjectResponse = {
  _id: String,
  title: String,
  synopsis: String,
  story: String,
  tags: [String],
  genre: [String],
  isPublic: Boolean,
  estimatedDuration: String,
  createdAt: Date,
  updatedAt: Date,
}

/**
 * 프로젝트 목록 응답 타입
 * @typedef {Object} ProjectListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<ProjectResponse>} data - 프로젝트 목록
 * @property {Object} pagination - 페이지네이션 정보
 * @property {string} message - 응답 메시지
 */
export const ProjectListResponse = {
  success: Boolean,
  data: [ProjectResponse],
  pagination: {
    page: Number,
    limit: Number,
    total: Number,
    totalPages: Number,
  },
  message: String,
}

/**
 * 프로젝트 상세 응답 타입
 * @typedef {Object} ProjectDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {ProjectResponse} data - 프로젝트 상세 정보
 * @property {string} message - 응답 메시지
 */
export const ProjectDetailResponse = {
  success: Boolean,
  data: ProjectResponse,
  message: String,
}

/**
 * 스토리 생성 요청 타입
 * @typedef {Object} StoryGenerationRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {string} synopsis - 시놉시스
 * @property {Array<string>} genre - 장르
 * @property {string} estimatedDuration - 예상 지속 시간
 * @property {Object} options - 생성 옵션
 */
export const StoryGenerationRequest = {
  projectId: String,
  synopsis: String,
  genre: [String],
  estimatedDuration: String,
  options: Object,
}

/**
 * 스토리 생성 응답 타입
 * @typedef {Object} StoryGenerationResponse
 * @property {string} _id - 생성된 스토리 ID
 * @property {string} story - 생성된 스토리 내용
 * @property {string} status - 생성 상태
 * @property {Date} createdAt - 생성 시간
 */
export const StoryGenerationResponse = {
  _id: String,
  story: String,
  status: String,
  createdAt: Date,
}

/**
 * 스토리 생성 상태 타입
 */
export const StoryGenerationStatus = {
  PENDING: 'pending',           // 대기 중
  GENERATING: 'generating',     // 생성 중
  COMPLETED: 'completed',       // 완료
  FAILED: 'failed',             // 실패
  CANCELLED: 'cancelled',       // 취소됨
}

/**
 * 스토리 분석 요청 타입
 * @typedef {Object} StoryAnalysisRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {string} story - 분석할 스토리
 */
export const StoryAnalysisRequest = {
  projectId: String,
  story: String,
}

/**
 * 스토리 분석 응답 타입
 * @typedef {Object} StoryAnalysisResponse
 * @property {boolean} success - 성공 여부
 * @property {Object} data - 분석 결과
 * @property {string} message - 응답 메시지
 */
export const StoryAnalysisResponse = {
  success: Boolean,
  data: Object,
  message: String,
}

/**
 * 스토리 요약 요청 타입
 * @typedef {Object} StorySummaryRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {string} story - 요약할 스토리
 */
export const StorySummaryRequest = {
  projectId: String,
  story: String,
}

/**
 * 스토리 요약 응답 타입
 * @typedef {Object} StorySummaryResponse
 * @property {boolean} success - 성공 여부
 * @property {string} data - 요약된 스토리
 * @property {string} message - 응답 메시지
 */
export const StorySummaryResponse = {
  success: Boolean,
  data: String,
  message: String,
}

/**
 * 스토리 개선 제안 요청 타입
 * @typedef {Object} StoryImprovementRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {string} story - 개선할 스토리
 * @property {string} aspect - 개선할 측면 (plot, character, dialogue 등)
 */
export const StoryImprovementRequest = {
  projectId: String,
  story: String,
  aspect: String,
}

/**
 * 스토리 개선 제안 응답 타입
 * @typedef {Object} StoryImprovementResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<string>} data - 개선 제안 목록
 * @property {string} message - 응답 메시지
 */
export const StoryImprovementResponse = {
  success: Boolean,
  data: [String],
  message: String,
}

/**
 * 스토리 버전 관리 타입
 * @typedef {Object} StoryVersion
 * @property {string} _id - 버전 ID
 * @property {string} projectId - 프로젝트 ID
 * @property {string} story - 스토리 내용
 * @property {string} version - 버전 번호
 * @property {string} description - 버전 설명
 * @property {Date} createdAt - 생성 시간
 */
export const StoryVersion = {
  _id: String,
  projectId: String,
  story: String,
  version: String,
  description: String,
  createdAt: Date,
}

/**
 * 스토리 공유 요청 타입
 * @typedef {Object} StoryShareRequest
 * @property {string} projectId - 프로젝트 ID
 * @property {string} shareType - 공유 타입 (public, private, link)
 * @property {Array<string>} [recipients] - 수신자 목록 (이메일)
 */
export const StoryShareRequest = {
  projectId: String,
  shareType: String,
  recipients: [String],
}

/**
 * 스토리 공유 응답 타입
 * @typedef {Object} StoryShareResponse
 * @property {boolean} success - 성공 여부
 * @property {string} data - 공유 링크 또는 토큰
 * @property {string} message - 응답 메시지
 */
export const StoryShareResponse = {
  success: Boolean,
  data: String,
  message: String,
}

// 기본 프로젝트 객체 생성 함수
export const createDefaultProject = () => ({
  _id: '',
  title: '',
  synopsis: '',
  story: '',
  tags: [],
  genre: [],
  isPublic: false,
  estimatedDuration: '',
  createdAt: new Date(),
  updatedAt: new Date(),
})

// 프로젝트 유효성 검사 함수
export const validateProject = (project) => {
  const errors = []
  
  if (!project.title || project.title.trim() === '') {
    errors.push('프로젝트 제목은 필수입니다.')
  }
  
  if (!project.synopsis || project.synopsis.trim() === '') {
    errors.push('시놉시스는 필수입니다.')
  }
  
  if (!project.story || project.story.trim() === '') {
    errors.push('스토리는 필수입니다.')
  }
  
  if (!project.genre || project.genre.length === 0) {
    errors.push('장르는 필수입니다.')
  }
  
  return errors
}

// 프로젝트 정렬 함수
export const sortProjects = (projects, sortBy = 'createdAt', order = 'desc') => {
  return [...projects].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// 프로젝트 필터링 함수
export const filterProjects = (projects, filters) => {
  return projects.filter(project => {
    // 제목 필터
    if (filters.title && !project.title.toLowerCase().includes(filters.title.toLowerCase())) {
      return false
    }
    
    // 장르 필터
    if (filters.genre && !project.genre.includes(filters.genre)) {
      return false
    }
    
    // 태그 필터
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => project.tags.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }
    
    // 공개 여부 필터
    if (filters.isPublic !== undefined && project.isPublic !== filters.isPublic) {
      return false
    }
    
    return true
  })
}

export default {
  ProjectStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectListResponse,
  ProjectDetailResponse,
  StoryGenerationRequest,
  StoryGenerationResponse,
  StoryGenerationStatus,
  StoryAnalysisRequest,
  StoryAnalysisResponse,
  StorySummaryRequest,
  StorySummaryResponse,
  StoryImprovementRequest,
  StoryImprovementResponse,
  StoryVersion,
  StoryShareRequest,
  StoryShareResponse,
  createDefaultProject,
  validateProject,
  sortProjects,
  filterProjects,
} 