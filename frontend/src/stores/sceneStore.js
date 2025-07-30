import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore.js'
import projectApi from '../services/projectApi.js'

/**
 * 씬 관리 스토어
 * SceneForge NestJS 백엔드의 씬 API와 연동하여 씬 CRUD 기능을 제공
 * 씬 생성, 수정, 삭제, 복원, 초안 생성 등의 상태를 중앙에서 관리
 */

// 씬 데이터 구조 정의
/**
 * @typedef {Object} SceneData
 * @property {string} title - 씬 제목
 * @property {string} description - 씬 설명
 * @property {Array} dialogues - 대화 목록
 * @property {string} weather - 날씨
 * @property {Object} lighting - 조명 설정
 * @property {string} visualDescription - 시각 설명
 * @property {string} scenePlace - 씬 장소
 * @property {string} sceneDateTime - 씬 시간
 * @property {boolean} vfxRequired - VFX 필요 여부
 * @property {boolean} sfxRequired - SFX 필요 여부
 * @property {string} estimatedDuration - 예상 지속 시간
 * @property {Object} location - 위치 정보
 * @property {string} timeOfDay - 시간대
 * @property {Object} crew - 인력 구성
 * @property {Object} equipment - 장비 구성
 * @property {Array} cast - 출연진
 * @property {Array} extra - 추가 인원
 * @property {Array} specialRequirements - 특별 요구사항
 * @property {number} order - 순서
 */

