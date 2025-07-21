import { create } from 'zustand'
import { SceneType } from '../types/conte'
import timelineService from '../services/timelineService'
import { cutAPI } from '../services/api'
import { useAuthStore } from './authStore'

/**
 * 타임라인 상태 관리 스토어
 * 컷 데이터와 타임라인 관련 상태를 관리 (씬 기능도 유지)
 */
const useTimelineStore = create((set, get) => ({
  // 상태
  cuts: [],                      // 컷 배열 (타임라인용)
  scenes: [],                    // 씬 배열 (스케줄러용)
  selectedCutId: null,           // 선택된 컷 ID
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
  sortBy: 'cut_number',          // 정렬 기준
  modalOpen: false,              // 모달 열림 상태
  currentCut: null,              // 현재 선택된 컷
  currentScene: null,            // 현재 선택된 씬

  // 액션들

  /**
   * 사용자별 데이터 로드
   * @param {string} userId - 사용자 ID
   */
  loadUserData: (userId) => {
    if (!userId) return
    
    try {
      const savedData = localStorage.getItem(`timeline-data-${userId}`)
      if (savedData) {
        const data = JSON.parse(savedData)
        set(data)
        console.log('User timeline data loaded for:', userId)
      }
    } catch (error) {
      console.warn('Failed to load user timeline data:', error)
    }
  },

  /**
   * 사용자별 데이터 저장
   * @param {string} userId - 사용자 ID
   */
  saveUserData: (userId) => {
    if (!userId) return
    
    try {
      const currentState = get()
      const dataToSave = {
        cuts: currentState.cuts,
        scenes: currentState.scenes,
        selectedCutId: currentState.selectedCutId,
        selectedSceneId: currentState.selectedSceneId,
        currentProjectId: currentState.currentProjectId,
        filters: currentState.filters,
        sortBy: currentState.sortBy,
        currentCut: currentState.currentCut,
        currentScene: currentState.currentScene
      }
      
      localStorage.setItem(`timeline-data-${userId}`, JSON.stringify(dataToSave))
      console.log('User timeline data saved for:', userId)
    } catch (error) {
      console.warn('Failed to save user timeline data:', error)
    }
  },

  /**
   * 모든 데이터 초기화
   */
  clearAllData: () => {
    set({
      cuts: [],
      scenes: [],
      selectedCutId: null,
      selectedSceneId: null,
      loading: false,
      error: null,
      currentProjectId: null,
      websocketConnection: null,
      filters: {
        type: null,
        dateRange: null,
        location: null,
        character: null,
        equipment: null,
      },
      sortBy: 'cut_number',
      modalOpen: false,
      currentCut: null,
      currentScene: null
    })
    console.log('All timeline data cleared')
  },

  /**
   * 컷들 설정 (타임라인용)
   */
  setCuts: (cuts) => {
    console.log('🔧 timelineStore setCuts 호출됨')
    console.log('  - 전달받은 cuts 타입:', typeof cuts)
    console.log('  - 전달받은 cuts가 배열인가:', Array.isArray(cuts))
    console.log('  - 전달받은 cuts 길이:', cuts?.length || 0)
    
    if (cuts && Array.isArray(cuts)) {
      console.log('✅ timelineStore 유효한 cuts 데이터 수신')
      
      // 컷 데이터 상세 분석 로그 추가
      console.log('🎬 timelineStore 컷 데이터 상세 분석:')
      cuts.forEach((cut, index) => {
        console.log(`🎬 timelineStore 컷 ${index + 1} 정보:`)
        console.log('  - ID:', cut.id)
        console.log('  - 컷 번호:', cut.shotNumber)
        console.log('  - 제목:', cut.title)
        console.log('  - 컷 타입:', cut.cutType)
        console.log('  - 예상 시간:', cut.estimatedDuration)
        console.log('  - 실제 시간(초):', cut.duration)
        console.log('  - 씬 ID:', cut.sceneId)
        console.log('  - 씬 번호:', cut.sceneNumber)
        console.log('  - 씬 제목:', cut.sceneTitle)
        console.log('  - 이미지 URL 존재:', !!cut.imageUrl)
        console.log('  - 이미지 URL 값:', cut.imageUrl)
        console.log('  ---')
      })
    } else {
      console.log('❌ timelineStore 유효하지 않은 cuts 데이터:', cuts)
    }
    
    set({ cuts, loading: false, error: null })
    console.log('✅ timelineStore cuts 설정 완료')
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
      console.log('💾 timelineStore 사용자별 데이터 저장 완료')
    }
  },

  /**
   * 현재 프로젝트 ID 설정
   */
  setCurrentProjectId: (projectId) => {
    console.log('🔧 timelineStore setCurrentProjectId 호출됨:', projectId)
    set({ currentProjectId: projectId })
    console.log('✅ timelineStore currentProjectId 설정 완료:', projectId)
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
      console.log('💾 timelineStore 사용자별 데이터 저장 완료')
    }
  },

  /**
   * 씬들 설정 (스케줄러용)
   */
  setScenes: (scenes) => {
    console.log('🔧 timelineStore setScenes 호출됨')
    console.log('  - 전달받은 scenes 타입:', typeof scenes)
    console.log('  - 전달받은 scenes가 배열인가:', Array.isArray(scenes))
    console.log('  - 전달받은 scenes 길이:', scenes?.length || 0)
    
    if (scenes && Array.isArray(scenes)) {
      console.log('✅ timelineStore 유효한 scenes 데이터 수신')
      
      // 씬 데이터 상세 분석 로그 추가
      console.log('🎬 timelineStore 씬 데이터 상세 분석:')
      scenes.forEach((scene, index) => {
        console.log(`📝 timelineStore 씬 ${index + 1} 정보:`)
        console.log('  - ID:', scene.id)
        console.log('  - 씬 번호:', scene.scene)
        console.log('  - 제목:', scene.title)
        console.log('  - 설명:', scene.description)
        console.log('  - 예상 시간:', scene.estimatedDuration)
        console.log('  - 실제 시간(초):', scene.duration)
        console.log('  - 이미지 URL 존재:', !!scene.imageUrl)
        console.log('  - 이미지 URL 값:', scene.imageUrl)
        console.log('  - 컷 개수:', scene.cuts?.length || 0)
        console.log('  ---')
      })
    } else {
      console.log('❌ timelineStore 유효하지 않은 scenes 데이터:', scenes)
    }
    
    set({ scenes, loading: false, error: null })
    console.log('✅ timelineStore scenes 설정 완료')
    
    // 사용자별 데이터 저장
    const { user } = useAuthStore.getState()
    if (user && user.id) {
      get().saveUserData(user.id)
      console.log('💾 timelineStore 사용자별 데이터 저장 완료')
    }
  },

  /**
   * 컷 추가
   */
  addCut: (cut) => {
    set((state) => ({
      cuts: [...state.cuts, cut]
    }))
  },

  /**
   * 컷 업데이트
   */
  updateCut: (cutId, updates) => {
    set((state) => ({
      cuts: state.cuts.map(cut =>
        cut.id === cutId ? { ...cut, ...updates } : cut
      )
    }))
  },

  /**
   * 컷 선택
   */
  selectCut: (cutId) => {
    set({ selectedCutId: cutId })
    console.log('🎬 timelineStore 컷 선택:', cutId)
  },

  /**
   * 컷 삭제
   */
  deleteCut: (cutId) => {
    set((state) => ({
      cuts: state.cuts.filter(cut => cut.id !== cutId),
      selectedCutId: state.selectedCutId === cutId ? null : state.selectedCutId
    }))
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
  deleteScene: (sceneId) => {
    set((state) => ({
      scenes: state.scenes.filter(scene => scene.id !== sceneId),
      selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId
    }))
  },

  /**
   * 프로젝트 컷 데이터 로드 (타임라인용)
   */
  loadProjectCuts: async (projectId) => {
    try {
      console.log('timelineStore loadProjectCuts started for projectId:', projectId)
      
      set({ loading: true, error: null, currentProjectId: projectId })
      
      // 캐시 확인
      const cacheKey = `project_cuts_${projectId}`
      const cached = timelineService.getCachedData(cacheKey)
      if (cached) {
        console.log('timelineStore using cached cuts data for projectId:', projectId)
        set({ 
          cuts: cached, 
          loading: false, 
          currentProjectId: projectId,
          error: null
        })
        return { success: true, data: cached }
      }

      // API에서 데이터 가져오기
      console.log('timelineStore fetching cuts data from API for projectId:', projectId)
      const result = await timelineService.getProjectCuts(projectId)
      console.log('timelineStore API result:', result)
      console.log('timelineStore API result type:', typeof result)
      console.log('timelineStore API result.success:', result?.success)
      console.log('timelineStore API result.data:', result?.data)
      
      if (result && result.success && result.data) {
        console.log('timelineStore API success, cuts count:', result.data.length)
        
        // 데이터 유효성 검사
        if (!Array.isArray(result.data)) {
          console.error('timelineStore API returned non-array data:', result.data)
          set({ 
            loading: false, 
            error: '서버에서 잘못된 데이터 형식을 받았습니다.' 
          })
          return { success: false, error: '서버에서 잘못된 데이터 형식을 받았습니다.' }
        }
        
        // 컷 데이터 상세 분석
        console.log('🔍 timelineStore 컷 데이터 상세 분석:')
        result.data.forEach((cut, index) => {
          console.log(`🎬 timelineStore 컷 ${index + 1} 분석:`, {
            cutId: cut.id,
            shotNumber: cut.shotNumber,
            title: cut.title,
            description: cut.description,
            cutType: cut.cutType,
            estimatedDuration: cut.estimatedDuration,
            duration: cut.duration,
            imageUrl: cut.imageUrl,
            sceneId: cut.sceneId,
            sceneNumber: cut.sceneNumber,
            sceneTitle: cut.sceneTitle
          })
        })
        
        // 캐시에 저장
        timelineService.setCachedData(`project_${projectId}`, result.data)
        
        set({ 
          cuts: result.data, 
          loading: false, 
          currentProjectId: projectId,
          error: null 
        })
        
        // 실시간 업데이트 연결 (선택적)
        try {
          console.log('timelineStore connecting realtime updates')
          get().connectRealtimeUpdates(projectId)
        } catch (wsError) {
          console.warn('timelineStore WebSocket connection failed:', wsError)
          // WebSocket 연결 실패는 치명적이지 않으므로 계속 진행
        }
        
        return { success: true, data: result.data }
      } else {
        console.error('timelineStore API failed:', result)
        const errorMessage = result?.error || '데이터를 불러올 수 없습니다.'
        set({ 
          loading: false, 
          error: errorMessage
        })
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('timelineStore loadProjectCuts error:', error)
      const errorMessage = '컷 데이터를 불러오는데 실패했습니다.'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 프로젝트 씬 데이터 로드 (스케줄러용)
   */
  loadProjectScenes: async (projectId) => {
    try {
      console.log('timelineStore loadProjectScenes started for projectId:', projectId)
      
      set({ loading: true, error: null, currentProjectId: projectId })
      
      // 캐시 확인
      const cacheKey = `project_scenes_${projectId}`
      const cached = timelineService.getCachedData(cacheKey)
      if (cached) {
        console.log('timelineStore using cached scenes data for projectId:', projectId)
        set({ 
          scenes: cached, 
          loading: false, 
          currentProjectId: projectId,
          error: null
        })
        return { success: true, data: cached }
      }

      // API에서 데이터 가져오기
      console.log('timelineStore fetching scenes data from API for projectId:', projectId)
      const result = await timelineService.getProjectContes(projectId)
      console.log('timelineStore API result:', result)
      
      if (result && result.success && result.data) {
        console.log('timelineStore API success, scenes count:', result.data.length)
        
        // 데이터 유효성 검사
        if (!Array.isArray(result.data)) {
          console.error('timelineStore API returned non-array data:', result.data)
          set({ 
            loading: false, 
            error: '서버에서 잘못된 데이터 형식을 받았습니다.' 
          })
          return { success: false, error: '서버에서 잘못된 데이터 형식을 받았습니다.' }
        }
        
        // 캐시에 저장
        timelineService.setCachedData(`project_scenes_${projectId}`, result.data)
        
        set({ 
          scenes: result.data, 
          loading: false, 
          currentProjectId: projectId,
          error: null 
        })
        
        return { success: true, data: result.data }
      } else {
        console.error('timelineStore API failed:', result)
        const errorMessage = result?.error || '데이터를 불러올 수 없습니다.'
        set({ 
          loading: false, 
          error: errorMessage
        })
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('timelineStore loadProjectScenes error:', error)
      const errorMessage = '씬 데이터를 불러오는데 실패했습니다.'
      set({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 컷 상세 정보 로드
   */
  loadCutDetails: async (cutId) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      console.log('timelineStore loadCutDetails started for cutId:', cutId)
      const result = await timelineService.getCutDetails(currentProjectId, cutId)
      
      if (result.success) {
        // 현재 컷 업데이트 및 모달 열기
        set({ currentCut: result.data, modalOpen: true })
        console.log('timelineStore cut details loaded and modal opened:', result.data)
        return { success: true, data: result.data }
      } else {
        set({ error: result.error })
        console.error('timelineStore loadCutDetails failed:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '컷 상세 정보를 불러오는데 실패했습니다.'
      set({ error: errorMessage })
      console.error('timelineStore loadCutDetails error:', error)
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
      console.log('timelineStore loadSceneDetails started for sceneId:', sceneId)
      const result = await timelineService.getSceneDetails(currentProjectId, sceneId)
      
      if (result.success) {
        // 현재 씬 업데이트 및 모달 열기
        set({ currentScene: result.data, modalOpen: true })
        console.log('timelineStore scene details loaded and modal opened:', result.data)
        return { success: true, data: result.data }
      } else {
        set({ error: result.error })
        console.error('timelineStore loadSceneDetails failed:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '씬 상세 정보를 불러오는데 실패했습니다.'
      set({ error: errorMessage })
      console.error('timelineStore loadSceneDetails error:', error)
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 컷 업데이트 (API 연동)
   */
  updateCutWithAPI: async (cutId, updates) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      const result = await timelineService.updateCut(currentProjectId, cutId, updates)
      
      if (result.success) {
        // 로컬 상태 업데이트
        set((state) => ({
          cuts: state.cuts.map(cut =>
            cut.id === cutId ? { ...cut, ...updates } : cut
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
      const errorMessage = '컷 업데이트에 실패했습니다.'
      set({ error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 컷 삭제 (API 연동)
   */
  deleteCutWithAPI: async (cutId) => {
    const { currentProjectId } = get()
    if (!currentProjectId) {
      return { success: false, error: '프로젝트가 선택되지 않았습니다.' }
    }

    try {
      const result = await timelineService.deleteCut(currentProjectId, cutId)
      
      if (result.success) {
        // 로컬 상태 업데이트
        set((state) => ({
          cuts: state.cuts.filter(cut => cut.id !== cutId),
          selectedCutId: state.selectedCutId === cutId ? null : state.selectedCutId
        }))
        
        // 캐시 업데이트
        timelineService.clearCache(`project_${currentProjectId}`)
        
        return { success: true }
      } else {
        set({ error: result.error })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = '컷 삭제에 실패했습니다.'
      set({ error: errorMessage })
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 실시간 업데이트 연결
   */
  connectRealtimeUpdates: (projectId) => {
    try {
      const ws = timelineService.connectRealtimeUpdates(projectId, (data) => {
        console.log('📨 timelineStore 실시간 업데이트 수신:', data)
        
        // 업데이트 타입에 따라 처리
        if (data.type === 'cut_updated') {
          get().updateCut(data.cutId, data.updates)
        } else if (data.type === 'cut_deleted') {
          get().deleteCut(data.cutId)
        } else if (data.type === 'cut_created') {
          get().addCut(data.cut)
        } else if (data.type === 'scene_updated') {
          get().updateScene(data.sceneId, data.updates)
        } else if (data.type === 'scene_deleted') {
          get().deleteScene(data.sceneId)
        } else if (data.type === 'scene_created') {
          get().addScene(data.scene)
        }
      })
      
      set({ websocketConnection: ws })
      console.log('✅ timelineStore WebSocket 연결 설정 완료')
    } catch (error) {
      console.error('❌ timelineStore WebSocket 연결 실패:', error)
    }
  },

  /**
   * 실시간 업데이트 연결 해제
   */
  disconnectRealtimeUpdates: () => {
    const { websocketConnection } = get()
    if (websocketConnection) {
      websocketConnection.close()
      set({ websocketConnection: null })
      console.log('🔌 timelineStore WebSocket 연결 해제 완료')
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
  openModal: (cut) => {
    set({ modalOpen: true, currentCut: cut })
  },

  /**
   * 모달 닫기
   */
  closeModal: () => {
    set({ modalOpen: false, currentCut: null })
  },

  /**
   * 필터링된 컷들 가져오기
   */
  getFilteredCuts: () => {
    const { cuts, filters, sortBy } = get()
    
    let filteredCuts = [...cuts]

    // 타입별 필터링
    if (filters.type) {
      filteredCuts = filteredCuts.filter(cut => cut.type === filters.type)
    }

    // 날짜 범위 필터링
    if (filters.dateRange) {
      filteredCuts = filteredCuts.filter(cut => {
        const cutDate = new Date(cut.createdAt)
        return cutDate >= filters.dateRange.start && cutDate <= filters.dateRange.end
      })
    }

    // 장소별 필터링
    if (filters.location) {
      filteredCuts = filteredCuts.filter(cut => {
        return cut.nodes?.some(node => 
          node.type === 'location' && 
          node.value.toLowerCase().includes(filters.location.toLowerCase())
        )
      })
    }

    // 등장인물별 필터링
    if (filters.character) {
      filteredCuts = filteredCuts.filter(cut => {
        return cut.nodes?.some(node => 
          node.type === 'character' && 
          node.value.toLowerCase().includes(filters.character.toLowerCase())
        )
      })
    }

    // 장비별 필터링
    if (filters.equipment) {
      filteredCuts = filteredCuts.filter(cut => {
        return cut.nodes?.some(node => 
          node.type === 'equipment' && 
          node.value.toLowerCase().includes(filters.equipment.toLowerCase())
        )
      })
    }

    // 정렬
    switch (sortBy) {
      case 'cut_number':
        filteredCuts.sort((a, b) => 
          (a.shotNumber || 0) - (b.shotNumber || 0)
        )
        break
      case 'duration':
        filteredCuts.sort((a, b) => (a.duration || 0) - (b.duration || 0))
        break
      case 'created_at':
        filteredCuts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'type':
        filteredCuts.sort((a, b) => a.type.localeCompare(b.type))
        break
      default:
        break
    }

    return filteredCuts
  },

  /**
   * 타입별 씬 개수 가져오기
   */
  getSceneCounts: () => {
    const { cuts } = get()
    return {
      total: cuts.length,
      generatedVideo: cuts.filter(cut => cut.type === SceneType.GENERATED_VIDEO).length,
      liveAction: cuts.filter(cut => cut.type === SceneType.LIVE_ACTION).length,
    }
  },

  /**
   * 총 지속 시간 계산
   */
  getTotalDuration: () => {
    const { cuts } = get()
    return cuts.reduce((total, cut) => total + (cut.duration || 0), 0)
  },

  /**
   * 노드별 통계 가져오기
   */
  getNodeStats: () => {
    const { cuts } = get()
    const stats = {}

    cuts.forEach(cut => {
      cut.nodes?.forEach(node => {
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
    // 이 함수는 컷 중심으로 변경되었으므로 사용되지 않음
    console.log('updateScenesOrder 호출됨 (컷 중심 스토어에서는 사용되지 않음)')
  },

  /**
   * 컷 순서 변경
   */
  updateCutsOrder: (newCuts) => {
    // 모든 컷을 평면화하여 순서 변경
    const allCuts = []
    const cuts = get().cuts
    
    cuts.forEach(cut => {
      allCuts.push({
        ...cut,
        sceneId: cut.sceneId // 컷의 sceneId를 포함
      })
    })
    
    // 새로운 순서로 컷들을 다시 씬에 배치
    const updatedCuts = newCuts.map(cut => {
      const sceneCuts = allCuts.filter(c => c.sceneId === cut.sceneId)
      return {
        ...cut,
        cuts: sceneCuts
      }
    })
    
    set({ cuts: updatedCuts })
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