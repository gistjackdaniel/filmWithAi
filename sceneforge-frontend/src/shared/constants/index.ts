export * from './routes';

export const APP_CONFIG = {
  NAME: 'SceneForge',
  DESCRIPTION: '영화 제작을 위한 AI 기반 프로젝트 관리 플랫폼',
  VERSION: '1.0.0',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    WITHDRAW: '/api/auth/withdraw',
  },
  PROJECTS: {
    LIST: '/api/project',
    CREATE: '/api/project',
    GET: (id: string) => `/api/project/${id}`,
    UPDATE: (id: string) => `/api/project/${id}`,
    DELETE: (id: string) => `/api/project/${id}`,
  },
} as const; 