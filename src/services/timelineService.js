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
  async (error) => {
    if (error.response?.status === 401) {
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
          return timelineAPI(originalRequest)
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
   * 시간 문자열을 초 단위로 변환하는 함수
   * @param {string} duration - 시간 문자열 (예: "5분", "2분 30초")
   * @returns {number} 초 단위 시간
   */
  parseDurationToSeconds(duration) {
    if (!duration) {
      return 300 // 기본 5분
    }
    
    const match = duration.match(/(\d+)분\s*(\d+)?초?/)
    if (match) {
      const minutes = parseInt(match[1]) || 0
      const seconds = parseInt(match[2]) || 0
      return minutes * 60 + seconds
    }
    
    // 숫자만 있는 경우 분으로 간주
    const numMatch = duration.match(/(\d+)/)
    if (numMatch) {
      const minutes = parseInt(numMatch[1])
      return minutes * 60
    }
    
    return 300 // 기본 5분
  }

  /**
   * 이미지 URL을 백엔드 서버 URL로 변환
   * @param {string} imageUrl - 원본 이미지 URL
   * @returns {string} 변환된 이미지 URL
   */
  convertImageUrl(imageUrl) {
    if (!imageUrl) return null
    
    // 이미 전체 URL인 경우 그대로 반환
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    
    // 상대 경로인 경우 백엔드 서버 URL로 변환
    if (imageUrl.startsWith('/uploads/')) {
      return `http://localhost:5001${imageUrl}`
    }
    
    return imageUrl
  }

  /**
   * 프로젝트의 콘티 데이터를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 콘티 데이터
   */
  async getProjectContes(projectId) {
    try {
      console.log('timelineService getProjectContes started for projectId:', projectId)
      const response = await timelineAPI.get(`/projects/${projectId}?includeContes=true`)
      console.log('timelineService API response:', response.data)
      
      // 백엔드 응답 구조에 맞게 수정
      const conteList = response.data.data?.conteList || []
      console.log('timelineService conteList extracted:', conteList, 'count:', conteList.length)
      
      // 콘티 데이터를 타임라인 형식으로 변환
      const timelineScenes = conteList.map(conte => ({
        id: conte.id || conte._id,
        scene: conte.scene,
        title: conte.title,
        description: conte.description,
        dialogue: conte.dialogue,
        cameraAngle: conte.cameraAngle,
        cameraWork: conte.cameraWork,
        characterLayout: conte.characterLayout,
        props: conte.props,
        weather: conte.weather,
        lighting: conte.lighting,
        visualDescription: conte.visualDescription,
        transition: conte.transition,
        lensSpecs: conte.lensSpecs,
        visualEffects: conte.visualEffects,
        type: conte.type || 'live_action',
        estimatedDuration: conte.estimatedDuration || '5분',
        duration: this.parseDurationToSeconds(conte.estimatedDuration || '5분'),
        imageUrl: this.convertImageUrl(conte.imageUrl),
        keywords: conte.keywords || {},
        weights: conte.weights || {},
        order: conte.order || conte.scene,
        status: conte.status || 'active',
        canEdit: conte.canEdit !== false,
        lastModified: conte.lastModified,
        modifiedBy: conte.modifiedBy,
        createdAt: conte.createdAt,
        updatedAt: conte.updatedAt
      }))
      
      console.log('timelineService timelineScenes converted:', timelineScenes.length, 'scenes')
      
      return {
        success: true,
        data: timelineScenes,
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
      console.log('timelineService getSceneDetails started for projectId:', projectId, 'sceneId:', sceneId)
      
      // 백엔드 API에서 특정 콘티 조회
      const response = await timelineAPI.get(`/projects/${projectId}/contes/${sceneId}`)
      console.log('timelineService getSceneDetails API response:', response.data)
      
      if (response.data.success && response.data.data?.conte) {
        const conte = response.data.data.conte
        
        // 콘티 데이터를 타임라인 형식으로 변환
        const sceneDetails = {
          id: conte.id || conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          dialogue: conte.dialogue,
          cameraAngle: conte.cameraAngle,
          cameraWork: conte.cameraWork,
          characterLayout: conte.characterLayout,
          props: conte.props,
          weather: conte.weather,
          lighting: conte.lighting,
          visualDescription: conte.visualDescription,
          transition: conte.transition,
          lensSpecs: conte.lensSpecs,
          visualEffects: conte.visualEffects,
          type: conte.type || 'live_action',
          estimatedDuration: conte.estimatedDuration || '5분',
          duration: this.parseDurationToSeconds(conte.estimatedDuration || '5분'),
          imageUrl: this.convertImageUrl(conte.imageUrl),
          imagePrompt: conte.imagePrompt,
          imageGeneratedAt: conte.imageGeneratedAt,
          imageModel: conte.imageModel,
          isFreeTier: conte.isFreeTier,
          keywords: conte.keywords || {},
          weights: conte.weights || {},
          order: conte.order || conte.scene,
          status: conte.status || 'draft',
          canEdit: conte.canEdit !== false,
          lastModified: conte.lastModified,
          modifiedBy: conte.modifiedBy,
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt,
          project: conte.project
        }
        
        console.log('timelineService sceneDetails converted:', sceneDetails)
        
        return {
          success: true,
          data: sceneDetails,
          error: null
        }
      } else {
        return {
          success: false,
          data: null,
          error: response.data.message || '씬을 찾을 수 없습니다.'
        }
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
    try {
      // WebSocket URL 설정
      const wsUrl = `ws://localhost:5001/ws/timeline/projects/${projectId}`
      console.log('🔌 WebSocket 연결 시도:', wsUrl)
      
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ 타임라인 실시간 연결 성공')
        
        // 구독 메시지 전송
        ws.send(JSON.stringify({
          type: 'subscribe_updates',
          projectId: projectId
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 실시간 업데이트 수신:', data)
          
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate(data)
          }
        } catch (error) {
          console.error('❌ 실시간 데이터 파싱 실패:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error)
        
        // 에러 발생 시 3초 후 재연결 시도
        setTimeout(() => {
          console.log('🔄 WebSocket 재연결 시도...')
          this.connectRealtimeUpdates(projectId, onUpdate)
        }, 3000)
      }

      ws.onclose = (event) => {
        console.log('🔌 타임라인 실시간 연결 종료:', event.code, event.reason)
        
        // 정상 종료가 아닌 경우 재연결 시도
        if (event.code !== 1000) {
          console.log('🔄 WebSocket 재연결 시도...')
          setTimeout(() => {
            this.connectRealtimeUpdates(projectId, onUpdate)
          }, 3000)
        }
      }

      return ws
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error)
      
      // 에러 발생 시 3초 후 재시도
      setTimeout(() => {
        console.log('🔄 WebSocket 재연결 시도...')
        this.connectRealtimeUpdates(projectId, onUpdate)
      }, 3000)
      
      // 에러 발생 시 더미 객체 반환
      const dummyWs = {
        close: () => console.log('더미 WebSocket 연결 종료'),
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null
      }
      
      return dummyWs
    }
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