import axios from 'axios';
import { cutService } from '../../cut/services/cutService';

const api = axios.create({ baseURL: 'http://localhost:5001/api' });

export type CreateTimelineClipDto = {
  sceneId?: string;
  sourceCutId?: string;
  title: string;
  description?: string;
  duration: number;
  type: 'uploaded' | 'ai_generated';
  videoUrl?: string;
  track?: 'V2' | 'V3';
  order?: number;
};

export const timelineClipService = {
  async list(projectId: string) {
    const { data } = await api.get(`/project/${projectId}/video`);
    return data;
  },
  async create(projectId: string, dto: CreateTimelineClipDto) {
    const { data } = await api.post(`/project/${projectId}/video`, dto);
    return data;
  },
  async generateFromCut(projectId: string, payload: {
    sourceCutId: string;
    sceneId?: string;
    prompt?: string;
    resolution?: '720p' | '1080p';
    duration?: '8s';
    generate_audio?: boolean;
    track: 'V2' | 'V3';
  }) {
    // 컷 정보를 먼저 조회하여 메타데이터 확인
    let cutInfo = null;
    if (payload.sceneId) {
      try {
        cutInfo = await cutService.findById(projectId, payload.sceneId, payload.sourceCutId);
        console.log('컷 메타데이터 조회 완료:', {
          title: cutInfo.title,
          description: cutInfo.description,
          dialogue: cutInfo.dialogue,
          narration: cutInfo.narration,
          imageUrl: cutInfo.imageUrl
        });
      } catch (error) {
        console.warn('컷 정보 조회 실패:', error);
      }
    }

    // 컷 메타데이터는 백엔드에서 직접 조회하도록 수정
    // cutMetadata 필드를 제거하고 기본 payload만 전송
    const requestPayload = {
      ...payload
    };

    const { data } = await api.post(`/project/${projectId}/video/generate`, requestPayload);
    return data;
  },
  async remove(projectId: string, id: string) {
    const { data } = await api.delete(`/project/${projectId}/video/${id}`);
    return data;
  }
};


