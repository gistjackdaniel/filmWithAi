// Cut 도메인 상수
export const CUT_CONSTANTS = {
  DEFAULT_MAX_CUTS: 3,
  DEFAULT_ESTIMATED_DURATION: 5,
  DEFAULT_CUT_TYPE: 'medium_shot',
};

// API 엔드포인트
export const API_ENDPOINTS = {
  PROJECTS: {
    GET: (projectId: string) => `/projects/${projectId}`,
    CREATE: '/projects',
    UPDATE: (projectId: string) => `/projects/${projectId}`,
    DELETE: (projectId: string) => `/projects/${projectId}`,
  },
  CUTS: {
    GET: (projectId: string, sceneId: string) => `/projects/${projectId}/scenes/${sceneId}/cuts`,
    CREATE: (projectId: string, sceneId: string) => `/projects/${projectId}/scenes/${sceneId}/cuts`,
    UPDATE: (projectId: string, sceneId: string, cutId: string) => `/projects/${projectId}/scenes/${sceneId}/cuts/${cutId}`,
    DELETE: (projectId: string, sceneId: string, cutId: string) => `/projects/${projectId}/scenes/${sceneId}/cuts/${cutId}`,
  },
}; 