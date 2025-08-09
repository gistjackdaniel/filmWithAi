
// Scene 도메인 상수
export const SCENE_CONSTANTS = {
  DEFAULT_MAX_SCENES: 5,
  DEFAULT_ESTIMATED_DURATION: '5분',
  DEFAULT_SCENE_TYPE: 'live_action',
};

// API 엔드포인트
export const API_ENDPOINTS = {
  PROJECTS: {
    GET: (projectId: string) => `/project/${projectId}`,
    CREATE: '/project',
    UPDATE: (projectId: string) => `/project/${projectId}`,
    DELETE: (projectId: string) => `/project/${projectId}`,
  },
  SCENES: {
    GET: (projectId: string) => `/project/${projectId}/scene`,
    CREATE: (projectId: string) => `/project/${projectId}/scene`,
    UPDATE: (projectId: string, sceneId: string) => `/project/${projectId}/scene/${sceneId}`,
    DELETE: (projectId: string, sceneId: string) => `/project/${projectId}/scene/${sceneId}`,
  },
}; 