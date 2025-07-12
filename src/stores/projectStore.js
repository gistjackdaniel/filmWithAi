import { create } from 'zustand'
import { projectAPI, conteAPI } from '../services/api'

/**
 * 프로젝트 관리 스토어
 * Zustand를 사용하여 프로젝트 및 콘티 데이터를 전역적으로 관리
 * MongoDB 연동으로 사용자별 프로젝트 데이터 영구 저장
 */
const useProjectStore = create((set, get) => ({
  // ===== 상태 (State) =====
  projects: [], // 사용자의 프로젝트 목록
  currentProject: null, // 현재 선택된 프로젝트
  contes: [], // 현재 프로젝트의 콘티 목록
  loading: false, // 로딩 상태
  error: null, // 오류 상태

  // ===== 액션 (Actions) =====

  /**
   * 로딩 상태 설정
   * @param {boolean} loading - 로딩 상태
   */
  setLoading: (loading) => set({ loading }),

  /**
   * 오류 상태 설정
   * @param {string|null} error - 오류 메시지
   */
  setError: (error) => set({ error }),

  /**
   * 프로젝트 목록 설정
   * @param {Array} projects - 프로젝트 목록
   */
  setProjects: (projects) => set({ projects }),

  /**
   * 현재 프로젝트 설정
   * @param {Object|null} project - 프로젝트 정보
   */
  setCurrentProject: (project) => set({ currentProject: project }),

  /**
   * 콘티 목록 설정
   * @param {Array} contes - 콘티 목록
   */
  setContes: (contes) => set({ contes }),

  /**
   * 프로젝트 생성
   * @param {Object} projectData - 프로젝트 데이터
   * @returns {Promise<Object>} 생성 결과
   */
  createProject: async (projectData) => {
    try {
      set({ loading: true, error: null })
      
      const response = await projectAPI.createProject(projectData)
      const newProject = response.data.data.project
      
      // 프로젝트 목록에 새 프로젝트 추가
      const currentProjects = get().projects
      set({ projects: [newProject, ...currentProjects] })
      
      set({ loading: false })
      return { success: true, project: newProject }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 사용자의 프로젝트 목록 조회
   * @param {Object} params - 조회 파라미터
   * @returns {Promise<Object>} 조회 결과
   */
  fetchProjects: async (params = {}) => {
    try {
      set({ loading: true, error: null })
      
      const response = await projectAPI.getProjects(params)
      const projects = response.data.data.projects
      
      set({ projects, loading: false })
      return { success: true, projects }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 특정 프로젝트 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 조회 결과
   */
  fetchProject: async (projectId) => {
    try {
      set({ loading: true, error: null })
      
      const response = await projectAPI.getProject(projectId)
      const { project, contes } = response.data.data
      
      set({ 
        currentProject: project, 
        contes: contes || [],
        loading: false 
      })
      
      return { success: true, project, contes }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} updateData - 업데이트 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  updateProject: async (projectId, updateData) => {
    try {
      set({ loading: true, error: null })
      
      const response = await projectAPI.updateProject(projectId, updateData)
      const updatedProject = response.data.data.project
      
      // 프로젝트 목록에서 해당 프로젝트 업데이트
      const currentProjects = get().projects
      const updatedProjects = currentProjects.map(project => 
        project.id === projectId ? updatedProject : project
      )
      
      // 현재 프로젝트도 업데이트
      const currentProject = get().currentProject
      if (currentProject && currentProject.id === projectId) {
        set({ currentProject: updatedProject })
      }
      
      set({ projects: updatedProjects, loading: false })
      return { success: true, project: updatedProject }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트 삭제
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  deleteProject: async (projectId) => {
    try {
      set({ loading: true, error: null })
      
      await projectAPI.deleteProject(projectId)
      
      // 프로젝트 목록에서 해당 프로젝트 제거
      const currentProjects = get().projects
      const filteredProjects = currentProjects.filter(project => project.id !== projectId)
      
      // 현재 프로젝트가 삭제된 프로젝트라면 초기화
      const currentProject = get().currentProject
      if (currentProject && currentProject.id === projectId) {
        set({ currentProject: null, contes: [] })
      }
      
      set({ projects: filteredProjects, loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 콘티 생성
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} conteData - 콘티 데이터
   * @returns {Promise<Object>} 생성 결과
   */
  createConte: async (projectId, conteData) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.createConte(projectId, conteData)
      const newConte = response.data.data.conte
      
      // 콘티 목록에 새 콘티 추가
      const currentContes = get().contes
      set({ contes: [...currentContes, newConte] })
      
      set({ loading: false })
      return { success: true, conte: newConte }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 프로젝트의 콘티 목록 조회
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} params - 조회 파라미터
   * @returns {Promise<Object>} 조회 결과
   */
  fetchContes: async (projectId, params = {}) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.getContes(projectId, params)
      const contes = response.data.data.contes
      
      set({ contes, loading: false })
      return { success: true, contes }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 콘티 업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {string} conteId - 콘티 ID
   * @param {Object} updateData - 업데이트 데이터
   * @returns {Promise<Object>} 업데이트 결과
   */
  updateConte: async (projectId, conteId, updateData) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.updateConte(projectId, conteId, updateData)
      const updatedConte = response.data.data.conte
      
      // 콘티 목록에서 해당 콘티 업데이트
      const currentContes = get().contes
      const updatedContes = currentContes.map(conte => 
        conte.id === conteId ? updatedConte : conte
      )
      
      set({ contes: updatedContes, loading: false })
      return { success: true, conte: updatedConte }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 콘티 순서 변경
   * @param {string} projectId - 프로젝트 ID
   * @param {Array} conteOrders - 콘티 순서 배열
   * @returns {Promise<Object>} 변경 결과
   */
  reorderContes: async (projectId, conteOrders) => {
    try {
      set({ loading: true, error: null })
      
      await conteAPI.reorderContes(projectId, conteOrders)
      
      // 콘티 목록 다시 조회
      await get().fetchContes(projectId)
      
      set({ loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 콘티 삭제
   * @param {string} projectId - 프로젝트 ID
   * @param {string} conteId - 콘티 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  deleteConte: async (projectId, conteId) => {
    try {
      set({ loading: true, error: null })
      
      await conteAPI.deleteConte(projectId, conteId)
      
      // 콘티 목록에서 해당 콘티 제거
      const currentContes = get().contes
      const filteredContes = currentContes.filter(conte => conte.id !== conteId)
      
      set({ contes: filteredContes, loading: false })
      return { success: true }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 같은 장소의 콘티들 조회
   * @param {string} projectId - 프로젝트 ID
   * @param {string} location - 장소
   * @returns {Promise<Object>} 조회 결과
   */
  fetchContesByLocation: async (projectId, location) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.getContesByLocation(projectId, location)
      const contes = response.data.data.contes
      
      set({ loading: false })
      return { success: true, contes }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 같은 날짜의 콘티들 조회
   * @param {string} projectId - 프로젝트 ID
   * @param {string} date - 날짜
   * @returns {Promise<Object>} 조회 결과
   */
  fetchContesByDate: async (projectId, date) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.getContesByDate(projectId, date)
      const contes = response.data.data.contes
      
      set({ loading: false })
      return { success: true, contes }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 같은 배우가 출연하는 콘티들 조회
   * @param {string} projectId - 프로젝트 ID
   * @param {string} castMember - 배우명
   * @returns {Promise<Object>} 조회 결과
   */
  fetchContesByCast: async (projectId, castMember) => {
    try {
      set({ loading: true, error: null })
      
      const response = await conteAPI.getContesByCast(projectId, castMember)
      const contes = response.data.data.contes
      
      set({ loading: false })
      return { success: true, contes }
    } catch (error) {
      set({ loading: false, error: error.message })
      return { success: false, error: error.message }
    }
  },

  /**
   * 스토어 초기화
   * 로그아웃 시 호출
   */
  reset: () => {
    set({
      projects: [],
      currentProject: null,
      contes: [],
      loading: false,
      error: null
    })
  }
}))

export default useProjectStore 