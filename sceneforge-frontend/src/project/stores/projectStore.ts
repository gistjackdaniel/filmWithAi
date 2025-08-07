import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest 
} from '../../shared/types/project';
import { projectService } from '../services/projectService';

interface ProjectState {
  // 기존 상태
  currentProject: Project | null;
  projects: Project[];
  
  // Dashboard 관련 상태
  favoriteProjects: Project[];
  loading: boolean;
  error: string | null;
  togglingFavorite: string | null;
  deletingProject: string | null;
  isLoading: boolean;
  showFavorites: boolean;

  // 기존 액션들
  setCurrentProject: (project: Project | null) => void;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (projectData: CreateProjectRequest) => Promise<void>;
  updateProject: (projectId: string, projectData: UpdateProjectRequest) => Promise<void>;
  generateStory: (projectId: string) => Promise<void>;
  
  // Dashboard 관련 액션들
  fetchProjects: () => Promise<void>;
  fetchFavoriteProjects: () => Promise<void>;
  toggleFavorite: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setShowFavorites: (show: boolean) => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      currentProject: null,
      projects: [],
      favoriteProjects: [],
      loading: false,
      error: null,
      togglingFavorite: null,
      deletingProject: null,
      isLoading: false,
      showFavorites: false,

      // 기존 액션들
      setCurrentProject: (project) => set({ currentProject: project }),

      fetchProject: async (projectId: string) => {
        set({ loading: true, error: null });
        try {
          const project = await projectService.getProject(projectId);
          set({ currentProject: project, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로젝트를 가져오는데 실패했습니다.',
            loading: false 
          });
        }
      },

      createProject: async (projectData) => {
        try {
          const project = await projectService.createProject(projectData);
          set((state) => ({
            projects: [...state.projects, project],
            currentProject: project,
          }));
        } catch (error) {
          console.error('프로젝트 생성 실패:', error);
          throw error;
        }
      },

      updateProject: async (projectId, projectData) => {
        try {
          // UpdateProjectRequest 타입에 맞는 필드만 추출
          const updateData: UpdateProjectRequest = {
            title: projectData.title,
            synopsis: projectData.synopsis,
            story: projectData.story,
            tags: projectData.tags,
            isPublic: projectData.isPublic,
            genre: projectData.genre,
            estimatedDuration: projectData.estimatedDuration,
          };
          
          const updatedProject = await projectService.updateProject(projectId, updateData);
          set((state) => ({
            projects: state.projects.map((p) => 
              p._id === projectId ? updatedProject : p
            ),
            currentProject: state.currentProject?._id === projectId ? updatedProject : state.currentProject,
          }));
        } catch (error) {
          console.error('프로젝트 수정 실패:', error);
          throw error;
        }
      },

      generateStory: async (projectId) => {
        try {
          const updatedProject = await projectService.generateStory(projectId);
          set((state) => ({
            projects: state.projects.map((p) => 
              p._id === projectId ? updatedProject : p
            ),
            currentProject: state.currentProject?._id === projectId ? updatedProject : state.currentProject,
          }));
        } catch (error) {
          console.error('스토리 생성 실패:', error);
          throw error;
        }
      },

      // Dashboard 관련 액션들
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const projects = await projectService.getProjects();
          set({ projects, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로젝트 목록을 가져오는데 실패했습니다.',
            loading: false 
          });
        }
      },

      fetchFavoriteProjects: async () => {
        try {
          const favoriteProjects = await projectService.getFavoriteProjects();
          set({ favoriteProjects });
        } catch (error) {
          console.error('즐겨찾기 프로젝트 조회 실패:', error);
        }
      },

      toggleFavorite: async (projectId: string) => {
        set({ togglingFavorite: projectId });
        try {
          // 즐겨찾기 토글 API 호출 (실제 구현 필요)
          // await projectService.toggleProjectFavorite(projectId);
          
          // 로컬 상태 업데이트 (임시)
          const { projects, favoriteProjects } = get();
          const updatedProjects = projects.map(project => 
            project._id === projectId 
              ? { ...project, isFavorite: !project.isFavorite }
              : project
          );
          
          const updatedFavoriteProjects = favoriteProjects.filter(project => 
            project._id !== projectId
          );
          
          set({ 
            projects: updatedProjects,
            favoriteProjects: updatedFavoriteProjects,
            togglingFavorite: null 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '즐겨찾기 상태 변경에 실패했습니다.',
            togglingFavorite: null 
          });
        }
      },

      deleteProject: async (projectId: string) => {
        set({ deletingProject: projectId });
        try {
          await projectService.deleteProject(projectId);
          
          // 로컬 상태에서 제거
          const { projects, favoriteProjects } = get();
          const updatedProjects = projects.filter(project => project._id !== projectId);
          const updatedFavoriteProjects = favoriteProjects.filter(project => project._id !== projectId);
          
          set({ 
            projects: updatedProjects,
            favoriteProjects: updatedFavoriteProjects,
            deletingProject: null 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : '프로젝트 삭제에 실패했습니다.',
            deletingProject: null 
          });
        }
      },

      setShowFavorites: (show: boolean) => {
        set({ showFavorites: show });
      },
    }),
    {
      name: 'project-store',
    }
  )
); 