import timelineAPI from './api'

/**
 * 타임라인 서비스 클래스
 * 프로젝트의 씬과 컷 데이터를 관리하고 타임라인 형식으로 변환
 */
class TimelineService {
  constructor() {
    this.cache = new Map()
    this.wsConnections = new Map()
  }

  /**
   * 지속 시간을 초 단위로 파싱합니다
   * @param {string|number} duration - 지속 시간 (예: "5초", "2분 30초", 5)
   * @returns {number} 초 단위 지속 시간
   */
  parseDurationToSeconds(duration) {
    if (typeof duration === 'number') {
      return duration
    }
    
    if (typeof duration === 'string') {
      // "5초", "2분 30초" 등의 형식 파싱
      const minutes = duration.match(/(\d+)분/)
      const seconds = duration.match(/(\d+)초/)
      
      let totalSeconds = 0
      if (minutes) {
        totalSeconds += parseInt(minutes[1]) * 60
      }
      if (seconds) {
        totalSeconds += parseInt(seconds[1])
      }
      
      return totalSeconds || 5 // 기본값 5초
    }
    
    return 5 // 기본값
  }

  /**
   * 이미지 URL을 변환합니다
   * @param {string} imageUrl - 원본 이미지 URL
   * @returns {string} 변환된 이미지 URL
   */
  convertImageUrl(imageUrl) {
    if (!imageUrl) {
      return '/placeholder-image.png'
    }
    
    // 상대 경로인 경우 백엔드 URL 추가
    if (imageUrl.startsWith('/')) {
      return `http://localhost:5001${imageUrl}`
    }
    
    // 이미 전체 URL인 경우 그대로 반환
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }
    
