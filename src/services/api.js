import axios from 'axios'

/**
 * Axios 인스턴스 생성
 * SceneForge 백엔드 API와의 통신을 위한 HTTP 클라이언트
 * MongoDB 연동으로 사용자별 데이터 영구 저장 지원
 */
const api = axios.create({
  baseURL: 'http://localhost:5001/api', // 백엔드 서버 URL
  timeout: 60000, // 요청 타임아웃 (60초) - LLM 처리 시간 고려
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

/**
 * 컷 관리 API
 */
export const cutAPI = {
  // 씬에서 컷 생성
  generateCuts: (sceneData) => api.post('/cuts/generate', { sceneData }, { timeout: 120000 }), // 2분 타임아웃
  
  // 컷 목록 조회
  getCuts: (projectId, conteId, params = {}) => api.get(`/projects/${projectId}/contes/${conteId}/cuts`, { params }),
  
  // 특정 컷 조회
  getCut: (projectId, conteId, cutId) => api.get(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`),
  
  // 컷 업데이트
  updateCut: (projectId, conteId, cutId, updateData) => api.put(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`, updateData),
  
  // 컷 삭제
  deleteCut: (projectId, conteId, cutId) => api.delete(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`),
  
  // 컷 순서 변경
  reorderCuts: (projectId, conteId, cutOrders) => api.put(`/projects/${projectId}/contes/${conteId}/cuts/reorder`, { cutOrders }),
  
  // 컷 타입별 조회
  getCutsByType: (projectId, conteId, cutType) => api.get(`/projects/${projectId}/contes/${conteId}/cuts/type/${cutType}`),
  
  // 같은 시공간의 컷들 조회
  getCutsBySpacetime: (projectId, conteId, spacetime) => api.get(`/projects/${projectId}/contes/${conteId}/cuts/spacetime/${spacetime}`)
}

export const realLocationAPI = {
  getRealLocations: (projectId, params = {}) => api.get(`/projects/${projectId}/realLocations`, { params })
};

// ===== 요청 인터셉터 =====
// 모든 API 요청이 전송되기 전에 실행되는 미들웨어
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API 요청 시작:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
      params: config.params,
      timeout: config.timeout
    })
    
    // 먼저 세션 스토리지에서 토큰 확인
    let token = sessionStorage.getItem('auth-token')
    
    // 세션 스토리지에 없으면 로컬 스토리지에서 확인
    if (!token) {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const parsedToken = JSON.parse(authStorage)
          if (parsedToken.state?.token) {
            token = parsedToken.state.token
            // 세션 스토리지에도 저장
            sessionStorage.setItem('auth-token', token)
          }
        } catch (error) {
          console.error('토큰 파싱 오류:', error)
        }
      }
    }
    
    // 토큰이 있으면 헤더에 추가
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 인증 토큰 추가됨:', token.substring(0, 20) + '...')
    } else {
      console.warn('⚠️ 인증 토큰이 없습니다.')
    }
    
    return config
  },
  (error) => {
    console.error('❌ API 요청 설정 오류:', error)
    // 요청 설정 오류 시 Promise 거부
    return Promise.reject(error)
  }
)

// ===== 응답 인터셉터 =====
// 모든 API 응답이 처리되기 전에 실행되는 미들웨어
api.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      headers: response.headers,
      data: response.data,
      responseTime: response.headers['x-response-time'] || 'N/A'
    })
    
    // 응답 데이터 구조 분석
    if (response.data) {
      console.log('📊 응답 데이터 구조 분석:', {
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        keys: typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
        dataLength: Array.isArray(response.data) ? response.data.length : 
                   typeof response.data === 'string' ? response.data.length : 'N/A'
      })
      
      // 배열인 경우 첫 번째 항목 구조 분석
      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log('📋 배열 첫 번째 항목 구조:', {
          itemType: typeof response.data[0],
          itemKeys: typeof response.data[0] === 'object' ? Object.keys(response.data[0]) : 'N/A',
          sampleData: response.data[0]
        })
      }
    }
    
    // 성공 응답은 그대로 반환
    return response
  },
  async (error) => {
    console.error('❌ API 응답 오류:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      responseHeaders: error.response?.headers
    })
    
    // 네트워크 오류 처리
    if (!error.response) {
      console.error('🌐 네트워크 오류:', error.message)
      // 네트워크 오류 시 사용자에게 알림
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('네트워크 연결을 확인해주세요.')
      }
      return Promise.reject(new Error('네트워크 연결 오류가 발생했습니다.'))
    }

    // HTTP 상태 코드별 오류 처리
    switch (error.response.status) {
      case 401:
        console.log('🔐 401 인증 오류 발생. 인증 상태 갱신 시도...')
        
        try {
          // 인증 스토어에서 강제 갱신 시도
          const { useAuthStore } = await import('../stores/authStore')
          const authStore = useAuthStore.getState()
          const result = await authStore.forceAuthRefresh()
          
          if (result.success) {
            console.log('✅ 인증 상태 갱신 성공. 요청 재시도...')
            // 원래 요청을 다시 시도
            const originalRequest = error.config
            return api(originalRequest)
          } else {
            console.log('❌ 인증 상태 갱신 실패. 로그인 페이지로 이동...')
            // 로그인 페이지로 리다이렉트
            window.location.href = '/'
          }
        } catch (refreshError) {
          console.error('❌ 인증 갱신 중 오류:', refreshError)
          // 로그인 페이지로 리다이렉트
          window.location.href = '/'
        }
        break
      
      case 403:
        console.error('🚫 Forbidden:', error.response.data)
        return Promise.reject(new Error('접근 권한이 없습니다.'))
      
      case 404:
        console.error('🔍 Not found:', error.response.data)
        return Promise.reject(new Error('요청한 리소스를 찾을 수 없습니다.'))
      
      case 500:
        console.error('💥 Server error:', error.response.data)
        return Promise.reject(new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'))
      
      default:
        console.error('⚠️ API error:', error.response.data)
        return Promise.reject(new Error(error.response.data?.message || '알 수 없는 오류가 발생했습니다.'))
    }

    return Promise.reject(error)
  }
)

export default api 