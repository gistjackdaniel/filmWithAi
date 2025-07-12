import axios from 'axios'

/**
 * Axios 인스턴스 생성
 * SceneForge 백엔드 API와의 통신을 위한 HTTP 클라이언트
 * MongoDB 연동으로 사용자별 데이터 영구 저장 지원
 */
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // 백엔드 서버 URL
  timeout: 10000, // 요청 타임아웃 (10초)
  headers: {
    'Content-Type': 'application/json', // JSON 데이터 전송
  },
})

// ===== API 서비스 함수들 =====

/**
 * 사용자 관리 API
 */
export const userAPI = {
  // Google OAuth 로그인
  googleAuth: (userData) => api.post('/users/auth/google', userData),
  
  // 사용자 프로필 조회
  getProfile: () => api.get('/users/profile'),
  
  // 사용자 프로필 업데이트
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  
  // 토큰 검증
  verifyToken: () => api.get('/users/verify')
}

/**
 * 프로젝트 관리 API
 */
export const projectAPI = {
  // 프로젝트 생성
  createProject: (projectData) => api.post('/projects', projectData),
  
  // 사용자의 프로젝트 목록 조회
  getProjects: (params = {}) => api.get('/projects', { params }),
  
  // 특정 프로젝트 조회
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  
  // 프로젝트 업데이트
  updateProject: (projectId, updateData) => api.put(`/projects/${projectId}`, updateData),
  
  // 프로젝트 삭제 (소프트 삭제)
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
  
  // 프로젝트 복원
  restoreProject: (projectId) => api.put(`/projects/${projectId}/restore`),
  
  // 프로젝트 통계 조회
  getProjectStats: (projectId) => api.get(`/projects/${projectId}/stats`)
}

/**
 * 콘티 관리 API
 */
export const conteAPI = {
  // 콘티 생성
  createConte: (projectId, conteData) => api.post(`/projects/${projectId}/contes`, conteData),
  
  // 프로젝트의 콘티 목록 조회
  getContes: (projectId, params = {}) => api.get(`/projects/${projectId}/contes`, { params }),
  
  // 특정 콘티 조회
  getConte: (projectId, conteId) => api.get(`/projects/${projectId}/contes/${conteId}`),
  
  // 콘티 업데이트
  updateConte: (projectId, conteId, updateData) => api.put(`/projects/${projectId}/contes/${conteId}`, updateData),
  
  // 콘티 순서 변경
  reorderContes: (projectId, conteOrders) => api.put(`/projects/${projectId}/contes/reorder`, { conteOrders }),
  
  // 콘티 삭제
  deleteConte: (projectId, conteId) => api.delete(`/projects/${projectId}/contes/${conteId}`),
  
  // 같은 장소의 콘티들 조회
  getContesByLocation: (projectId, location) => api.get(`/projects/${projectId}/contes/location/${location}`),
  
  // 같은 날짜의 콘티들 조회
  getContesByDate: (projectId, date) => api.get(`/projects/${projectId}/contes/date/${date}`),
  
  // 같은 배우가 출연하는 콘티들 조회
  getContesByCast: (projectId, castMember) => api.get(`/projects/${projectId}/contes/cast/${castMember}`)
}

/**
 * AI 생성 API (기존)
 */
export const aiAPI = {
  // AI 스토리 생성
  generateStory: (synopsis, options = {}) => api.post('/story/generate', { synopsis, ...options }),
  
  // AI 이미지 생성
  generateImage: (sceneDescription, options = {}) => api.post('/image/generate', { sceneDescription, ...options }),
  
  // AI 콘티 생성
  generateConte: (story, options = {}) => api.post('/conte/generate', { story, ...options })
}

// ===== 요청 인터셉터 =====
// 모든 API 요청이 전송되기 전에 실행되는 미들웨어
api.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 인증 토큰 가져오기
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsedToken = JSON.parse(token)
        // Zustand persist에서 저장된 토큰이 있으면 헤더에 추가
        if (parsedToken.state?.token) {
          config.headers.Authorization = `Bearer ${parsedToken.state.token}`
        }
      } catch (error) {
        console.error('토큰 파싱 오류:', error)
      }
    }
    return config
  },
  (error) => {
    // 요청 설정 오류 시 Promise 거부
    return Promise.reject(error)
  }
)

// ===== 응답 인터셉터 =====
// 모든 API 응답이 처리되기 전에 실행되는 미들웨어
api.interceptors.response.use(
  (response) => {
    // 성공 응답은 그대로 반환
    return response
  },
  (error) => {
    // 네트워크 오류 처리
    if (!error.response) {
      console.error('Network error:', error.message)
      // 네트워크 오류 시 사용자에게 알림
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('네트워크 연결을 확인해주세요.')
      }
      return Promise.reject(new Error('네트워크 연결 오류가 발생했습니다.'))
    }

    // HTTP 상태 코드별 오류 처리
    switch (error.response.status) {
      case 401:
        // 인증 실패 시 로컬 스토리지에서 인증 정보 삭제
        localStorage.removeItem('auth-storage')
        console.log('Authentication failed, redirecting to login...')
        // 로그인 페이지로 리다이렉트
        window.location.href = '/'
        break
      
      case 403:
        console.error('Forbidden:', error.response.data)
        return Promise.reject(new Error('접근 권한이 없습니다.'))
      
      case 404:
        console.error('Not found:', error.response.data)
        return Promise.reject(new Error('요청한 리소스를 찾을 수 없습니다.'))
      
      case 500:
        console.error('Server error:', error.response.data)
        return Promise.reject(new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'))
      
      default:
        console.error('API error:', error.response.data)
        return Promise.reject(new Error(error.response.data?.message || '알 수 없는 오류가 발생했습니다.'))
    }

    return Promise.reject(error)
  }
)

export default api 