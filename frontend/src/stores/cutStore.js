import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore.js'
import projectApi from '../services/projectApi.js'

/**
 * 컷 관리 스토어
 * SceneForge NestJS 백엔드의 컷 API와 연동하여 컷 CRUD 기능을 제공
 * 컷 생성, 수정, 삭제, 이미지 업로드, AI 이미지 생성 등의 상태를 중앙에서 관리
 */

// 컷 데이터 구조 정의
/**
 * @typedef {Object} CutData
 * @property {string} title - 컷 제목
 * @property {string} description - 컷 설명
 * @property {string} shotType - 샷 타입 (CU, MS, LS, WS, ELS 등)
 * @property {string} cameraAngle - 카메라 앵글
 * @property {string} cameraMovement - 카메라 움직임
 * @property {string} composition - 구도
 * @property {string} lighting - 조명
 * @property {string} color - 색감
 * @property {string} mood - 분위기
 * @property {string} visualNotes - 시각적 노트
 * @property {string} technicalNotes - 기술적 노트
 * @property {number} duration - 지속 시간 (초)
 * @property {number} order - 순서
 * @property {string} imageUrl - 이미지 URL
 * @property {Object} imageMetadata - 이미지 메타데이터
 * @property {Array} characters - 등장 인물
 * @property {Array} props - 소품
 * @property {Array} effects - 특수 효과
 * @property {Object} location - 위치 정보
 * @property {string} timeOfDay - 시간대
 * @property {string} weather - 날씨
 */

