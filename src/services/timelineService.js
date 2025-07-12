import axios from 'axios'

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

// axios 인스턴스 생성
const timelineAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 토큰 추가
timelineAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
timelineAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * 타임라인 서비스 클래스
 * 프로젝트 콘티 데이터 관리 및 API 연동
 */
class TimelineService {
  /**
   * 프로젝트의 콘티 데이터를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 콘티 데이터
   */
  async getProjectContes(projectId) {
    try {
      const response = await timelineAPI.get(`/projects/${projectId}`)
      return {
        success: true,
        data: response.data.project?.conteList || [],
        error: null
      }
    } catch (error) {
      console.error('콘티 데이터 가져오기 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 특정 씬의 상세 정보를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @returns {Promise<Object>} 씬 상세 데이터
   */
  async getSceneDetails(projectId, sceneId) {
    try {
      const response = await timelineAPI.get(`/projects/${projectId}`)
      const project = response.data.project
      const scene = project?.conteList?.find(scene => scene.id === sceneId || scene.scene === sceneId)
      
      if (!scene) {
        return {
          success: false,
          data: null,
          error: '씬을 찾을 수 없습니다.'
        }
      }
      
      return {
        success: true,
        data: scene,
        error: null
      }
    } catch (error) {
      console.error('씬 상세 정보 가져오기 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 씬 정보를 업데이트합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @param {Object} sceneData - 업데이트할 씬 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateScene(projectId, sceneId, sceneData) {
    try {
      const response = await timelineAPI.put(`/projects/${projectId}/scenes/${sceneId}`, sceneData)
      return {
        success: true,
        data: response.data,
        error: null
      }
    } catch (error) {
      console.error('씬 업데이트 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 씬을 삭제합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteScene(projectId, sceneId) {
    try {
      await timelineAPI.delete(`/projects/${projectId}/scenes/${sceneId}`)
      return {
        success: true,
        data: null,
        error: null
      }
    } catch (error) {
      console.error('씬 삭제 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 새로운 씬을 생성합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} sceneData - 씬 데이터
   * @returns {Promise<Object>} 생성 결과
   */
  async createScene(projectId, sceneData) {
    try {
      const response = await timelineAPI.post(`/projects/${projectId}/scenes`, sceneData)
      return {
        success: true,
        data: response.data,
        error: null
      }
    } catch (error) {
      console.error('씬 생성 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 씬 순서를 변경합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {Array} sceneOrder - 새로운 씬 순서 배열
   * @returns {Promise<Object>} 순서 변경 결과
   */
  async reorderScenes(projectId, sceneOrder) {
    try {
      const response = await timelineAPI.put(`/projects/${projectId}/contes/reorder`, {
        conteList: sceneOrder
      })
      return {
        success: true,
        data: response.data,
        error: null
      }
    } catch (error) {
      console.error('씬 순서 변경 실패:', error)
      return {
        success: false,
        data: null,
        error: this.handleError(error)
      }
    }
  }

  /**
   * 실시간 업데이트를 위한 WebSocket 연결을 설정합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {Function} onUpdate - 업데이트 콜백 함수
   * @returns {WebSocket} WebSocket 인스턴스
   */
  connectRealtimeUpdates(projectId, onUpdate) {
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/timeline/projects/${projectId}/updates`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('타임라인 실시간 연결 성공')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onUpdate(data)
      } catch (error) {
        console.error('실시간 데이터 파싱 실패:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket 에러:', error)
    }

    ws.onclose = () => {
      console.log('타임라인 실시간 연결 종료')
    }

    return ws
  }

  /**
   * 에러를 사용자 친화적인 메시지로 변환합니다
   * @param {Error} error - 에러 객체
   * @returns {string} 사용자 친화적인 에러 메시지
   */
  handleError(error) {
    if (error.response) {
      // 서버 응답이 있는 경우
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          return data.message || '잘못된 요청입니다.'
        case 401:
          return '인증이 필요합니다. 다시 로그인해주세요.'
        case 403:
          return '접근 권한이 없습니다.'
        case 404:
          return '요청한 데이터를 찾을 수 없습니다.'
        case 500:
          return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        default:
          return data.message || '알 수 없는 오류가 발생했습니다.'
      }
    } else if (error.request) {
      // 네트워크 오류
      return '네트워크 연결을 확인해주세요.'
    } else {
      // 기타 오류
      return error.message || '알 수 없는 오류가 발생했습니다.'
    }
  }

  /**
   * 캐시된 데이터를 가져옵니다
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터
   */
  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`timeline_cache_${key}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        const cacheAge = 5 * 60 * 1000 // 5분

        if (now - timestamp < cacheAge) {
          return data
        }
      }
      return null
    } catch (error) {
      console.error('캐시 데이터 읽기 실패:', error)
      return null
    }
  }

  /**
   * 데이터를 캐시에 저장합니다
   * @param {string} key - 캐시 키
   * @param {Object} data - 저장할 데이터
   */
  setCachedData(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(`timeline_cache_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.error('캐시 데이터 저장 실패:', error)
    }
  }

  /**
   * 캐시를 삭제합니다
   * @param {string} key - 캐시 키
   */
  clearCache(key) {
    try {
      localStorage.removeItem(`timeline_cache_${key}`)
    } catch (error) {
      console.error('캐시 삭제 실패:', error)
    }
  }
}

// 싱글톤 인스턴스 생성
const timelineService = new TimelineService()

export default timelineService 