import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '../types/project';
import { projectService } from '../services/projectService';

interface ProjectState {
  // 상태
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  showFavorites: boolean;

  // 액션
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowFavorites: (show: boolean) => void;

  // API 액션
  fetchProjects: () => Promise<void>;
  fetchFavoriteProjects: () => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (projectData: CreateProjectRequest) => Promise<void>;
  updateProject: (projectId: string, projectData: UpdateProjectRequest) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  generateStory: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      projects: [],
      currentProject: null,
      isLoading: false,
      error: null,
      showFavorites: false,

      // 상태 설정 액션
      setProjects: (projects: Project[]) => set({ projects }),
      setCurrentProject: (currentProject: Project | null) => set({ currentProject }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
      setShowFavorites: (showFavorites: boolean) => set({ showFavorites }),

      // API 액션
      fetchProjects: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const projects = await projectService.getProjects();
          set({ projects, showFavorites: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '프로젝트 목록을 불러오는데 실패했습니다.' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchFavoriteProjects: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const projects = await projectService.getFavoriteProjects();
          set({ projects, showFavorites: true });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '즐겨찾기 프로젝트를 불러오는데 실패했습니다.' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchProject: async (projectId: string) => {
        console.log('🔍 projectStore: fetchProject called with projectId =', projectId);
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectService.getProject(projectId);
          console.log('🔍 projectStore: API response =', response);
          set({ currentProject: response });
        } catch (error: any) {
          console.error('🔍 projectStore: API error =', error);
          set({ 
            error: error.response?.data?.message || '프로젝트 정보를 불러오는데 실패했습니다.' 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      createProject: async (projectData: CreateProjectRequest): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          await projectService.createProject(projectData);
          // 프로젝트 생성 후 목록을 다시 불러옴
          const projects = await projectService.getProjects();
          set({ projects, showFavorites: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '프로젝트 생성에 실패했습니다.' 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateProject: async (projectId: string, projectData: UpdateProjectRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          await projectService.updateProject(projectId, projectData);
          // 프로젝트 수정 후 목록을 다시 불러옴
          const projects = await projectService.getProjects();
          set({ projects, showFavorites: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '프로젝트 수정에 실패했습니다.' 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await projectService.deleteProject(projectId);
          set((state) => ({
            projects: state.projects.filter(project => project._id !== projectId),
            currentProject: state.currentProject?._id === projectId ? null : state.currentProject,
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '프로젝트 삭제에 실패했습니다.' 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      restoreProject: async (projectId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectService.restoreProject(projectId);
          set((state) => ({
            projects: state.projects.map(project => 
              project._id === projectId ? response : project
            ),
            currentProject: response,
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '프로젝트 복원에 실패했습니다.' 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      generateStory: async (projectId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await projectService.generateStory(projectId);
          set((state) => ({
            projects: state.projects.map(project => 
              project._id === projectId ? response : project
            ),
            currentProject: response,
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || '스토리 생성에 실패했습니다.' 
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'project-store',
    }
  )
); 