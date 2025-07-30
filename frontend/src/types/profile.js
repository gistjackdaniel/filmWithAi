/**
 * 프로필 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * 프로필 생성 요청 타입
 * @typedef {Object} CreateProfileRequest
 * @property {string} googleId - Google ID
 * @property {string} email - 이메일 주소
 * @property {string} name - 사용자 이름
 * @property {string} picture - 프로필 이미지 URL
 * @property {Date} lastLoginAt - 마지막 로그인 시간
 */
export const CreateProfileRequest = {
  googleId: String,
  email: String,
  name: String,
  picture: String,
  lastLoginAt: Date,
};

/**
 * 프로필 수정 요청 타입
 * @typedef {Object} UpdateProfileRequest
 * @property {string} [googleId] - Google ID
 * @property {string} [email] - 이메일 주소
 * @property {string} [name] - 사용자 이름
 * @property {string} [picture] - 프로필 이미지 URL
 * @property {Date} [lastLoginAt] - 마지막 로그인 시간
 */
export const UpdateProfileRequest = {
  googleId: String,
  email: String,
  name: String,
  picture: String,
  lastLoginAt: Date,
};

/**
 * 프로필 조회 요청 타입
 * @typedef {Object} FindProfileRequest
 * @property {string} [profileId] - 프로필 ID
 * @property {string} [googleId] - Google ID
 * @property {string} [email] - 이메일 주소
 * @property {string} [name] - 사용자 이름
 * @property {number} [page] - 페이지 번호 (기본값: 1)
 * @property {number} [limit] - 페이지당 항목 수 (기본값: 10)
 */
export const FindProfileRequest = {
  profileId: String,
  googleId: String,
  email: String,
  name: String,
  page: Number,
  limit: Number,
};

/**
 * 프로필 삭제 요청 타입
 * @typedef {Object} DeleteProfileRequest
 * @property {string} profileId - 삭제할 프로필 ID
 */
export const DeleteProfileRequest = {
  profileId: String,
};

/**
 * 프로젝트 참조 타입
 * @typedef {Object} ProjectReference
 * @property {string} projectId - 프로젝트 ID
 * @property {Date} lastViewedAt - 마지막 조회 시간
 * @property {boolean} isFavorite - 즐겨찾기 여부
 */
export const ProjectReference = {
  projectId: String,
  lastViewedAt: Date,
  isFavorite: Boolean,
};

/**
 * 프로필 응답 타입
 * @typedef {Object} ProfileResponse
 * @property {string} _id - 프로필 ID
 * @property {string} googleId - Google ID
 * @property {string} email - 이메일 주소
 * @property {string} name - 사용자 이름
 * @property {string} [picture] - 프로필 이미지 URL
 * @property {Date} lastLoginAt - 마지막 로그인 시간
 * @property {Date} createdAt - 생성 시간
 * @property {Date} updatedAt - 수정 시간
 * @property {Array<ProjectReference>} projects - 프로젝트 목록
 */
export const ProfileResponse = {
  _id: String,
  googleId: String,
  email: String,
  name: String,
  picture: String,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date,
  projects: [ProjectReference],
};

/**
 * 프로필 목록 응답 타입
 * @typedef {Object} ProfileListResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<ProfileResponse>} data - 프로필 목록
 * @property {Object} pagination - 페이지네이션 정보
 * @property {string} message - 응답 메시지
 */
export const ProfileListResponse = {
  success: Boolean,
  data: [ProfileResponse],
  pagination: {
    page: Number,
    limit: Number,
    total: Number,
    totalPages: Number,
  },
  message: String,
};

/**
 * 프로필 상세 응답 타입
 * @typedef {Object} ProfileDetailResponse
 * @property {boolean} success - 성공 여부
 * @property {ProfileResponse} data - 프로필 상세 정보
 * @property {string} message - 응답 메시지
 */
export const ProfileDetailResponse = {
  success: Boolean,
  data: ProfileResponse,
  message: String,
};

/**
 * 즐겨찾기 프로젝트 추가 요청 타입
 * @typedef {Object} AddFavoriteProjectRequest
 * @property {string} projectId - 프로젝트 ID
 */
export const AddFavoriteProjectRequest = {
  projectId: String,
};

/**
 * 즐겨찾기 프로젝트 제거 요청 타입
 * @typedef {Object} RemoveFavoriteProjectRequest
 * @property {string} projectId - 프로젝트 ID
 */
export const RemoveFavoriteProjectRequest = {
  projectId: String,
};

/**
 * 즐겨찾기 프로젝트 목록 응답 타입
 * @typedef {Object} FavoriteProjectsResponse
 * @property {boolean} success - 성공 여부
 * @property {Array<ProjectReference>} data - 즐겨찾기 프로젝트 목록
 * @property {string} message - 응답 메시지
 */
export const FavoriteProjectsResponse = {
  success: Boolean,
  data: [ProjectReference],
  message: String,
};

// 기본 프로필 객체 생성 함수
export const createDefaultProfile = () => ({
  _id: '',
  googleId: '',
  email: '',
  name: '',
  picture: '',
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  projects: [],
});

// 프로필 유효성 검사 함수
export const validateProfile = (profile) => {
  const errors = [];
  
  if (!profile.googleId || profile.googleId.trim() === '') {
    errors.push('Google ID는 필수입니다.');
  }
  
  if (!profile.email || profile.email.trim() === '') {
    errors.push('이메일은 필수입니다.');
  }
  
  if (!profile.name || profile.name.trim() === '') {
    errors.push('사용자 이름은 필수입니다.');
  }
  
  return errors;
};

// 프로필 정렬 함수
export const sortProfiles = (profiles, sortBy = 'name', order = 'asc') => {
  return [...profiles].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'lastLoginAt' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
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

// 프로필 필터링 함수
export const filterProfiles = (profiles, filters) => {
  return profiles.filter(profile => {
    // 이메일 필터
    if (filters.email && !profile.email.toLowerCase().includes(filters.email.toLowerCase())) {
      return false;
    }
    
    // 이름 필터
    if (filters.name && !profile.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    
    // Google ID 필터
    if (filters.googleId && !profile.googleId.toLowerCase().includes(filters.googleId.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};

export default {
  CreateProfileRequest,
  UpdateProfileRequest,
  FindProfileRequest,
  DeleteProfileRequest,
  ProjectReference,
  ProfileResponse,
  ProfileListResponse,
  ProfileDetailResponse,
  AddFavoriteProjectRequest,
  RemoveFavoriteProjectRequest,
  FavoriteProjectsResponse,
  createDefaultProfile,
  validateProfile,
  sortProfiles,
  filterProfiles,
};
