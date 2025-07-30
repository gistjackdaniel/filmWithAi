/**
 * 인증 관련 타입 정의
 * NestJS 백엔드 API와 일치하도록 정의
 */

/**
 * Google 사용자 정보 타입
 * @typedef {Object} GoogleUserInfo
 * @property {string} id - Google ID
 * @property {string} email - 이메일 주소
 * @property {boolean} verified_email - 이메일 인증 여부
 * @property {string} name - 전체 이름
 * @property {string} given_name - 이름
 * @property {string} family_name - 성
 * @property {string} picture - 프로필 이미지 URL
 * @property {string} locale - 언어 설정
 * @property {string} [hd] - 호스팅된 도메인
 */
export const GoogleUserInfo = {
  id: String,
  email: String,
  verified_email: Boolean,
  name: String,
  given_name: String,
  family_name: String,
  picture: String,
  locale: String,
  hd: String,
}

/**
 * 액세스 토큰 페이로드 타입
 * @typedef {Object} AccessToken
 * @property {string} userId - 사용자 ID
 * @property {string} email - 이메일 주소
 * @property {string} profileId - 프로필 ID
 */
export const AccessToken = {
  userId: String,
  email: String,
  profileId: String,
}

/**
 * 리프레시 토큰 페이로드 타입
 * @typedef {Object} RefreshToken
 * @property {string} userId - 사용자 ID
 * @property {string} email - 이메일 주소
 * @property {string} profileId - 프로필 ID
 */
export const RefreshToken = {
  userId: String,
  email: String,
  profileId: String,
}

/**
 * 로그인 요청 타입
 * @typedef {Object} LoginRequest
 * @property {string} access_token - Google OAuth 액세스 토큰
 */
export const LoginRequest = {
  access_token: String,
}

/**
 * 리프레시 토큰 요청 타입
 * @typedef {Object} RefreshAccessTokenRequest
 * @property {string} refresh_token - 리프레시 토큰
 */
export const RefreshAccessTokenRequest = {
  refresh_token: String,
}

/**
 * 탈퇴 요청 타입
 * @typedef {Object} WithdrawRequest
 * @property {string} profileId - 탈퇴할 사용자 ID
 */
export const WithdrawRequest = {
  profileId: String,
}

/**
 * 사용자 정보 타입
 * @typedef {Object} UserInfo
 * @property {string} _id - 사용자 ID
 * @property {string} googleId - Google ID
 * @property {string} email - 이메일 주소
 * @property {string} name - 사용자 이름
 * @property {string} [picture] - 프로필 이미지 URL
 */
export const UserInfo = {
  _id: String,
  googleId: String,
  email: String,
  name: String,
  picture: String,
}

/**
 * 로그인 응답 타입
 * @typedef {Object} LoginResponse
 * @property {string} access_token - 액세스 토큰
 * @property {string} refresh_token - 리프레시 토큰
 * @property {UserInfo} user - 사용자 정보
 */
export const LoginResponse = {
  access_token: String,
  refresh_token: String,
  user: {
    _id: String,
    googleId: String,
    email: String,
    name: String,
    picture: String,
  },
}

/**
 * 리프레시 토큰 응답 타입
 * @typedef {Object} RefreshAccessTokenResponse
 * @property {string} access_token - 새로운 액세스 토큰
 * @property {string} expires_in - 토큰 만료 시간
 */
export const RefreshAccessTokenResponse = {
  access_token: String,
  expires_in: String,
}

/**
 * 탈퇴 응답 타입
 * @typedef {Object} WithdrawResponse
 * @property {string} message - 탈퇴 메시지
 * @property {string} deletedUserId - 삭제된 사용자 ID
 */
export const WithdrawResponse = {
  message: String,
  deletedUserId: String,
}

/**
 * 인증 상태 타입
 * @typedef {Object} AuthState
 * @property {boolean} isAuthenticated - 인증 상태
 * @property {UserInfo|null} user - 사용자 정보
 * @property {string|null} accessToken - 액세스 토큰
 * @property {string|null} refreshToken - 리프레시 토큰
 * @property {boolean} isLoading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 */
export const AuthState = {
  isAuthenticated: Boolean,
  user: null, // UserInfo | null
  accessToken: String,
  refreshToken: String,
  isLoading: Boolean,
  error: String,
}

/**
 * 기본 인증 상태 생성 함수
 * @returns {AuthState} 기본 인증 상태
 */
export const createDefaultAuthState = () => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
})

/**
 * 인증 상태 검증 함수
 * @param {AuthState} authState - 검증할 인증 상태
 * @returns {boolean} 유효성 여부
 */