const useCutStore = create(
  persist(
    (set, get) => ({
      // ===== 상태 정의 =====
      
      // 현재 프로젝트/씬 ID
      currentProjectId: null,
      currentSceneId: null,
      
      // 컷 목록 관련 상태
      cuts: [], // 씬의 컷 목록
      isLoading: false, // 로딩 상태
      error: '', // 에러 메시지
      
      // 현재 선택된 컷
      currentCut: null,
      currentCutId: null,
      
      // 컷 생성/수정 관련 상태
      isCreating: false, // 컷 생성 중
      isUpdating: false, // 컷 수정 중
      isDeleting: false, // 컷 삭제 중
      
      // 컷 초안 생성 관련 상태
      isCreatingDraft: false, // 초안 생성 중
      draftCuts: [], // 생성된 초안 컷들
      
      // 이미지 관련 상태
      isUploadingImage: false, // 이미지 업로드 중
      isGeneratingImage: false, // AI 이미지 생성 중
      isDeletingImage: false, // 이미지 삭제 중
      
      // 컷 필터링 및 정렬
      filters: {
        searchQuery: '',
        shotType: '',
        cameraAngle: '',
        mood: '',
        timeOfDay: '',
        weather: '',
      },
      sortBy: 'order', // 정렬 기준
      sortOrder: 'asc', // 정렬 순서
      
      // 컷 편집 상태
      editingCut: null, // 편집 중인 컷
      hasUnsavedChanges: false, // 저장되지 않은 변경사항
      
      // 컷 히스토리
      cutHistory: [], // 컷 변경 히스토리
      historyIndex: -1, // 현재 히스토리 인덱스
      
      // 이미지 미리보기
      imagePreview: null, // 이미지 미리보기 URL
      
      // ===== 액션 정의 =====

      /**
       * 현재 프로젝트/씬 설정
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       */
      setCurrentContext: (projectId, sceneId) => {
        set({ 
          currentProjectId: projectId,
          currentSceneId: sceneId,
          cuts: [],
          currentCut: null,
          currentCutId: null
        })
      },

      /**
       * 컷 목록 로딩 시작
       */
      startLoading: () => {
        set({ isLoading: true, error: '' })
      },

      /**
       * 컷 목록 로딩 완료
       * @param {Array} cuts - 컷 목록
       */
      completeLoading: (cuts) => {
        set({ 
          cuts: cuts || [],
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
          error: error || '컷 목록을 불러오는데 실패했습니다.'
        })
      },

      /**
       * 씬의 컷 목록 조회
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       */
      loadCuts: async (projectId, sceneId) => {
        const { startLoading, completeLoading, failLoading } = get()
        
        if (!projectId || !sceneId) {
          failLoading('프로젝트 ID와 씬 ID가 필요합니다.')
          return
        }

        startLoading()
        
        try {
          const result = await projectApi.getCutsByScene(projectId, sceneId)
          
          if (result.success) {
            completeLoading(result.data)
            set({ currentProjectId: projectId, currentSceneId: sceneId })
          } else {
            failLoading(result.error)
          }
        } catch (error) {
          failLoading(error.message)
        }
      },

      /**
       * 특정 컷 조회
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       */
      loadCut: async (projectId, sceneId, cutId) => {
        if (!projectId || !sceneId || !cutId) return
        
        try {
          const result = await projectApi.getCutById(projectId, sceneId, cutId)
          
          if (result.success) {
            set({ 
              currentCut: result.data,
              currentCutId: cutId
            })
          } else {
            set({ error: result.error })
          }
        } catch (error) {
          set({ error: error.message })
        }
      },

      /**
       * 컷 생성 시작
       */
      startCreating: () => {
        set({ 
          isCreating: true,
          error: ''
        })
      },

      /**
       * 컷 생성 완료
       * @param {Object} cut - 생성된 컷
       */
      completeCreating: (cut) => {
        set((state) => ({
          cuts: [cut, ...state.cuts],
          currentCut: cut,
          currentCutId: cut._id,
          isCreating: false,
          error: ''
        }))
      },

      /**
       * 컷 생성 실패
       * @param {string} error - 에러 메시지
       */
      failCreating: (error) => {
        set({ 
          isCreating: false,
          error: error || '컷 생성에 실패했습니다.'
        })
      },

      /**
       * 새 컷 생성
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {CutData} cutData - 컷 데이터
       */
      createCut: async (projectId, sceneId, cutData) => {
        const { startCreating, completeCreating, failCreating } = get()
        
        if (!projectId || !sceneId) {
          failCreating('프로젝트 ID와 씬 ID가 필요합니다.')
          return
        }

        startCreating()
        
        try {
          const result = await projectApi.createCut(projectId, sceneId, cutData)
          
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
       * 컷 수정 시작
       */
      startUpdating: () => {
        set({ 
          isUpdating: true,
          error: ''
        })
      },

      /**
       * 컷 수정 완료
       * @param {Object} updatedCut - 수정된 컷
       */
      completeUpdating: (updatedCut) => {
        set((state) => ({
          cuts: state.cuts.map(cut => 
            cut._id === updatedCut._id ? updatedCut : cut
          ),
          currentCut: updatedCut,
          isUpdating: false,
          error: '',
          hasUnsavedChanges: false
        }))
      },

      /**
       * 컷 수정 실패
       * @param {string} error - 에러 메시지
       */
      failUpdating: (error) => {
        set({ 
          isUpdating: false,
          error: error || '컷 수정에 실패했습니다.'
        })
      },

      /**
       * 컷 수정
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       * @param {CutData} cutData - 수정할 컷 데이터
       */
      updateCut: async (projectId, sceneId, cutId, cutData) => {
        const { startUpdating, completeUpdating, failUpdating } = get()
        
        if (!projectId || !sceneId || !cutId) {
          failUpdating('프로젝트 ID, 씬 ID, 컷 ID가 필요합니다.')
          return
        }

        startUpdating()
        
        try {
          const result = await projectApi.updateCut(projectId, sceneId, cutId, cutData)
          
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
       * 컷 삭제 시작
       */
      startDeleting: () => {
        set({ 
          isDeleting: true,
          error: ''
        })
      },

      /**
       * 컷 삭제 완료
       * @param {string} cutId - 삭제된 컷 ID
       */
      completeDeleting: (cutId) => {
        set((state) => ({
          cuts: state.cuts.filter(cut => cut._id !== cutId),
          currentCut: state.currentCut?._id === cutId ? null : state.currentCut,
          currentCutId: state.currentCutId === cutId ? null : state.currentCutId,
          isDeleting: false,
          error: ''
        }))
      },

      /**
       * 컷 삭제 실패
       * @param {string} error - 에러 메시지
       */
      failDeleting: (error) => {
        set({ 
          isDeleting: false,
          error: error || '컷 삭제에 실패했습니다.'
        })
      },

      /**
       * 컷 삭제
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       */
      deleteCut: async (projectId, sceneId, cutId) => {
        const { startDeleting, completeDeleting, failDeleting } = get()
        
        if (!projectId || !sceneId || !cutId) {
          failDeleting('프로젝트 ID, 씬 ID, 컷 ID가 필요합니다.')
          return
        }

        startDeleting()
        
        try {
          const result = await projectApi.deleteCut(projectId, sceneId, cutId)
          
          if (result.success) {
            completeDeleting(cutId)
          } else {
            failDeleting(result.error)
          }
        } catch (error) {
          failDeleting(error.message)
        }
      },

      /**
       * 컷 초안 생성 시작
       */
      startCreatingDraft: () => {
        set({ 
          isCreatingDraft: true,
          error: ''
        })
      },

      /**
       * 컷 초안 생성 완료
       * @param {Array} draftCuts - 생성된 초안 컷들
       */
      completeCreatingDraft: (draftCuts) => {
        set((state) => ({
          cuts: [...draftCuts, ...state.cuts],
          draftCuts: draftCuts,
          isCreatingDraft: false,
          error: ''
        }))
      },

      /**
       * 컷 초안 생성 실패
       * @param {string} error - 에러 메시지
       */
      failCreatingDraft: (error) => {
        set({ 
          isCreatingDraft: false,
          error: error || '컷 초안 생성에 실패했습니다.'
        })
      },

      /**
       * 컷 초안 생성
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {Object} draftData - 초안 생성 데이터
       */
      createCutDraft: async (projectId, sceneId, draftData) => {
        const { startCreatingDraft, completeCreatingDraft, failCreatingDraft } = get()
        
        if (!projectId || !sceneId) {
          failCreatingDraft('프로젝트 ID와 씬 ID가 필요합니다.')
          return
        }

        startCreatingDraft()
        
        try {
          const result = await projectApi.createCutDraft(projectId, sceneId, draftData)
          
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
       * 이미지 업로드 시작
       */
      startUploadingImage: () => {
        set({ 
          isUploadingImage: true,
          error: ''
        })
      },

      /**
       * 이미지 업로드 완료
       * @param {string} imageUrl - 업로드된 이미지 URL
       */
      completeUploadingImage: (imageUrl) => {
        set((state) => ({
          currentCut: state.currentCut ? { ...state.currentCut, imageUrl } : null,
          cuts: state.cuts.map(cut => 
            cut._id === state.currentCutId ? { ...cut, imageUrl } : cut
          ),
          isUploadingImage: false,
          error: ''
        }))
      },

      /**
       * 이미지 업로드 실패
       * @param {string} error - 에러 메시지
       */
      failUploadingImage: (error) => {
        set({ 
          isUploadingImage: false,
          error: error || '이미지 업로드에 실패했습니다.'
        })
      },

      /**
       * 이미지 업로드
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       * @param {File} file - 업로드할 이미지 파일
       */
      uploadImage: async (projectId, sceneId, cutId, file) => {
        const { startUploadingImage, completeUploadingImage, failUploadingImage } = get()
        
        if (!projectId || !sceneId || !cutId) {
          failUploadingImage('프로젝트 ID, 씬 ID, 컷 ID가 필요합니다.')
          return
        }

        if (!file) {
          failUploadingImage('업로드할 이미지 파일이 필요합니다.')
          return
        }

        startUploadingImage()
        
        try {
          const result = await projectApi.uploadCutImage(projectId, sceneId, cutId, file)
          
          if (result.success) {
            completeUploadingImage(result.data)
          } else {
            failUploadingImage(result.error)
          }
        } catch (error) {
          failUploadingImage(error.message)
        }
      },

      /**
       * AI 이미지 생성 시작
       */
      startGeneratingImage: () => {
        set({ 
          isGeneratingImage: true,
          error: ''
        })
      },

      /**
       * AI 이미지 생성 완료
       * @param {string} imageUrl - 생성된 이미지 URL
       */
      completeGeneratingImage: (imageUrl) => {
        set((state) => ({
          currentCut: state.currentCut ? { ...state.currentCut, imageUrl } : null,
          cuts: state.cuts.map(cut => 
            cut._id === state.currentCutId ? { ...cut, imageUrl } : cut
          ),
          isGeneratingImage: false,
          error: ''
        }))
      },

      /**
       * AI 이미지 생성 실패
       * @param {string} error - 에러 메시지
       */
      failGeneratingImage: (error) => {
        set({ 
          isGeneratingImage: false,
          error: error || 'AI 이미지 생성에 실패했습니다.'
        })
      },

      /**
       * AI 이미지 생성
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       */
      generateImage: async (projectId, sceneId, cutId) => {
        const { startGeneratingImage, completeGeneratingImage, failGeneratingImage } = get()
        
        if (!projectId || !sceneId || !cutId) {
          failGeneratingImage('프로젝트 ID, 씬 ID, 컷 ID가 필요합니다.')
          return
        }

        startGeneratingImage()
        
        try {
          const result = await projectApi.generateCutImage(projectId, sceneId, cutId)
          
          if (result.success) {
            completeGeneratingImage(result.data)
          } else {
            failGeneratingImage(result.error)
          }
        } catch (error) {
          failGeneratingImage(error.message)
        }
      },

      /**
       * 이미지 삭제 시작
       */
      startDeletingImage: () => {
        set({ 
          isDeletingImage: true,
          error: ''
        })
      },

      /**
       * 이미지 삭제 완료
       */
      completeDeletingImage: () => {
        set((state) => ({
          currentCut: state.currentCut ? { ...state.currentCut, imageUrl: null } : null,
          cuts: state.cuts.map(cut => 
            cut._id === state.currentCutId ? { ...cut, imageUrl: null } : cut
          ),
          isDeletingImage: false,
          error: ''
        }))
      },

      /**
       * 이미지 삭제 실패
       * @param {string} error - 에러 메시지
       */
      failDeletingImage: (error) => {
        set({ 
          isDeletingImage: false,
          error: error || '이미지 삭제에 실패했습니다.'
        })
      },

      /**
       * 이미지 삭제
       * @param {string} projectId - 프로젝트 ID
       * @param {string} sceneId - 씬 ID
       * @param {string} cutId - 컷 ID
       */
      deleteImage: async (projectId, sceneId, cutId) => {
        const { startDeletingImage, completeDeletingImage, failDeletingImage } = get()
        
        if (!projectId || !sceneId || !cutId) {
          failDeletingImage('프로젝트 ID, 씬 ID, 컷 ID가 필요합니다.')
          return
        }

        startDeletingImage()
        
        try {
          const result = await projectApi.deleteCutImage(projectId, sceneId, cutId)
          
          if (result.success) {
            completeDeletingImage()
          } else {
            failDeletingImage(result.error)
          }
        } catch (error) {
          failDeletingImage(error.message)
        }
      },

      /**
       * 현재 컷 설정
       * @param {Object} cut - 컷 객체
       */
      setCurrentCut: (cut) => {
        set({ 
          currentCut: cut,
          currentCutId: cut?._id || null
        })
      },

      /**
       * 편집 중인 컷 설정
       * @param {Object} cut - 편집할 컷
       */
      setEditingCut: (cut) => {
        set({ 
          editingCut: cut,
          hasUnsavedChanges: false
        })
      },

      /**
       * 편집 중인 컷 업데이트
       * @param {Object} updates - 업데이트할 데이터
       */
      updateEditingCut: (updates) => {
        set((state) => ({
          editingCut: state.editingCut ? { ...state.editingCut, ...updates } : null,
          hasUnsavedChanges: true
        }))
      },

      /**
       * 편집 취소
       */
      cancelEditing: () => {
        set({ 
          editingCut: null,
          hasUnsavedChanges: false
        })
      },

      /**
       * 이미지 미리보기 설정
       * @param {string} imageUrl - 이미지 URL
       */
      setImagePreview: (imageUrl) => {
        set({ imagePreview: imageUrl })
      },

      /**
       * 이미지 미리보기 제거
       */
      clearImagePreview: () => {
        set({ imagePreview: null })
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
          currentSceneId: null,
          cuts: [],
          isLoading: false,
          error: '',
          currentCut: null,
          currentCutId: null,
          isCreating: false,
          isUpdating: false,
          isDeleting: false,
          isCreatingDraft: false,
          draftCuts: [],
          isUploadingImage: false,
          isGeneratingImage: false,
          isDeletingImage: false,
          filters: {
            searchQuery: '',
            shotType: '',
            cameraAngle: '',
            mood: '',
            timeOfDay: '',
            weather: '',
          },
          sortBy: 'order',
          sortOrder: 'asc',
          editingCut: null,
          hasUnsavedChanges: false,
          cutHistory: [],
          historyIndex: -1,
          imagePreview: null,
        })
      },

      // ===== 계산된 상태 (getter) =====

      /**
       * 필터링된 컷 목록
       * @returns {Array} 필터링된 컷 목록
       */
      getFilteredCuts: () => {
        const { cuts, filters, sortBy, sortOrder } = get()
        
        let filteredCuts = [...cuts]
        
        // 검색 필터
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase()
          filteredCuts = filteredCuts.filter(cut =>
            cut.title.toLowerCase().includes(query) ||
            cut.description.toLowerCase().includes(query) ||
            cut.visualNotes.toLowerCase().includes(query)
          )
        }
        
        // 샷 타입 필터
        if (filters.shotType) {
          filteredCuts = filteredCuts.filter(cut =>
            cut.shotType === filters.shotType
          )
        }
        
        // 카메라 앵글 필터
        if (filters.cameraAngle) {
          filteredCuts = filteredCuts.filter(cut =>
            cut.cameraAngle === filters.cameraAngle
          )
        }
        
        // 분위기 필터
        if (filters.mood) {
          filteredCuts = filteredCuts.filter(cut =>
            cut.mood === filters.mood
          )
        }
        
        // 시간대 필터
        if (filters.timeOfDay) {
          filteredCuts = filteredCuts.filter(cut =>
            cut.timeOfDay === filters.timeOfDay
          )
        }
        
        // 날씨 필터
        if (filters.weather) {
          filteredCuts = filteredCuts.filter(cut =>
            cut.weather === filters.weather
          )
        }
        
        // 정렬
        filteredCuts.sort((a, b) => {
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
        
        return filteredCuts
      },

      /**
       * 로딩 중인지 확인
       * @returns {boolean} 로딩 중 여부
       */
      isLoading: () => {
        const { isLoading, isCreating, isUpdating, isDeleting, isCreatingDraft, isUploadingImage, isGeneratingImage, isDeletingImage } = get()
        return isLoading || isCreating || isUpdating || isDeleting || isCreatingDraft || isUploadingImage || isGeneratingImage || isDeletingImage
      },

      /**
       * 현재 컷이 있는지 확인
       * @returns {boolean} 현재 컷 존재 여부
       */
      hasCurrentCut: () => {
        const { currentCut } = get()
        return !!currentCut
      },

      /**
       * 편집 중인 컷이 있는지 확인
       * @returns {boolean} 편집 중인 컷 존재 여부
       */
      hasEditingCut: () => {
        const { editingCut } = get()
        return !!editingCut
      },

      /**
       * 저장되지 않은 변경사항이 있는지 확인
       * @returns {boolean} 저장되지 않은 변경사항 존재 여부
       */
      hasUnsavedChanges: () => {
        const { hasUnsavedChanges } = get()
        return hasUnsavedChanges
      },

      /**
       * 이미지가 있는 컷들
       * @returns {Array} 이미지가 있는 컷 목록
       */
      getCutsWithImages: () => {
        const { cuts } = get()
        return cuts.filter(cut => cut.imageUrl)
      },

      /**
       * 이미지가 없는 컷들
       * @returns {Array} 이미지가 없는 컷 목록
       */
      getCutsWithoutImages: () => {
        const { cuts } = get()
        return cuts.filter(cut => !cut.imageUrl)
      }
    }),
    {
      name: 'cut-storage', // 로컬 스토리지 키
      partialize: (state) => ({ 
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      })
    }
  )
)

export default useCutStore
