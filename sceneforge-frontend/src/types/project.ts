export interface Project {
  _id: string; // Types.ObjectId -> string
  ownerId: string; // Types.ObjectId -> string
  title: string;
  synopsis?: string;
  story?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string; // Date -> string
  updatedAt: string; // Date -> string
  lastViewedAt: string; // Date -> string
  isDeleted: boolean;
  participants: string[]; // Types.ObjectId[] -> string[]
  scenes: string[]; // Types.ObjectId[] -> string[]
  genre: string[];
  estimatedDuration: string;
  isFavorite?: boolean; // 즐겨찾기 상태
  status?: 'draft' | 'story_ready' | 'scene_ready'  | 'production_ready'; // 프로젝트 상태
}

export interface CreateProjectRequest {
  title: string;
  synopsis?: string;
  story?: string;
  tags?: string[];
  isPublic?: boolean;
  genre: string[];
  estimatedDuration?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  synopsis?: string;
  story?: string;
  tags?: string[];
  isPublic?: boolean;
  genre?: string[];
  estimatedDuration?: string;
}

export interface ProjectResponse extends Project {}

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