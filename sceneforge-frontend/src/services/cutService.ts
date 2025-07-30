import api from './api';
import { API_ENDPOINTS } from '../constants';

// Cut Draft (AI generated, not saved to DB)
export interface CutDraft {
  order: number;
  title: string;
  description: string;
  cameraSetup: {
    shotSize: string;
    angleDirection: string;
    cameraMovement: string;
    lensSpecs: string;
    cameraSettings: {
      aperture: string;
      shutterSpeed: string;
      iso: string;
    };
  };
  vfxEffects: string;
  soundEffects: string;
  directorNotes: string;
  dialogue: string;
  narration: string;
  subjectMovement: Array<{
    name: string;
    type: string;
    position: string;
    action: string;
    emotion: string;
    description: string;
  }>;
  productionMethod: string;
  productionMethodReason: string;
  estimatedDuration: number;
  specialRequirements: {
    specialCinematography: {
      drone: boolean;
      crane: boolean;
      jib: boolean;
      underwater: boolean;
      aerial: boolean;
    };
    specialEffects: {
      vfx: boolean;
      pyrotechnics: boolean;
      smoke: boolean;
      fog: boolean;
      wind: boolean;
      rain: boolean;
      snow: boolean;
      fire: boolean;
      explosion: boolean;
      stunt: boolean;
    };
    specialLighting: {
      laser: boolean;
      strobe: boolean;
      blackLight: boolean;
      uvLight: boolean;
      movingLight: boolean;
      colorChanger: boolean;
    };
    safety: {
      requiresMedic: boolean;
      requiresFireSafety: boolean;
      requiresSafetyOfficer: boolean;
    };
  };
}

// 타입 가드 함수들
export const isCutDraft = (cut: Cut | CutDraft): cut is CutDraft => {
  return !('_id' in cut);
};

export const isCut = (cut: Cut | CutDraft): cut is Cut => {
  return '_id' in cut;
};

// Cut (saved to DB)
export interface Cut extends CutDraft {
  _id: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCutDraftRequest {
  maxCuts: number;
}

export const cutService = {
  // 컷 초안 생성 (AI)
  async createDraft(projectId: string, sceneId: string, request: CreateCutDraftRequest): Promise<CutDraft[]> {
    const response = await api.post<CutDraft[]>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut/draft`, request);
    return response.data;
  },

  // 컷 목록 조회
  async findBySceneId(projectId: string, sceneId: string): Promise<Cut[]> {
    const response = await api.get<Cut[]>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut`);
    return response.data;
  },

  // 컷 상세 조회
  async findById(projectId: string, sceneId: string, cutId: string): Promise<Cut> {
    const response = await api.get<Cut>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut/${cutId}`);
    return response.data;
  },

  // 컷 생성
  async create(projectId: string, sceneId: string, cutData: Partial<Cut>): Promise<Cut> {
    const response = await api.post<Cut>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut`, cutData);
    return response.data;
  },

  // 컷 업데이트
  async update(projectId: string, sceneId: string, cutId: string, cutData: Partial<Cut>): Promise<Cut> {
    const response = await api.put<Cut>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut/${cutId}`, cutData);
    return response.data;
  },

  // 컷 삭제
  async delete(projectId: string, sceneId: string, cutId: string): Promise<Cut> {
    const response = await api.delete<Cut>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut/${cutId}`);
    return response.data;
  },

  // 컷 이미지 생성
  async generateImage(projectId: string, sceneId: string, cutId: string): Promise<string> {
    const response = await api.post<string>(`${API_ENDPOINTS.PROJECTS.GET(projectId)}/scene/${sceneId}/cut/${cutId}/image/generate`);
    return response.data;
  }
}; 