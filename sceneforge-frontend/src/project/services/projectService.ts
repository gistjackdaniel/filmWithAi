import { createApiClient } from '../../shared/services/api';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectResponse
} from '../../shared/types/project';

// 프로젝트 도메인 전용 API 클라이언트
const projectApi = createApiClient();

// 프로젝트 관련 API 엔드포인트
const projectEndpoints = {
  projects: '/project',
  project: (id: string) => `/project/${id}`,
  projectScenes: (id: string) => `/project/${id}/scene`,
  projectCuts: (id: string) => `/project/${id}/scene/cut`,
};

// 통합된 프로젝트 서비스 (API + 비즈니스 로직)
export const projectService = {
  // ===== API 호출 메서드 =====
  
  // 프로젝트 목록 조회
  getProjects: async (): Promise<Project[]> => {
    const response = await projectApi.get(projectEndpoints.projects);
    return response.data;
  },

  // 프로젝트 상세 조회
  getProject: async (id: string): Promise<Project> => {
    const response = await projectApi.get(projectEndpoints.project(id));
    return response.data;
  },

  // 프로젝트 생성
        createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
        const response = await projectApi.post(projectEndpoints.projects, projectData);
        return response.data;
      },

      // 프로젝트 수정
      updateProject: async (id: string, projectData: UpdateProjectRequest): Promise<Project> => {
        const response = await projectApi.patch(projectEndpoints.project(id), projectData);
        return response.data;
      },

  // 프로젝트 삭제
  deleteProject: async (id: string): Promise<void> => {
    const response = await projectApi.delete(projectEndpoints.project(id));
    return response.data;
  },

  // 프로젝트의 씬 목록 조회
  getProjectScenes: async (projectId: string) => {
    const response = await projectApi.get(projectEndpoints.projectScenes(projectId));
    return response.data;
  },

  // 프로젝트의 컷 목록 조회
  getProjectCuts: async (projectId: string) => {
    const response = await projectApi.get(projectEndpoints.projectCuts(projectId));
    return response.data;
  },

  // ===== 비즈니스 로직 메서드 =====
  
  // 즐겨찾기 프로젝트 조회
  getFavoriteProjects: async (): Promise<Project[]> => {
    const response = await projectApi.get('/project/favorite');
    return response.data;
  },

        // 삭제된 프로젝트 복원
      restoreProject: async (projectId: string): Promise<Project> => {
        return await projectService.updateProject(projectId, { isDeleted: false });
      },

      // 스토리 생성
      generateStory: async (projectId: string): Promise<Project> => {
        return await projectService.updateProject(projectId, { 
          storyGenerated: true,
          storyGeneratedAt: new Date().toISOString()
        });
      },

      // 시놉시스로부터 스토리 생성
      generateStoryFromSynopsis: async (synopsis: string): Promise<{ story: string }> => {
        const response = await projectService.createProject({ 
          title: 'Generated Story',
          synopsis,
          storyGenerated: true,
          storyGeneratedAt: new Date().toISOString()
        });
        return { story: response.story || '' };
      },

        // 프로젝트 복제
      duplicateProject: async (projectId: string): Promise<Project> => {
        const originalProject = await projectService.getProject(projectId);
        const { _id, createdAt, updatedAt, ...projectData } = originalProject;
        
        return await projectService.createProject({
          ...projectData,
          title: `${projectData.title} (복사본)`,
        });
      },

  // 프로젝트 검색
  searchProjects: async (query: string): Promise<Project[]> => {
    const projects = await projectService.getProjects();
    return projects.filter((project: Project) => 
      project.title.toLowerCase().includes(query.toLowerCase()) ||
      project.synopsis?.toLowerCase().includes(query.toLowerCase())
    );
  },
}; 