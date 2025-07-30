import api from './api';
import { API_ENDPOINTS } from '../constants';
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectResponse
} from '../types/project';

export const projectService = {
  // 프로젝트 목록 조회 (페이지네이션 없음)
  async getProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>(API_ENDPOINTS.PROJECTS.LIST);
    return response.data;
  },

  // 즐겨찾기 프로젝트 목록 조회
  async getFavoriteProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>(`${API_ENDPOINTS.PROJECTS.LIST}/favorite`);
    return response.data;
  },

  // 프로젝트 상세 조회
  async getProject(projectId: string): Promise<ProjectResponse> {
    const response = await api.get<ProjectResponse>(API_ENDPOINTS.PROJECTS.GET(projectId));
    return response.data;
  },

  // 프로젝트 생성
  async createProject(projectData: CreateProjectRequest): Promise<ProjectResponse> {
    const response = await api.post<ProjectResponse>(API_ENDPOINTS.PROJECTS.CREATE, projectData);
    return response.data;
  },

  // 프로젝트 수정
  async updateProject(projectId: string, projectData: UpdateProjectRequest): Promise<ProjectResponse> {
    const response = await api.patch<ProjectResponse>(API_ENDPOINTS.PROJECTS.UPDATE(projectId), projectData);
    return response.data;
  },

  // 프로젝트 삭제
  async deleteProject(projectId: string): Promise<ProjectResponse> {
    const response = await api.delete<ProjectResponse>(API_ENDPOINTS.PROJECTS.DELETE(projectId));
    return response.data;
  },

  // 프로젝트 복원
  async restoreProject(projectId: string): Promise<ProjectResponse> {
    const response = await api.post<ProjectResponse>(`${API_ENDPOINTS.PROJECTS.DELETE(projectId)}/restore`);
    return response.data;
  },

  // 스토리 생성
  async generateStory(projectId: string): Promise<ProjectResponse> {
    const response = await api.post<ProjectResponse>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/generate-story`);
    return response.data;
  },

  // 시놉시스 기반 스토리 생성
  async generateStoryFromSynopsis(synopsis: string): Promise<{ story: string }> {
    const response = await api.post<{ story: string }>('/api/project/story-generate', { synopsis });
    return response.data;
  },
}; 