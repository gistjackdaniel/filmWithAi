import axios from 'axios'

/**
 * Axios 인스턴스 생성
 * SceneForge 백엔드 API와의 통신을 위한 HTTP 클라이언트
 */
const api = axios.create({
  baseURL: '/api', // API 기본 URL (Vite 프록시 설정과 연동)
  timeout: 10000, // 요청 타임아웃 (10초)
  headers: {
    'Content-Type': 'application/json', // JSON 데이터 전송
  },
})

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
    // 401 Unauthorized 오류 처리
    if (error.response?.status === 401) {
      // 인증 실패 시 로컬 스토리지에서 인증 정보 삭제
      localStorage.removeItem('auth-storage')
      // 로그인 페이지로 리다이렉트
      window.location.href = '/'
    }
    // 오류를 Promise로 거부하여 컴포넌트에서 처리할 수 있도록 함
    return Promise.reject(error)
  }
)

export default api 