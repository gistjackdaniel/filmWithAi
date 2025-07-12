import { create } from 'zustand'
import { CaptionCardType } from '../types/timeline'
import timelineService from '../services/timelineService'

/**
 * 타임라인 상태 관리 스토어
 * 캡션카드와 타임라인 관련 상태를 관리
 */
const useTimelineStore = create((set, get) => ({
  // 상태
  scenes: [],                    // 캡션카드 배열
  selectedSceneId: null,         // 선택된 씬 ID
  loading: false,                // 로딩 상태
  error: null,                   // 에러 상태
  currentProjectId: null,        // 현재 프로젝트 ID
  websocketConnection: null,     // WebSocket 연결
  filters: {                     // 필터 상태
    type: null,
    dateRange: null,
    location: null,
    character: null,
    equipment: null,
  },
  sortBy: 'scene_number',        // 정렬 기준
  modalOpen: false,              // 모달 열림 상태
  currentScene: null,            // 현재 선택된 씬

  // 액션들

  /**
   * 씬들 설정
   */
  setScenes: (scenes) => {
    set({ scenes, loading: false, error: null })
  },

  /**
   * 씬 추가
   */
  addScene: (scene) => {
    set((state) => ({
      scenes: [...state.scenes, scene]
    }))
  },

  /**
   * 씬 업데이트
   */
  updateScene: (sceneId, updates) => {
    set((state) => ({
      scenes: state.scenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updates } : scene
      )
    }))
  },

  /**
   * 씬 삭제
   */
  removeScene: (sceneId) => {
    set((state) => ({
      scenes: state.scenes.filter(scene => scene.id !== sceneId),
      selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId
    }))
  },

  /**
   * 씬 선택
   */
  selectScene: (sceneId) => {
    set({ selectedSceneId: sceneId })
  },

  /**
   * 씬 선택 해제
   */
  deselectScene: () => {
    set({ selectedSceneId: null })
  },

  /**
   * 로딩 상태 설정
   */
  setLoading: (loading) => {
    set({ loading })
  },

  /**
   * 에러 설정
   */
  setError: (error) => {
    set({ error, loading: false })
  },

  /**
   * 프로젝트 ID 설정
   */
  setCurrentProjectId: (projectId) => {
    set({ currentProjectId: projectId })
  },

  /**
   * 프로젝트 콘티 데이터 로드
   */
  loadProjectContes: async (projectId) => {
    console.log('timelineStore loadProjectContes started for projectId:', projectId)
    set({ loading: true, error: null })
    
    try {
      // 캐시된 데이터 확인
      const cachedData = timelineService.getCachedData(`project_${projectId}`)
      if (cachedData) {
        console.log('timelineStore using cached data, count:', cachedData.length)
        set({ 
          scenes: cachedData, 
          loading: false, 
          currentProjectId: projectId 
        })
        return { success: true, data: cachedData }
      }

      // API에서 데이터 가져오기
      console.log('timelineStore fetching data from API')
      const result = await timelineService.getProjectContes(projectId)
      console.log('timelineStore API result:', result)
      
      if (result.success) {
        console.log('timelineStore API success, data count:', result.data.length)
        // 캐시에 저장
        timelineService.setCachedData(`project_${projectId}`, result.data)
        
        set({ 
          scenes: result.data, 
          loading: false, 
          currentProjectId: projectId,
          error: null 
        })
        
        // 실시간 업데이트 연결
        console.log('timelineStore connecting realtime updates')
        get().connectRealtimeUpdates(projectId)
        
        return { success: true, data: result.data }
      } else {
        console.log('timelineStore API failed:', result.error)
        set({ 
          loading: false, 
          error: result.error 
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('timelineStore loadProjectContes error:', error)
      const errorMessage = '콘티 데이터를 불러오는데 실패했습니다.'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 씬 상세 정보 로드
   */
  loadSceneDetails: async (sceneId) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      const result = await timelineService.getSceneDetails(currentProjectId, sceneId)
      
      if (result.success) {
        // 현재 씬 업데이트
        set({ currentScene: result.data })
        return { success: true, data: result.data }
      } else {
        set({ error: result.error })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '씬 상세 정보를 불러오는데 실패했습니다.'
      set({ error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 씬 업데이트 (API 연동)
   */
  updateSceneWithAPI: async (sceneId, updates) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      const result = await timelineService.updateScene(currentProjectId, sceneId, updates)
      
      if (result.success) {
        // 로컬 상태 업데이트
        set((state) => ({
          scenes: state.scenes.map(scene =>
            scene.id === sceneId ? { ...scene, ...updates } : scene
          )
        }))
        
        // 캐시 업데이트
        timelineService.clearCache(`project_${currentProjectId}`)
        
        return { success: true, data: result.data }
      } else {
        set({ error: result.error })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '씬 업데이트에 실패했습니다.'
      set({ error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 씬 삭제 (API 연동)
   */
  deleteSceneWithAPI: async (sceneId) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      const result = await timelineService.deleteScene(currentProjectId, sceneId)
      
      if (result.success) {
        // 로컬 상태 업데이트
        set((state) => ({
          scenes: state.scenes.filter(scene => scene.id !== sceneId),
          selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId
        }))
        
        // 캐시 업데이트
        timelineService.clearCache(`project_${currentProjectId}`)
        
        return { success: true }
      } else {
        set({ error: result.error })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '씬 삭제에 실패했습니다.'
      set({ error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 실시간 업데이트 연결
   */
  connectRealtimeUpdates: (projectId) => {
    const { websocketConnection } = get()
    
    // 기존 연결이 있다면 닫기
    if (websocketConnection) {
      websocketConnection.close()
    }

    // 새로운 WebSocket 연결
    const ws = timelineService.connectRealtimeUpdates(projectId, (data) => {
      // 실시간 업데이트 처리
      if (data.type === 'scene_updated') {
        set((state) => ({
          scenes: state.scenes.map(scene =>
            scene.id === data.sceneId ? { ...scene, ...data.updates } : scene
          )
        }))
      } else if (data.type === 'scene_deleted') {
        set((state) => ({
          scenes: state.scenes.filter(scene => scene.id !== data.sceneId),
          selectedSceneId: state.selectedSceneId === data.sceneId ? null : state.selectedSceneId
        }))
      } else if (data.type === 'scene_created') {
        set((state) => ({
          scenes: [...state.scenes, data.scene]
        }))
      }
    })

    set({ websocketConnection: ws })
  },

  /**
   * 실시간 업데이트 연결 해제
   */
  disconnectRealtimeUpdates: () => {
    const { websocketConnection } = get()
    if (websocketConnection) {
      websocketConnection.close()
      set({ websocketConnection: null })
    }
  },

  /**
   * 필터 설정
   */
  setFilter: (filterKey, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [filterKey]: value
      }
    }))
  },

  /**
   * 모든 필터 초기화
   */
  clearFilters: () => {
    set({
      filters: {
        type: null,
        dateRange: null,
        location: null,
        character: null,
        equipment: null,
      }
    })
  },

  /**
   * 정렬 기준 설정
   */
  setSortBy: (sortBy) => {
    set({ sortBy })
  },

  /**
   * 모달 열기
   */
  openModal: (scene) => {
    set({ modalOpen: true, currentScene: scene })
  },

  /**
   * 모달 닫기
   */
  closeModal: () => {
    set({ modalOpen: false, currentScene: null })
  },

  /**
   * 필터링된 씬들 가져오기
   */
  getFilteredScenes: () => {
    const { scenes, filters, sortBy } = get()
    
    let filteredScenes = [...scenes]

    // 타입별 필터링
    if (filters.type) {
      filteredScenes = filteredScenes.filter(scene => scene.type === filters.type)
    }

    // 날짜 범위 필터링
    if (filters.dateRange) {
      filteredScenes = filteredScenes.filter(scene => {
        const sceneDate = new Date(scene.createdAt)
        return sceneDate >= filters.dateRange.start && sceneDate <= filters.dateRange.end
      })
    }

    // 장소별 필터링
    if (filters.location) {
      filteredScenes = filteredScenes.filter(scene => {
        return scene.nodes?.some(node => 
          node.type === 'location' && 
          node.value.toLowerCase().includes(filters.location.toLowerCase())
        )
      })
    }

    // 등장인물별 필터링
    if (filters.character) {
      filteredScenes = filteredScenes.filter(scene => {
        return scene.nodes?.some(node => 
          node.type === 'character' && 
          node.value.toLowerCase().includes(filters.character.toLowerCase())
        )
      })
    }

    // 장비별 필터링
    if (filters.equipment) {
      filteredScenes = filteredScenes.filter(scene => {
        return scene.nodes?.some(node => 
          node.type === 'equipment' && 
          node.value.toLowerCase().includes(filters.equipment.toLowerCase())
        )
      })
    }

    // 정렬
    switch (sortBy) {
      case 'scene_number':
        filteredScenes.sort((a, b) => 
          (a.components?.sceneNumber || a.scene) - (b.components?.sceneNumber || b.scene)
        )
        break
      case 'duration':
        filteredScenes.sort((a, b) => (a.duration || 0) - (b.duration || 0))
        break
      case 'created_at':
        filteredScenes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'type':
        filteredScenes.sort((a, b) => a.type.localeCompare(b.type))
        break
      default:
        break
    }

    return filteredScenes
  },

  /**
   * 타입별 씬 개수 가져오기
   */
  getSceneCounts: () => {
    const { scenes } = get()
    return {
      total: scenes.length,
      generatedVideo: scenes.filter(scene => scene.type === CaptionCardType.GENERATED_VIDEO).length,
      liveAction: scenes.filter(scene => scene.type === CaptionCardType.LIVE_ACTION).length,
    }
  },

  /**
   * 총 지속 시간 계산
   */
  getTotalDuration: () => {
    const { scenes } = get()
    return scenes.reduce((total, scene) => total + (scene.duration || 0), 0)
  },

  /**
   * 노드별 통계 가져오기
   */
  getNodeStats: () => {
    const { scenes } = get()
    const stats = {}

    scenes.forEach(scene => {
      scene.nodes?.forEach(node => {
        if (!stats[node.type]) {
          stats[node.type] = new Set()
        }
        stats[node.type].add(node.value)
      })
    })

    return Object.fromEntries(
      Object.entries(stats).map(([type, values]) => [type, Array.from(values)])
    )
  },

  /**
   * 씬 순서 변경
   */
  updateScenesOrder: (newScenes) => {
    set({ scenes: newScenes })
  },

  /**
   * 스케줄링 최적화 (향후 구현)
   */
  optimizeSchedule: () => {
    // TODO: 그래프 알고리즘을 사용한 스케줄링 최적화
    console.log('스케줄링 최적화 기능은 향후 구현 예정입니다.')
  }
}))

export default useTimelineStore 