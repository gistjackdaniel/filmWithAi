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