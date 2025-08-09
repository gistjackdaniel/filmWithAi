// Project 타입 정의
export interface Project {
  _id: string;
  title: string;
  synopsis?: string;
  story?: string;
  genre?: string[];
  tags?: string[];
  estimatedDuration?: string;
  status?: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
  isPublic?: boolean;
  participants?: string[];
  scenes?: string[];
  lastViewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  synopsis?: string;
  story?: string;
  genre?: string[];
  tags?: string[];
  estimatedDuration?: string;
  isPublic?: boolean;
}

export interface UpdateProjectRequest {
  title?: string;
  synopsis?: string;
  story?: string;
  genre?: string[];
  tags?: string[];
  estimatedDuration?: string;
  status?: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
  isPublic?: boolean;
}

export interface ProjectResponse {
  success: boolean;
  message: string;
  data: {
    project: Project;
  };
  story?: string;
}

export interface ToggleFavoriteResponse {
  project: Project;
  message: string;
}

// Dashboard 관련 타입들
export interface DashboardProject {
  _id: string;
  ownerId: string;
  title: string;
  synopsis: string;
  story?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  status?: 'draft' | 'story_ready' | 'scene_ready'  | 'production_ready';
}

export interface DashboardState {
  projects: DashboardProject[];
  favoriteProjects: DashboardProject[];
  loading: boolean;
  error: string | null;
}

export interface ProjectStatus {
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
} 