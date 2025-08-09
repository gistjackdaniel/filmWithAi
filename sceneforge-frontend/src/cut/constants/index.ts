// Cut 도메인 상수
export const CUT_CONSTANTS = {
  DEFAULT_MAX_CUTS: 3,
  DEFAULT_ESTIMATED_DURATION: 5,
  DEFAULT_CUT_TYPE: 'medium_shot',
};

// API 엔드포인트
export const API_ENDPOINTS = {
  PROJECTS: {
    GET: (projectId: string) => `/project/${projectId}`,
    CREATE: '/project',
    UPDATE: (projectId: string) => `/project/${projectId}`,
    DELETE: (projectId: string) => `/project/${projectId}`,
  },
  CUTS: {
    GET: (projectId: string, sceneId: string) => `/project/${projectId}/scene/${sceneId}/cut`,
    CREATE: (projectId: string, sceneId: string) => `/project/${projectId}/scene/${sceneId}/cut`,
    UPDATE: (projectId: string, sceneId: string, cutId: string) => `/project/${projectId}/scene/${sceneId}/cut/${cutId}`,
    DELETE: (projectId: string, sceneId: string, cutId: string) => `/project/${projectId}/scene/${sceneId}/cut/${cutId}`,
  },
}; 