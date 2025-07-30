export const ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  AUTH_CALLBACK: '/auth/google/callback',
  PROJECT: '/project',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    WITHDRAW: '/auth/withdraw',
  },
} as const; 