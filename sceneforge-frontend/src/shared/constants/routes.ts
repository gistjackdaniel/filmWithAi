// 라우트 상수
export const ROUTES = {
  // 인증
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  AUTH_CALLBACK: '/auth/google/callback',
  
  // 대시보드
  DASHBOARD: '/dashboard',
  
  // 프로젝트
  PROJECTS: '/projects',
  PROJECT: '/project',
  PROJECT_DETAIL: (projectId: string) => `/project/${projectId}`,
  
  // 씬
  SCENE_DETAIL: (projectId: string, sceneId: string) => `/project/${projectId}/scene/${sceneId}`,
  SCENE_DRAFT_DETAIL: (projectId: string, draftOrder: number) => `/project/${projectId}/scene-draft/${draftOrder}`,
  
  // 컷
  CUT_DETAIL: (projectId: string, sceneId: string, cutId: string) => `/project/${projectId}/scene/${sceneId}/cut/${cutId}`,
  CUT_DRAFT_DETAIL: (projectId: string, sceneId: string, draftOrder: number) => `/project/${projectId}/scene/${sceneId}/cut-draft/${draftOrder}`,
  
  // AI 생성
  STORY_GENERATION: '/story-generation',
  SCENE_GENERATION: '/scene-generation',
  
  // 스케줄러
  SCHEDULER: '/scheduler',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    WITHDRAW: '/auth/withdraw',
  },
} as const; 