const useSceneStore = create(
  persist(
    (set, get) => ({
      // ===== 상태 정의 =====
      
      // 현재 프로젝트 ID
      currentProjectId: null,
      
      // 씬 목록 관련 상태
      scenes: [], // 프로젝트의 씬 목록
      isLoading: false, // 로딩 상태
      error: '', // 에러 메시지
      
      // 현재 선택된 씬
      currentScene: null,
      currentSceneId: null,
      
      // 씬 생성/수정 관련 상태
      isCreating: false, // 씬 생성 중
      isUpdating: false, // 씬 수정 중
      isDeleting: false, // 씬 삭제 중
      
      // 씬 초안 생성 관련 상태
      isCreatingDraft: false, // 초안 생성 중
      draftScenes: [], // 생성된 초안 씬들
      
      // 씬 필터링 및 정렬
      filters: {
        searchQuery: '',
        timeOfDay: '',
        weather: '',
        vfxRequired: null,
        sfxRequired: null,
      },
      sortBy: 'order', // 정렬 기준
      sortOrder: 'asc', // 정렬 순서
      
      // 씬 편집 상태
      editingScene: null, // 편집 중인 씬
      hasUnsavedChanges: false, // 저장되지 않은 변경사항
      
      // 씬 히스토리
      sceneHistory: [], // 씬 변경 히스토리
      historyIndex: -1, // 현재 히스토리 인덱스
      
      // ===== 액션 정의 =====

      /**
       * 현재 프로젝트 설정
       * @param {string} projectId - 프로젝트 ID
       */
      setCurrentProject: (projectId) => {
        set({ 
          currentProjectId: projectId,
          scenes: [],
          currentScene: null,
          currentSceneId: null
        })
      },

      /**
       * 씬 목록 로딩 시작
       */
      startLoading: () => {
        set({ isLoading: true, error: '' })
      },

      /**
       * 씬 목록 로딩 완료
       * @param {Array} scenes - 씬 목록
       */
      completeLoading: (scenes) => {
        set({ 
          scenes: scenes || [],
          isLoading: false,
          error: ''
        })
      },

      /**
       * 로딩 실패
       * @param {string} error - 에러 메시지
       */
      failLoading: (error) => {
        set({ 
          isLoading: false,
          error: error || '씬 목록을 불러오는데 실패했습니다.'
        })
      },

      /**
       * 프로젝트의 씬 목록 조회
       * @param {string} projectId - 프로젝트 ID
       */
      loadScenes: async (projectId) => {
        const { startLoading, completeLoading, failLoading } = get()
        
        if (!projectId) {
          failLoading('프로젝트 ID가 필요합니다.')
          return
        }

        startLoading()
        
        try {
          const result = await projectApi.getScenesByProject(projectId)
          
          if (result.success) {
            completeLoading(result.data)
            set({ currentProjectId: projectId })
          } else {
            failLoading(result.error)
          }
        } catch (error) {
          failLoading(error.message)
        }
      },

      /**
       * 특정 씬 조회
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       */
      loadScene: async (projectId, sceneId) => {
        if (!projectId || !sceneId) return
        
        try {
          const result = await projectApi.getSceneById(projectId, sceneId)
          
          if (result.success) {
            set({ 
              currentScene: result.data,
              currentSceneId: sceneId
            })
          } else {
            set({ error: result.error })
          }
        } catch (error) {
          set({ error: error.message })
        }
      },

      /**
       * 씬 생성 시작
       */
      startCreating: () => {
        set({ 
          isCreating: true,
          error: ''
        })
      },

      /**
       * 씬 생성 완료
       * @param {Object} scene - 생성된 씬
       */
      completeCreating: (scene) => {
        set((state) => ({
          scenes: [scene, ...state.scenes],
          currentScene: scene,
          currentSceneId: scene._id,
          isCreating: false,
          error: ''
        }))
      },

      /**
       * 씬 생성 실패
       * @param {string} error - 에러 메시지
       */
      failCreating: (error) => {
        set({ 
          isCreating: false,
          error: error || '씬 생성에 실패했습니다.'
        })
      },

      /**
       * 새 씬 생성
       * @param {string} projectId - 프로젝트 ID
       * @param {SceneData} sceneData - 씬 데이터
       */
      createScene: async (projectId, sceneData) => {
        const { startCreating, completeCreating, failCreating } = get()
        
        if (!projectId) {
          failCreating('프로젝트 ID가 필요합니다.')
          return
        }

        startCreating()
        
        try {
          const result = await projectApi.createScene(projectId, sceneData)
          
          if (result.success) {
            completeCreating(result.data)
          } else {
            failCreating(result.error)
          }
        } catch (error) {
          failCreating(error.message)
        }
      },

      /**
       * 씬 수정 시작
       */
      startUpdating: () => {
        set({ 
          isUpdating: true,
          error: ''
        })
      },

      /**
       * 씬 수정 완료
       * @param {Object} updatedScene - 수정된 씬
       */
      completeUpdating: (updatedScene) => {
        set((state) => ({
          scenes: state.scenes.map(scene => 
            scene._id === updatedScene._id ? updatedScene : scene
          ),
          currentScene: updatedScene,
          isUpdating: false,
          error: '',
          hasUnsavedChanges: false
        }))
      },

      /**
       * 씬 수정 실패
       * @param {string} error - 에러 메시지
       */
      failUpdating: (error) => {
        set({ 
          isUpdating: false,
          error: error || '씬 수정에 실패했습니다.'
        })
      },

      /**
       * 씬 수정
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {SceneData} sceneData - 수정할 씬 데이터
       */
      updateScene: async (projectId, sceneId, sceneData) => {
        const { startUpdating, completeUpdating, failUpdating } = get()
        
        if (!projectId || !sceneId) {
          failUpdating('프로젝트 ID와 씬 ID가 필요합니다.')
          return
        }

        startUpdating()
        
        try {
          const result = await projectApi.updateScene(projectId, sceneId, sceneData)
          
          if (result.success) {
            completeUpdating(result.data)
          } else {
            failUpdating(result.error)
          }
        } catch (error) {
          failUpdating(error.message)
        }
      },

      /**
       * 씬 삭제 시작
       */
      startDeleting: () => {
        set({ 
          isDeleting: true,
          error: ''
        })
      },

      /**
       * 씬 삭제 완료
       * @param {string} sceneId - 삭제된 씬 ID
       */
      completeDeleting: (sceneId) => {
        set((state) => ({
          scenes: state.scenes.filter(scene => scene._id !== sceneId),
          currentScene: state.currentScene?._id === sceneId ? null : state.currentScene,
          currentSceneId: state.currentSceneId === sceneId ? null : state.currentSceneId,
          isDeleting: false,
          error: ''
        }))
      },

      /**
       * 씬 삭제 실패
       * @param {string} error - 에러 메시지
       */
      failDeleting: (error) => {
        set({ 
          isDeleting: false,
          error: error || '씬 삭제에 실패했습니다.'
        })
      },

      /**
       * 씬 삭제
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       */
      deleteScene: async (projectId, sceneId) => {
        const { startDeleting, completeDeleting, failDeleting } = get()
        
        if (!projectId || !sceneId) {
          failDeleting('프로젝트 ID와 씬 ID가 필요합니다.')
          return
        }

        startDeleting()
        
        try {
          const result = await projectApi.deleteScene(projectId, sceneId)
          
          if (result.success) {
            completeDeleting(sceneId)
          } else {
            failDeleting(result.error)
          }
        } catch (error) {
          failDeleting(error.message)
        }
      },

      /**
       * 씬 복원
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       */
      restoreScene: async (projectId, sceneId) => {
        if (!projectId || !sceneId) return
        
        try {
          const result = await projectApi.restoreScene(projectId, sceneId)
          
          if (result.success) {
            // 복원된 씬을 목록에 추가
            set((state) => ({
              scenes: [result.data, ...state.scenes],
              error: ''
            }))
          } else {
            set({ error: result.error })
          }
        } catch (error) {
          set({ error: error.message })
        }
      },

      /**
       * 씬 초안 생성 시작
       */
      startCreatingDraft: () => {
        set({ 
          isCreatingDraft: true,
          error: ''
        })
      },

      /**
       * 씬 초안 생성 완료
       * @param {Array} draftScenes - 생성된 초안 씬들
       */
      completeCreatingDraft: (draftScenes) => {
        set((state) => ({
          scenes: [...draftScenes, ...state.scenes],
          draftScenes: draftScenes,
          isCreatingDraft: false,
          error: ''
        }))
      },

      /**
       * 씬 초안 생성 실패
       * @param {string} error - 에러 메시지
       */
      failCreatingDraft: (error) => {
        set({ 
          isCreatingDraft: false,
          error: error || '씬 초안 생성에 실패했습니다.'
        })
      },

      /**
       * 씬 초안 생성
       * @param {string} projectId - 프로젝트 ID
       * @param {Object} draftData - 초안 생성 데이터
       */
      createSceneDraft: async (projectId, draftData) => {
        const { startCreatingDraft, completeCreatingDraft, failCreatingDraft } = get()
        
        if (!projectId) {
          failCreatingDraft('프로젝트 ID가 필요합니다.')
          return
        }

        startCreatingDraft()
        
        try {
          const result = await projectApi.createSceneDraft(projectId, draftData)
          
          if (result.success) {
            completeCreatingDraft(result.data)
          } else {
            failCreatingDraft(result.error)
          }
        } catch (error) {
          failCreatingDraft(error.message)
        }
      },

      /**
       * 현재 씬 설정
       * @param {Object} scene - 씬 객체
       */
      setCurrentScene: (scene) => {
        set({ 
          currentScene: scene,
          currentSceneId: scene?._id || null
        })
      },

      /**
       * 편집 중인 씬 설정
       * @param {Object} scene - 편집할 씬
       */
      setEditingScene: (scene) => {
        set({ 
          editingScene: scene,
          hasUnsavedChanges: false
        })
      },

      /**
       * 편집 중인 씬 업데이트
       * @param {Object} updates - 업데이트할 데이터
       */
      updateEditingScene: (updates) => {
        set((state) => ({
          editingScene: state.editingScene ? { ...state.editingScene, ...updates } : null,
          hasUnsavedChanges: true
        }))
      },

      /**
       * 편집 취소
       */
      cancelEditing: () => {
        set({ 
          editingScene: null,
          hasUnsavedChanges: false
        })
      },

      /**
       * 필터 설정
       * @param {Object} filters - 필터 설정
       */
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }))
      },

      /**
       * 정렬 설정
       * @param {string} sortBy - 정렬 기준
       * @param {string} sortOrder - 정렬 순서
       */
      setSort: (sortBy, sortOrder = 'asc') => {
        set({ sortBy, sortOrder })
      },

      /**
       * 에러 초기화
       */
      clearError: () => {
        set({ error: '' })
      },

      /**
       * 모든 상태 초기화
       */
      reset: () => {
        set({
          currentProjectId: null,
          scenes: [],
          isLoading: false,
          error: '',
          currentScene: null,
          currentSceneId: null,
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
          isCreatingDraft: false,
          draftScenes: [],
          filters: {
            searchQuery: '',
            timeOfDay: '',
            weather: '',
            vfxRequired: null,
            sfxRequired: null,
          },
          sortBy: 'order',
          sortOrder: 'asc',
          editingScene: null,
          hasUnsavedChanges: false,
          sceneHistory: [],
          historyIndex: -1,
        })
      },

      // ===== 계산된 상태 (getter) =====

      /**
       * 필터링된 씬 목록
       * @returns {Array} 필터링된 씬 목록
       */
      getFilteredScenes: () => {
        const { scenes, filters, sortBy, sortOrder } = get()
        
        let filteredScenes = [...scenes]
        
        // 검색 필터
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          filteredScenes = filteredScenes.filter(scene =>
            scene.title.toLowerCase().includes(query) ||
            scene.description.toLowerCase().includes(query)
          )
        }
        
        // 시간대 필터
        if (filters.timeOfDay) {
          filteredScenes = filteredScenes.filter(scene =>
            scene.timeOfDay === filters.timeOfDay
          )
        }
        
        // 날씨 필터
        if (filters.weather) {
          filteredScenes = filteredScenes.filter(scene =>
            scene.weather === filters.weather
          )
        }
        
        // VFX 필터
        if (filters.vfxRequired !== null) {
          filteredScenes = filteredScenes.filter(scene =>
            scene.vfxRequired === filters.vfxRequired
          )
        }
        
        // SFX 필터
        if (filters.sfxRequired !== null) {
          filteredScenes = filteredScenes.filter(scene =>
            scene.sfxRequired === filters.sfxRequired
          )
        }
        
        // 정렬
        filteredScenes.sort((a, b) => {
          let aValue = a[sortBy]
          let bValue = b[sortBy]
          
          if (sortBy === 'order') {
            aValue = a.order || 0
            bValue = b.order || 0
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
        
        return filteredScenes
      },

      /**
       * 로딩 중인지 확인
       * @returns {boolean} 로딩 중 여부
       */
      isLoading: () => {
        const { isLoading, isCreating, isUpdating, isDeleting, isCreatingDraft } = get()
        return isLoading || isCreating || isUpdating || isDeleting || isCreatingDraft
      },

      /**
       * 현재 씬이 있는지 확인
       * @returns {boolean} 현재 씬 존재 여부
       */
      hasCurrentScene: () => {
        const { currentScene } = get()
        return !!currentScene
      },

      /**
       * 편집 중인 씬이 있는지 확인
       * @returns {boolean} 편집 중인 씬 존재 여부
       */
      hasEditingScene: () => {
        const { editingScene } = get()
        return !!editingScene
      },

      /**
       * 저장되지 않은 변경사항이 있는지 확인
       * @returns {boolean} 저장되지 않은 변경사항 존재 여부
       */
      hasUnsavedChanges: () => {
        const { hasUnsavedChanges } = get()
        return hasUnsavedChanges
      }
    }),
    {
      name: 'scene-storage', // 로컬 스토리지 키
      partialize: (state) => ({ 
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)

export default useSceneStore