    // 기본 placeholder 이미지 반환
    return '/placeholder-image.png'
  }

  /**
   * 컷 데이터를 타임라인 형식으로 변환하는 공통 함수
   * @param {Object} cut - 원본 컷 데이터
   * @returns {Object} 변환된 컷 데이터
   */
  transformCutData(cut) {
    const duration = this.parseDurationToSeconds(cut.estimatedDuration || cut.duration || 5)
    
    return {
      id: cut._id || cut.id,
      cutId: cut.cutId,
      cutNumber: cut.cutNumber || cut.shotNumber,
      shotNumber: cut.shotNumber,
      title: cut.title,
      description: cut.description,
      shotSize: cut.shotSize || cut.shootingPlan?.shotSize || '',
      angleDirection: cut.angleDirection || cut.shootingPlan?.angleDirection || '',
      cameraMovement: cut.cameraMovement || cut.shootingPlan?.cameraMovement || '',
      lensSpecs: cut.lensSpecs || cut.shootingPlan?.lensSpecs || '',
      lighting: cut.lighting || cut.shootingConditions?.lighting || '',
      lightingSetup: cut.lightingSetup || cut.shootingConditions?.lightingSetup || {},
      weather: cut.weather || cut.shootingConditions?.weather || '',
      timeOfDay: cut.timeOfDay || cut.shootingConditions?.timeOfDay || '',
      visualEffects: cut.visualEffects,
      characters: cut.characters,
      dialogue: cut.dialogue,
      narration: cut.narration,
      characterMovement: cut.characterMovement,
      equipment: cut.equipment,
      requiredPersonnel: cut.requiredPersonnel,
      requiredEquipment: cut.requiredEquipment,
      aiGenerated: cut.aiGenerated,
      aiVideoUrl: cut.aiVideoUrl,
      aiObjects: cut.aiObjects,
      premiereMetadata: cut.premiereMetadata,
      startTime: cut.startTime,
      endTime: cut.endTime,
      totalDuration: cut.totalDuration,
      estimatedDuration: cut.estimatedDuration,
      duration: duration,
      imageUrl: this.convertImageUrl(cut.imageUrl || cut.output?.imageUrl),
      order: cut.order,
      status: cut.status,
      createdAt: cut.createdAt,
      updatedAt: cut.updatedAt,
      // 씬 정보 추가
      sceneId: cut.sceneId || cut.conteId,
      sceneNumber: cut.sceneNumber || cut.scene,
      sceneTitle: cut.sceneTitle || cut.sceneName,
      // 추가 상세 정보들
      shootingPlan: cut.shootingPlan,
      productionMethod: cut.productionMethod,
      shootingConditions: cut.shootingConditions,
      metadata: cut.metadata,
      canEdit: cut.canEdit,
      lastModified: cut.lastModified,
      modifiedBy: cut.modifiedBy,
      // VFX/CG 관련 필드들
      vfxEffects: cut.vfxEffects,
      soundEffects: cut.soundEffects,
      composition: cut.composition,
      dialogue: cut.dialogue,
      directorNotes: cut.directorNotes
    }
  }

  /**
   * 씬 데이터를 타임라인 형식으로 변환하는 공통 함수
   * @param {Object} conte - 원본 씬 데이터
   * @returns {Object} 변환된 씬 데이터
   */
  transformConteData(conte) {
    console.log('🔍 콘티 컷 조회:', {
      conteId: conte._id,
      scene: conte.scene,
      title: conte.title
    })
    
    // 컷 데이터 변환 함수
    const transformCuts = (cuts, conte) => {
      if (!cuts || !Array.isArray(cuts)) {
        console.log('🔍 컷 조회 결과:', {
          conteId: conte._id,
          cutsFound: 0,
          cuts: []
        })
        return []
      }
      
      const transformedCuts = cuts.map(cut => this.transformCutData(cut))
      
      console.log('🔍 컷 조회 결과:', {
        conteId: conte._id,
        cutsFound: transformedCuts.length,
        cuts: transformedCuts
      })
      
      return transformedCuts
    }
    
        return {
      id: conte._id,
      scene: conte.scene,
      title: conte.title,
      description: conte.description,
      duration: this.parseDurationToSeconds(conte.estimatedDuration || 30),
      cuts: transformCuts(conte.cuts, conte),
      createdAt: conte.createdAt,
      updatedAt: conte.updatedAt
    }
  }

  /**
   * 프로젝트의 모든 컷을 가져옵니다 (타임라인용)
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
      
      // 백엔드 API에서 프로젝트 전체 데이터 조회 (컷 포함)
      const response = await timelineAPI.get(`/projects/${projectId}?includeContes=true`)
      console.log('timelineService getProjectCuts API response:', response.data)
      
      if (response.data && response.data.success && response.data.data) {
        const projectData = response.data.data
        const conteList = projectData.conteList || []
        
        // 모든 씬의 컷을 수집
        const allCuts = []
        conteList.forEach((conte, sceneIndex) => {
          if (conte.cuts && Array.isArray(conte.cuts)) {
            conte.cuts.forEach((cut, cutIndex) => {
              allCuts.push({
                ...cut,
                sceneId: conte.id,
                sceneIndex: sceneIndex,
                sceneTitle: conte.title,
                sceneNumber: conte.scene,
                globalIndex: allCuts.length,
                isLastCutInScene: cutIndex === conte.cuts.length - 1
              })
            })
          }
        })
        
        // 컷 데이터를 타임라인 형식으로 변환
        const transformedCuts = allCuts.map(cut => this.transformCutData(cut))
        
        console.log('timelineService project cuts loaded:', transformedCuts.length, 'cuts')
        
        // 캐시에 저장
        this.setCachedData(cacheKey, transformedCuts)
        
        return { success: true, data: transformedCuts }
      } else {
        console.error('timelineService getProjectCuts failed:', response.data)
        return { success: false, error: response.data?.message || '프로젝트 컷을 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getProjectCuts error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 프로젝트의 모든 씬을 가져옵니다 (스케줄러용)
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 씬 데이터
   */
  async getProjectContes(projectId) {
    try {
      console.log('timelineService getProjectContes started for projectId:', projectId)
      
      // 캐시 확인
      const cacheKey = `project_contes_${projectId}`
      const cached = this.getCachedData(cacheKey)
      if (cached) {
        console.log('timelineService using cached contes data for projectId:', projectId)
        return { success: true, data: cached }
      }
      
      // 백엔드 API에서 프로젝트 씬 조회
      const response = await timelineAPI.get(`/projects/${projectId}?includeContes=true`)
      console.log('timelineService getProjectContes API response:', response.data)
      
      if (response.data && response.data.success && response.data.data?.contes) {
        const contes = response.data.data.contes
        
        // 씬 데이터를 타임라인 형식으로 변환
        const transformedContes = contes.map(conte => this.transformConteData(conte))
        
        console.log('timelineService project contes loaded:', transformedContes.length, 'contes')
        
        // 캐시에 저장
        this.setCachedData(cacheKey, transformedContes)
        
        return { success: true, data: transformedContes }
      } else {
        console.error('timelineService getProjectContes failed:', response.data)
        return { success: false, error: response.data?.message || '프로젝트 씬을 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getProjectContes error:', error)
      return { success: false, error: this.handleError(error) }
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
      
      const response = await timelineAPI.get(`/projects/${projectId}/contes/${sceneId}`)
      console.log('timelineService getSceneDetails API response:', response.data)
      
      if (response.data.success && response.data.data?.conte) {
        const conte = response.data.data.conte
        
        const sceneDetails = {
          id: conte._id,
          scene: conte.scene,
          title: conte.title,
          description: conte.description,
          duration: this.parseDurationToSeconds(conte.estimatedDuration || 30),
          cuts: conte.cuts ? conte.cuts.map(cut => ({
            id: cut._id,
            cutId: cut.cutId,
            cutNumber: cut.cutNumber || cut.shotNumber,
            shotNumber: cut.shotNumber,
            title: cut.title,
            description: cut.description,
            duration: this.parseDurationToSeconds(cut.estimatedDuration || 5),
            imageUrl: this.convertImageUrl(cut.imageUrl || cut.output?.imageUrl)
          })) : [],
          createdAt: conte.createdAt,
          updatedAt: conte.updatedAt
        }
        
        console.log('timelineService scene details loaded:', sceneDetails)
        return { success: true, data: sceneDetails }
      } else {
        console.error('timelineService getSceneDetails failed:', response.data)
        return { success: false, error: response.data.message || '씬 상세 정보를 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getSceneDetails error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 씬을 업데이트합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} sceneId - 씬 ID
   * @param {Object} sceneData - 업데이트할 씬 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateScene(projectId, sceneId, sceneData) {
    try {
      console.log('timelineService updateScene started:', { projectId, sceneId, sceneData })
      
      const response = await timelineAPI.put(`/projects/${projectId}/contes/${sceneId}`, sceneData)
      console.log('timelineService updateScene API response:', response.data)
      
      if (response.data.success) {
        console.log('timelineService scene updated successfully')
        return { success: true, data: response.data.data }
      } else {
        console.error('timelineService updateScene failed:', response.data)
        return { success: false, error: response.data.message || '씬 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService updateScene error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 컷을 업데이트합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} cutId - 컷 ID
   * @param {Object} cutData - 업데이트할 컷 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  async updateCut(projectId, cutId, cutData) {
    try {
      console.log('timelineService updateCut started:', { projectId, cutId, cutData })
      
      const response = await timelineAPI.put(`/projects/${projectId}/cuts/${cutId}`, cutData)
      console.log('timelineService updateCut API response:', response.data)
      
      if (response.data.success) {
        console.log('timelineService cut updated successfully')
        return { success: true, data: response.data.data }
      } else {
        console.error('timelineService updateCut failed:', response.data)
        return { success: false, error: response.data.message || '컷 업데이트에 실패했습니다.' }
      }
    } catch (error) {
      console.error('timelineService updateCut error:', error)
      return { success: false, error: this.handleError(error) }
    }
  }

  /**
   * 실시간 업데이트를 위한 WebSocket 연결을 설정합니다
   * @param {string} projectId - 프로젝트 ID
   * @param {Function} onUpdate - 업데이트 콜백 함수
   * @returns {WebSocket} WebSocket 연결 객체
   */
  connectRealtimeUpdates(projectId, onUpdate) {
    try {
      console.log('🔌 WebSocket 연결 시도:', projectId)
      
      // 기존 연결이 있으면 닫기
      if (this.wsConnections.has(projectId)) {
        const existingWs = this.wsConnections.get(projectId)
        existingWs.close()
        this.wsConnections.delete(projectId)
      }
      
      // WebSocket 연결 생성
      const wsUrl = `ws://localhost:5001/ws/projects/${projectId}`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공:', projectId)
        this.wsConnections.set(projectId, ws)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket 메시지 수신:', data)
          
          if (onUpdate && typeof onUpdate === 'function') {
            onUpdate(data)
          }
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 실패:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error)
      }
      
      ws.onclose = () => {
        console.log('🔌 WebSocket 연결 종료:', projectId)
        this.wsConnections.delete(projectId)
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
   * 특정 컷의 상세 정보를 가져옵니다
   * @param {string} projectId - 프로젝트 ID
   * @param {string} cutId - 컷 ID
   * @returns {Promise<Object>} 컷 상세 데이터
   */
  async getCutDetails(projectId, cutId) {
    try {
      console.log('timelineService getCutDetails started for projectId:', projectId, 'cutId:', cutId)
      
      // 백엔드 API에서 특정 컷 조회
      const response = await timelineAPI.get(`/projects/${projectId}/cuts/${cutId}`)
      console.log('timelineService getCutDetails API response:', response.data)
      
      if (response.data.success && response.data.data?.cut) {
        const cut = response.data.data.cut
        
        // 컷 데이터를 타임라인 형식으로 변환
        const cutDetails = this.transformCutData(cut)
        
        console.log('timelineService cut details loaded:', cutDetails)
        return { success: true, data: cutDetails }
      } else {
        console.error('timelineService getCutDetails failed:', response.data)
        return { success: false, error: response.data.message || '컷 상세 정보를 불러올 수 없습니다.' }
      }
    } catch (error) {
      console.error('timelineService getCutDetails error:', error)
      return { success: false, error: this.handleError(error) }
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