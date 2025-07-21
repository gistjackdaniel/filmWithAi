import { create } from 'zustand'
import { createProject as createProjectApi, createConte as createConteApi, updateConte as updateConteApi, updateProject as updateProjectApi, getProjects, getProject } from '../services/projectApi'
import { useAuthStore } from './authStore'

/**
 * 프로젝트 상태 관리 스토어
 * 스토리와 콘티를 하나의 프로젝트로 통합 관리
 * PRD 2.1.5 프로젝트 관리 기능의 상태 관리
 */
const useProjectStore = create((set, get) => ({
  // ===== 상태 정의 =====
  
  // 프로젝트 목록
  projects: [],
  isLoading: false,
  error: null,
  
  // 현재 프로젝트
  currentProject: null,
  
  // 현재 프로젝트의 콘티 목록
  currentProjectContes: [],
  
  // 프로젝트 생성 상태
  isCreating: false,
  createError: null,
  
  // 콘티 저장 상태
  isSavingConte: false,
  saveConteError: null,
  
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
      const response = await getProjects()
      set({ 
        projects: response.data || [],
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error.message || '프로젝트 목록을 불러오는데 실패했습니다.',
        isLoading: false 
      })
    }
  },

  /**
   * 프로젝트 생성 (시놉시스 선택적 입력)
   * @param {Object} projectData - 프로젝트 데이터
   * @param {Array} conteList - 콘티 리스트 (선택사항)
   */
  createProject: async (projectData, conteList = null) => {
    set({ isCreating: true, createError: null })
    
    try {
      // 시놉시스 선택적 처리
      const finalProjectData = {
        ...projectData,
        synopsis: projectData.synopsis || '', // 빈 문자열로 기본값 설정
        status: projectData.status || 'draft' // 기본 상태 설정
      }

      // 프로젝트 생성
      const projectResponse = await createProjectApi(finalProjectData)
      const newProject = projectResponse.data || projectResponse
      
      // 콘티가 있으면 함께 저장
      if (conteList && conteList.length > 0) {
        
        // 프로젝트 ID 안전하게 추출
        const projectId = newProject._id || newProject.id || projectResponse._id || projectResponse.id || newProject.id
        
        if (!projectId) {
          throw new Error('프로젝트 ID를 찾을 수 없습니다.')
        }
        
        for (const conte of conteList) {
          try {
            await createConteApi(projectId, conte)
          } catch (conteError) {
            console.error('❌ 콘티 저장 실패:', conte.title, conteError)
          }
        }
      }
      
      // 프로젝트 목록 새로고침
      await get().loadProjects()
      
      // 현재 프로젝트 ID를 로컬 스토리지에 저장
      const finalProjectId = newProject._id || newProject.id
      if (finalProjectId) {
        localStorage.setItem('currentProjectId', finalProjectId)
      }
      
      set({ 
        currentProject: newProject,
        isCreating: false 
      })
      
      return newProject
      
    } catch (error) {
      set({ 
        createError: error.message || '프로젝트 생성에 실패했습니다.',
        isCreating: false 
      })
      throw error
    }
  },

  /**
   * 콘티 저장
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} conteData - 콘티 데이터
   * @returns {Promise<Object>} 저장된 콘티 정보
   */
  saveConte: async (projectId, conteData) => {
    set({ isSavingConte: true, saveConteError: null })
    
    try {
      // 프로젝트 ID 검증
      if (!projectId || projectId === 'temp-project-id') {
        throw new Error('유효한 프로젝트 ID가 필요합니다. 먼저 프로젝트를 생성해주세요.')
      }

      // 필수 필드 검증
      if (!conteData.scene || !conteData.title || !conteData.description) {
        throw new Error('씬 번호, 제목, 설명은 필수입니다.')
      }

      const response = await createConteApi(projectId, conteData)
      
      // 현재 프로젝트의 콘티 목록에 새 콘티 추가
      set(state => ({
        currentProjectContes: [...state.currentProjectContes, response.data.conte],
        isSavingConte: false
      }))
      
      return response.data
      
    } catch (error) {
      console.error('❌ 콘티 저장 실패:', error)
      
      // 중복 저장 오류 처리
      if (error.response?.status === 409) {
        set({ isSavingConte: false })
        return {
          success: true,
          message: '콘티가 이미 존재합니다.',
          data: error.response.data
        }
      }
      
      set({ 
        saveConteError: error.message || '콘티 저장에 실패했습니다.',
        isSavingConte: false 
      })
      throw error
    }
  },

  /**
   * 콘티 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {string} conteId - 콘티 ID
   * @param {Object} conteData - 업데이트할 콘티 데이터
   * @returns {Promise<Object>} 업데이트된 콘티 정보
   */
  updateConte: async (projectId, conteId, conteData) => {
    set({ isSavingConte: true, saveConteError: null })
    
    try {
      // 프로젝트 ID 검증
      if (!projectId || projectId === 'temp-project-id') {
        throw new Error('유효한 프로젝트 ID가 필요합니다.')
      }

      // 콘티 ID 검증
      if (!conteId) {
        throw new Error('유효한 콘티 ID가 필요합니다.')
      }

      // 콘티 업데이트 API 호출
      const response = await updateConteApi(projectId, conteId, conteData)
      
      // 현재 프로젝트의 콘티 목록에서 해당 콘티 업데이트
      set(state => ({
        currentProjectContes: state.currentProjectContes.map(conte => 
          conte._id === conteId || conte.id === conteId
            ? response.data.conte
            : conte
        ),
        isSavingConte: false
      }))
      
      return response.data
      
    } catch (error) {
      set({ 
        saveConteError: error.message || '콘티 업데이트에 실패했습니다.',
        isSavingConte: false 
      })
      throw error
    }
  },

  /**
   * 프로젝트 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} updateData - 업데이트할 프로젝트 데이터
   * @returns {Promise<Object>} 업데이트된 프로젝트 정보
   */
  updateProject: async (projectId, updateData) => {
    try {
      // 프로젝트 ID 검증
      if (!projectId || projectId === 'temp-project-id') {
        throw new Error('유효한 프로젝트 ID가 필요합니다.')
      }

      const response = await updateProjectApi(projectId, updateData)
      
      // 현재 프로젝트 업데이트
      set(state => ({
        currentProject: state.currentProject?._id === projectId || state.currentProject?.id === projectId
          ? response.data.project
          : state.currentProject
      }))
      
      return response.data
      
    } catch (error) {
      throw error
    }
  },

  /**
   * 프로젝트 로드 (콘티 목록 포함)
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} options - 로드 옵션
   * @param {boolean} options.includeContes - 콘티 목록 포함 여부 (기본값: true)
   */
  loadProject: async (projectId, options = {}) => {
    set({ isLoading: true, error: null })
    
    try {
      const { includeContes = true } = options
      const response = await getProject(projectId, { includeContes })
      
      set({ 
        currentProject: response.data.project,
        currentProjectContes: response.data.conteList || [],
        isLoading: false 
      })
    } catch (error) {
      set({ 
        error: error.message || '프로젝트를 불러오는데 실패했습니다.',
        isLoading: false 
      })
    }
  },

  /**
   * 실시간 업데이트 활성화
   */
  enableRealtimeUpdates: () => {
    set({ isRealtimeEnabled: true })
  },

  /**
   * 실시간 업데이트 비활성화
   */
  disableRealtimeUpdates: () => {
    set({ isRealtimeEnabled: false })
  },

  /**
   * 프로젝트 상태 실시간 업데이트
   * @param {string} projectId - 프로젝트 ID
   */
  updateProjectStatus: async (projectId) => {
    try {
      const response = await getProject(projectId)
      const updatedProject = response.data
      
      // 현재 프로젝트 목록에서 해당 프로젝트 업데이트
      set(state => ({
        projects: state.projects.map(project => 
          project._id === projectId || project.id === projectId 
            ? updatedProject 
            : project
        ),
        currentProject: state.currentProject?._id === projectId || state.currentProject?.id === projectId
          ? updatedProject
          : state.currentProject,
        lastUpdateTime: new Date().toISOString()
      }))
      
    } catch (error) {
      console.error('❌ 프로젝트 상태 업데이트 실패:', error)
    }
  },

  /**
   * 자동 저장 기능 강화
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} data - 저장할 데이터
   */
  autoSaveProject: async (projectId, data) => {
    try {
      
      // 프로젝트 업데이트
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        set({ lastUpdateTime: new Date().toISOString() })
      } else {
        throw new Error('자동 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ 자동 저장 실패:', error)
    }
  },

  /**
   * 스토리와 콘티를 통합하여 프로젝트로 저장
   * @param {string} synopsis - 시놉시스
   * @param {string} story - 생성된 스토리
   * @param {Array} conteList - 생성된 콘티 리스트
   * @param {Object} settings - 프로젝트 설정
   */
  saveStoryAndConteAsProject: async (synopsis, story, conteList, settings = {}) => {
    try {
      // 프로젝트 데이터 구성
      const projectData = {
        projectTitle: settings.projectTitle || `스토리 프로젝트 - ${new Date().toLocaleDateString()}`,
        synopsis: synopsis,
        story: story,
        storyLength: story.length,
        storyCreatedAt: new Date().toISOString(),
        conteCount: conteList.length,
        conteCreatedAt: new Date().toISOString(),
        settings: {
          genre: settings.genre || '일반',
          type: 'story_with_conte',
          estimatedDuration: settings.estimatedDuration || '미정',
          ...settings
        }
      }

      // 프로젝트 생성 (콘티 포함)
      const newProject = await get().createProject(projectData, conteList)
      
      return {
        success: true,
        projectId: newProject._id || newProject.id,
        project: newProject
      }
      
    } catch (error) {
      console.error('❌ 프로젝트 저장 실패:', error)
      throw error
    }
  },

  /**
   * 현재 프로젝트 초기화
   */
  clearCurrentProject: () => {
    set({ currentProject: null })
  },

  /**
   * 에러 초기화
   */
  clearError: () => {
    set({ error: null, createError: null, saveConteError: null })
  }
}))

export default useProjectStore 