export const validateAuthState = (authState) => {
  if (!authState || typeof authState !== 'object') {
    return false
  }

  const requiredFields = ['isAuthenticated', 'isLoading']
  for (const field of requiredFields) {
    if (typeof authState[field] !== 'boolean') {
      return false
    }
  }

  return true
}

/**
 * 사용자 정보 검증 함수
 * @param {UserInfo} user - 검증할 사용자 정보
 * @returns {boolean} 유효성 여부
 */
export const validateUserInfo = (user) => {
  if (!user || typeof user !== 'object') {
    return false
  }

  const requiredFields = ['_id', 'googleId', 'email', 'name']
  for (const field of requiredFields) {
    if (!user[field] || typeof user[field] !== 'string') {
      return false
    }
  }

  return true
}

/**
 * 토큰 검증 함수
 * @param {string} token - 검증할 토큰
 * @returns {boolean} 유효성 여부
 */
export const validateToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false
  }

  // JWT 토큰 형식 검증 (기본적인 형식만 확인)
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
  return jwtPattern.test(token)
}

/**
 * 로그인 요청 검증 함수
 * @param {LoginRequest} loginRequest - 검증할 로그인 요청
 * @returns {boolean} 유효성 여부
 */
export const validateLoginRequest = (loginRequest) => {
  if (!loginRequest || typeof loginRequest !== 'object') {
    return false
  }

  if (!loginRequest.access_token || typeof loginRequest.access_token !== 'string') {
    return false
  }

  return validateToken(loginRequest.access_token)
}

/**
 * 리프레시 토큰 요청 검증 함수
 * @param {RefreshAccessTokenRequest} refreshRequest - 검증할 리프레시 요청
 * @returns {boolean} 유효성 여부
 */
export const validateRefreshRequest = (refreshRequest) => {
  if (!refreshRequest || typeof refreshRequest !== 'object') {
    return false
  }

  if (!refreshRequest.refresh_token || typeof refreshRequest.refresh_token !== 'string') {
    return false
  }

  return validateToken(refreshRequest.refresh_token)
}

/**
 * 탈퇴 요청 검증 함수
 * @param {WithdrawRequest} withdrawRequest - 검증할 탈퇴 요청
 * @returns {boolean} 유효성 여부
 */
export const validateWithdrawRequest = (withdrawRequest) => {
  if (!withdrawRequest || typeof withdrawRequest !== 'object') {
    return false
  }

  if (!withdrawRequest.profileId || typeof withdrawRequest.profileId !== 'string') {
    return false
  }

  // MongoDB ObjectId 형식 검증
  const objectIdPattern = /^[0-9a-fA-F]{24}$/
  return objectIdPattern.test(withdrawRequest.profileId)
}

/**
 * 인증 에러 타입
 * @typedef {Object} AuthError
 * @property {string} code - 에러 코드
 * @property {string} message - 에러 메시지
 * @property {string} [details] - 상세 에러 정보
 */
export const AuthError = {
  code: String,
  message: String,
  details: String,
}

/**
 * 인증 에러 코드 상수
 */
export const AUTH_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  GOOGLE_OAUTH_ERROR: 'GOOGLE_OAUTH_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  INVALID_REQUEST: 'INVALID_REQUEST',
}

/**
 * 인증 에러 메시지 생성 함수
 * @param {string} code - 에러 코드
 * @param {string} [details] - 상세 정보
 * @returns {AuthError} 인증 에러 객체
 */
export const createAuthError = (code, details = '') => ({
  code,
  message: getAuthErrorMessage(code),
  details,
})

/**
 * 에러 코드에 따른 메시지 반환 함수
 * @param {string} code - 에러 코드
 * @returns {string} 에러 메시지
 */
export const getAuthErrorMessage = (code) => {
  const messages = {
    [AUTH_ERROR_CODES.INVALID_TOKEN]: '유효하지 않은 토큰입니다.',
    [AUTH_ERROR_CODES.TOKEN_EXPIRED]: '토큰이 만료되었습니다.',
    [AUTH_ERROR_CODES.UNAUTHORIZED]: '인증이 필요합니다.',
    [AUTH_ERROR_CODES.FORBIDDEN]: '접근 권한이 없습니다.',
    [AUTH_ERROR_CODES.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
    [AUTH_ERROR_CODES.GOOGLE_OAUTH_ERROR]: 'Google 로그인 중 오류가 발생했습니다.',
    [AUTH_ERROR_CODES.USER_NOT_FOUND]: '사용자를 찾을 수 없습니다.',
    [AUTH_ERROR_CODES.PROFILE_NOT_FOUND]: '프로필을 찾을 수 없습니다.',
    [AUTH_ERROR_CODES.INVALID_REQUEST]: '잘못된 요청입니다.',
  }

  return messages[code] || '알 수 없는 오류가 발생했습니다.'
}
