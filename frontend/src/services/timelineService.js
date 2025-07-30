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
 * 컷 데이터 관리 및 API 연동
 */
class TimelineService {
  constructor() {
    this.wsConnections = new Map()
  }

  /**
   * 프로젝트의 모든 컷 데이터를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 컷 데이터
   */
  async getProjectCuts(projectId) {
    try {
      console.log('timelineService getProjectCuts started for projectId:', projectId)
      
      // 캐시 확인
      const cacheKey = `project_cuts_${projectId}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log('timelineService using cached cuts data for projectId:', projectId)
        return { success: true, data: cached }
      }
      
      const response = await timelineAPI.get(`/project/${projectId}?includeContes=true`)
      console.log('timelineService API response:', response.data)
      
      if (response.data && response.data.success && response.data.data?.contes) {
        const contes = response.data.data.contes
        
        // 모든 컷을 하나의 배열로 수집
        const allCuts = []
        contes.forEach(conte => {
          if (conte.cuts && Array.isArray(conte.cuts)) {
            conte.cuts.forEach(cut => {
              allCuts.push({
                ...cut,
                sceneId: conte._id,
                sceneNumber: conte.scene,
                sceneTitle: conte.title
              })
            })
          }
        })
        
        console.log('timelineService all cuts loaded:', allCuts.length)
        
        // 캐시에 저장
        this.setCachedData(cacheKey, allCuts)
        
        return { success: true, data: allCuts }
      } else {
        console.error('timelineService getProjectCuts failed:', response.data)
        return { success: false, error: response.data?.message || '컷 데이터를 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getProjectCuts error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 프로젝트의 모든 씬 데이터를 가져옵니다 (스케줄러용)
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 씬 데이터
   */
  async getProjectContes(projectId) {
    try {
      console.log('timelineService getProjectContes started for projectId:', projectId)
      
      // 캐시 확인
      const cacheKey = `project_scenes_${projectId}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log('timelineService using cached scenes data for projectId:', projectId)
        return { success: true, data: cached }
      }
      
      const response = await timelineAPI.get(`/project/${projectId}?includeContes=true`)
      console.log('timelineService API response:', response.data)
      
      if (response.data && response.data.success && response.data.data?.contes) {
        const contes = response.data.data.contes
        
        // 씬 데이터 변환
        const scenes = contes.map(conte => ({
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          estimatedDuration: conte.estimatedDuration,
          duration: this.parseDurationToSeconds(conte.estimatedDuration || 30),
          imageUrl: conte.imageUrl,
          cuts: conte.cuts || [],
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt
        }))
        
        console.log('timelineService all scenes loaded:', scenes.length)
        
        // 캐시에 저장
        this.setCachedData(cacheKey, scenes)
        
        return { success: true, data: scenes }
      } else {
        console.error('timelineService getProjectContes failed:', response.data)
        return { success: false, error: response.data?.message || '씬 데이터를 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getProjectContes error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 특정 컷의 상세 정보를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} cutId - 컷 ID
   * @returns {Promise<Object>} 컷 상세 데이터
   */
  async getCutDetails(projectId, cutId) {
    try {
      console.log('timelineService getCutDetails started for projectId:', projectId, 'cutId:', cutId)
      
      const response = await timelineAPI.get(`/project/${projectId}/cuts/${cutId}`)
      console.log('timelineService getCutDetails API response:', response.data)
      
      if (response.data && response.data.success && response.data.data) {
        const cutDetails = response.data.data
        console.log('timelineService cut details loaded:', cutDetails)
        return { success: true, data: cutDetails }
      } else {
        console.error('timelineService getCutDetails failed:', response.data)
        return { success: false, error: response.data?.message || '컷 상세 정보를 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getCutDetails error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 컷 정보를 업데이트합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} cutId - 컷 ID
   * @param {Object} cutData - 업데이트할 컷 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateCut(projectId, cutId, cutData) {
    try {
      console.log('timelineService updateCut started:', { projectId, cutId, cutData })
      
      const response = await timelineAPI.put(`/project/${projectId}/cuts/${cutId}`, cutData)
      console.log('timelineService updateCut API response:', response.data)
      
      if (response.data && response.data.success) {
        // 캐시 삭제
        this.clearCache(`project_cuts_${projectId}`)
        
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data?.message || '컷 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService updateCut error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 컷을 삭제합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} cutId - 컷 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteCut(projectId, cutId) {
    try {
      console.log('timelineService deleteCut started:', { projectId, cutId })
      
      const response = await timelineAPI.delete(`/project/${projectId}/cuts/${cutId}`)
      console.log('timelineService deleteCut API response:', response.data)
      
      if (response.data && response.data.success) {
        // 캐시 삭제
        this.clearCache(`project_cuts_${projectId}`)
        
        return { success: true }
      } else {
        return { success: false, error: response.data?.message || '컷 삭제에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService deleteCut error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 새로운 컷을 생성합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @param {Object} cutData - 컷 데이터
   * @returns {Promise<Object>} 생성 결과
   */
  async createCut(projectId, sceneId, cutData) {
    try {
      console.log('timelineService createCut started:', { projectId, sceneId, cutData })
      
      const response = await timelineAPI.post(`/project/${projectId}/scene/${sceneId}/cut`, cutData)
      console.log('timelineService createCut API response:', response.data)
      
      if (response.data && response.data.success) {
        // 캐시 삭제
        this.clearCache(`project_cuts_${projectId}`)
        
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data?.message || '컷 생성에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService createCut error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 컷 순서를 변경합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @param {Array} cutOrder - 새로운 컷 순서 배열
   * @returns {Promise<Object>} 순서 변경 결과
   */
  async reorderCuts(projectId, sceneId, cutOrder) {
    try {
      console.log('timelineService reorderCuts started:', { projectId, sceneId, cutOrder })
      
      const response = await timelineAPI.put(`/project/${projectId}/scene/${sceneId}/cut/reorder`, {
        cutOrder
      })
      console.log('timelineService reorderCuts API response:', response.data)
      
      if (response.data && response.data.success) {
        // 캐시 삭제
        this.clearCache(`project_cuts_${projectId}`)
        
        return { success: true, data: response.data.data }
      } else {
        return { success: false, error: response.data?.message || '컷 순서 변경에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService reorderCuts error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 실시간 업데이트를 위한 WebSocket 연결을 설정합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {Function} onUpdate - 업데이트 콜백 함수
   * @returns {WebSocket} WebSocket 인스턴스
   */
  connectRealtimeUpdates(projectId, onUpdate) {
    // WebSocket URL을 올바른 경로로 수정
    const wsUrl = `ws://localhost:5001/ws/timeline/projects/${projectId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('🔌 타임라인 실시간 연결 성공 - 프로젝트:', projectId)
      
      // 연결 후 구독 메시지 전송
      ws.send(JSON.stringify({
        type: 'subscribe_updates',
        projectId: projectId
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 실시간 업데이트 수신:', data)
        onUpdate(data)
      } catch (error) {
        console.error('❌ 실시간 데이터 파싱 실패:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket 에러:', error)
      // 에러 발생 시 연결을 닫아서 무한 재연결 방지
      ws.close()
    }

    ws.onclose = (event) => {
      console.log('🔌 타임라인 실시간 연결 종료:', event.code, event.reason)
      // 정상적인 종료가 아닌 경우에만 재연결 시도
      if (event.code !== 1000) {
        console.log('⚠️ 비정상 종료로 인한 재연결 시도 중...')
        // 3초 후 재연결 시도
        setTimeout(() => {
          this.connectRealtimeUpdates(projectId, onUpdate)
        }, 3000)
      }
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

  /**
   * 시간 문자열을 초 단위로 변환합니다.
   * @param {string} duration - 시간 문자열 (예: "1h 30m", "2h", "30m")
   * @returns {number} 초 단위 시간
   */
  parseDurationToSeconds(duration) {
    if (!duration) return 0;
    const parts = duration.match(/(\d+)([hms])/g);
    let totalSeconds = 0;
    if (parts) {
      parts.forEach(part => {
        const value = parseInt(part.slice(0, -1), 10);
        const unit = part.slice(-1);
        switch (unit) {
          case 'h':
            totalSeconds += value * 3600;
            break;
          case 'm':
            totalSeconds += value * 60;
            break;
          case 's':
            totalSeconds += value;
            break;
        }
      });
    }
    return totalSeconds;
  }
}

// 싱글톤 인스턴스 생성
const timelineService = new TimelineService()

export default timelineService 