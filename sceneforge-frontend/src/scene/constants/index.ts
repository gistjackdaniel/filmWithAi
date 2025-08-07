
// Scene 도메인 상수
export const SCENE_CONSTANTS = {
  DEFAULT_MAX_SCENES: 5,
  DEFAULT_ESTIMATED_DURATION: '5분',
  DEFAULT_SCENE_TYPE: 'live_action',
};

// API 엔드포인트
export const API_ENDPOINTS = {
  PROJECTS: {
    GET: (projectId: string) => `/projects/${projectId}`,
    CREATE: '/projects',
    UPDATE: (projectId: string) => `/projects/${projectId}`,
    DELETE: (projectId: string) => `/projects/${projectId}`,
  },
  SCENES: {
    GET: (projectId: string) => `/projects/${projectId}/scenes`,
    CREATE: (projectId: string) => `/projects/${projectId}/scenes`,
    UPDATE: (projectId: string, sceneId: string) => `/projects/${projectId}/scenes/${sceneId}`,
    DELETE: (projectId: string, sceneId: string) => `/projects/${projectId}/scenes/${sceneId}`,
  },
}; 