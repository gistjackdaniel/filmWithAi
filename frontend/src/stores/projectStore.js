import { create } from 'zustand'
import { 
  createProject as createProjectApi, 
  updateProject as updateProjectApi, 
  getProjects, 
  getProject,
  generateStory as generateStoryApi,
  getFavoriteProjects
} from '../services/projectApi'
import { useAuthStore } from './authStore.js'

/**
 * 프로젝트 상태 관리 스토어
 * NestJS 백엔드와 연동하여 프로젝트 CRUD 및 스토리 생성 기능을 제공
 */
const useProjectStore = create((set, get) => ({
  // ===== 상태 정의 =====
  
  // 프로젝트 목록
  projects: [],
  isLoading: false,
  error: null,
  
  // 현재 프로젝트
  currentProject: null,
  
  // 즐겨찾기 프로젝트 목록
  favoriteProjects: [],
  
  // 프로젝트 생성 상태
  isCreating: false,
  createError: null,
  
  // 프로젝트 업데이트 상태
  isUpdating: false,
  updateError: null,
  
  // 스토리 생성 상태
  isGeneratingStory: false,
  storyGenerationError: null,
  
  // 실시간 업데이트 상태
  isRealtimeEnabled: false,
  lastUpdateTime: null,

  // ===== 액션 정의 =====

  /**
   * 프로젝트 목록 로드
   */
  loadProjects: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const projects = await getProjects()
      set({ 
        projects: projects || [],
        isLoading: false 
      })
      console.log('✅ 프로젝트 목록 로드 완료:', projects?.length || 0, '개')
    } catch (error) {
      console.error('❌ 프로젝트 목록 로드 실패:', error)
      set({ 
        error: error.message || '프로젝트 목록을 불러오는데 실패했습니다.',
        isLoading: false 
      })
    }
  },

  /**
   * 프로젝트 생성
   * @param {Object} projectData - 프로젝트 데이터
   */
  createProject: async (projectData) => {
    set({ isCreating: true, createError: null })
    
    try {
      console.log('💾 프로젝트 생성 시작:', {
        title: projectData.title,
        hasSynopsis: !!projectData.synopsis,
        synopsis: projectData.synopsis?.substring(0, 100) + '...',
        tags: projectData.tags,
        genre: projectData.genre
      })

      // 프로젝트 생성
      const newProject = await createProjectApi(projectData)
      
      console.log('✅ 프로젝트 생성 성공:', newProject._id)
      
      // 프로젝트 목록에 추가
      set(state => ({
        projects: [...state.projects, newProject],
        isCreating: false,
        currentProject: newProject
      }))
      
      return { success: true, project: newProject }
    } catch (error) {
      console.error('❌ 프로젝트 생성 실패:', error)
      set({ 
        createError: error.message || '프로젝트 생성에 실패했습니다.',
        isCreating: false 
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트 수정
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} updateData - 수정할 데이터
   */
  updateProject: async (projectId, updateData) => {
    try {
      console.log('✏️ 프로젝트 수정 시작:', { projectId, updateData })
      
      const updatedProject = await updateProjectApi(projectId, updateData)
      
      console.log('✅ 프로젝트 수정 성공:', updatedProject._id)
      
      // 프로젝트 목록 업데이트
      set(state => ({
        projects: state.projects.map(p => 
          p._id === projectId ? updatedProject : p
        ),
        currentProject: state.currentProject?._id === projectId ? updatedProject : state.currentProject
      }))
      
      return { success: true, project: updatedProject }
    } catch (error) {
      console.error('❌ 프로젝트 수정 실패:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트 조회
   * @param {string} projectId - 프로젝트 ID
   */
  loadProject: async (projectId) => {
    try {
      console.log('📋 프로젝트 조회 시작:', projectId)
      
      const project = await getProject(projectId)
      
      console.log('✅ 프로젝트 조회 성공:', project._id)
      
      set({ currentProject: project })
      
      return { success: true, project }
    } catch (error) {
      console.error('❌ 프로젝트 조회 실패:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * 스토리 생성
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} storyData - 스토리 생성 데이터
   */
  generateStory: async (projectId, storyData) => {
    set({ isGeneratingStory: true, storyGenerationError: null })
    
    try {
      console.log('📝 스토리 생성 시작:', { projectId, storyData })
      
      const storyResult = await generateStoryApi({
        projectId,
        ...storyData
      })
      
      console.log('✅ 스토리 생성 성공:', storyResult._id)
      
      // 현재 프로젝트 업데이트
      set(state => ({
        currentProject: state.currentProject?._id === projectId 
          ? { ...state.currentProject, story: storyResult.story }
          : state.currentProject,
        isGeneratingStory: false
      }))
      
      return { success: true, story: storyResult }
    } catch (error) {
      console.error('❌ 스토리 생성 실패:', error)
      set({ 
        storyGenerationError: error.message || '스토리 생성에 실패했습니다.',
        isGeneratingStory: false 
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * 즐겨찾기 프로젝트 목록 로드
   */
  loadFavoriteProjects: async () => {
    try {
      console.log('⭐ 즐겨찾기 프로젝트 목록 로드 시작')
      
      const favoriteProjects = await getFavoriteProjects()
      
      console.log('✅ 즐겨찾기 프로젝트 목록 로드 완료:', favoriteProjects?.length || 0, '개')
      
      set({ favoriteProjects: favoriteProjects || [] })
      
      return { success: true, projects: favoriteProjects }
    } catch (error) {
      console.error('❌ 즐겨찾기 프로젝트 목록 로드 실패:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * 현재 프로젝트 설정
   * @param {Object} project - 프로젝트 객체
   */
  setCurrentProject: (project) => {
    set({ currentProject: project })
  },

  /**
   * 프로젝트 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} projectData - 업데이트할 프로젝트 데이터
   */
  updateProject: async (projectId, projectData) => {
    set({ isUpdating: true, updateError: null })
    
    try {
      console.log('📝 프로젝트 업데이트 시작:', { projectId, projectData })
      
      const result = await updateProjectApi(projectId, projectData)
      
      if (result.success) {
        // 프로젝트 목록에서 해당 프로젝트 업데이트
        set(state => ({
          projects: state.projects.map(project => 
            project._id === projectId ? { ...project, ...result.data } : project
          ),
          currentProject: state.currentProject?._id === projectId 
            ? { ...state.currentProject, ...result.data }
            : state.currentProject,
          isUpdating: false
        }))
        
        console.log('✅ 프로젝트 업데이트 성공:', projectId)
        return { success: true, data: result.data }
      } else {
        console.error('❌ 프로젝트 업데이트 실패:', result.error)
        set({ 
          updateError: result.error || '프로젝트 업데이트에 실패했습니다.',
          isUpdating: false 
        })
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ 프로젝트 업데이트 실패:', error)
      set({ 
        updateError: error.message || '프로젝트 업데이트 중 오류가 발생했습니다.',
        isUpdating: false 
      })
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트 목록 새로고침
   */
  refreshProjects: async () => {
    await get().loadProjects()
  },

  /**
   * 오류 상태 초기화
   */
  clearError: () => {
    set({ error: null, createError: null, updateError: null, storyGenerationError: null })
  },

  /**
   * 로딩 상태 초기화
   */
  clearLoading: () => {
    set({ isLoading: false, isCreating: false, isUpdating: false, isGeneratingStory: false })
  },

  /**
   * 스토어 초기화
   */
  reset: () => {
    set({
      projects: [],
      currentProject: null,
      favoriteProjects: [],
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isGeneratingStory: false,
      error: null,
      createError: null,
      updateError: null,
      storyGenerationError: null,
      isRealtimeEnabled: false,
      lastUpdateTime: null
    })
  }
}))

export { useProjectStore } 