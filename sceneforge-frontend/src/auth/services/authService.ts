import { createApiClient } from '../../shared/services/api';
import { storage } from '../../shared/utils/storage';

// 인증 도메인 전용 API 클라이언트
const authApi = createApiClient();

// 인증 관련 API 엔드포인트
const authEndpoints = {
  login: '/auth/login',
  googleCallback: '/auth/google/callback',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  profile: '/auth/profile',
};

// 통합된 인증 서비스 (API + 비즈니스 로직)
export const authService = {
  // ===== API 호출 메서드 =====
  
  // Google OAuth 로그인
  googleLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/auth/google`;
  },

  // 로그아웃
  logout: async () => {
    try {
      await authApi.post(authEndpoints.logout);
      storage.clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로컬 토큰은 제거
      storage.clearAuth();
    }
  },

  // 프로필 조회
  getProfile: async () => {
    const response = await authApi.get(authEndpoints.profile);
    return response.data;
  },

  // 토큰 갱신
  refreshToken: async () => {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await authApi.post(authEndpoints.refresh, {
      refreshToken,
    });
    
    const { access_token, refresh_token } = response.data;
    storage.setTokens({ access_token, refresh_token });
    
    return response.data;
  },

  // ===== 비즈니스 로직 메서드 =====
  
  // 로그인 처리 (API 호출 + 스토리지 저장)
  login: async (accessToken: string) => {
    const response = await authApi.post(authEndpoints.login, {
      access_token: accessToken,
    });
    
    const { access_token, refresh_token, user } = response.data;
    storage.setTokens({ access_token, refresh_token });
    storage.setUser(user);
    
    return response.data;
  },

  // 인증 상태 확인
  isAuthenticated: () => {
    return storage.isAuthenticated();
  },

  // 사용자 정보 가져오기
  getUser: () => {
    return storage.getUser();
  },

  // 토큰 정보 가져오기
  getTokens: () => {
    const accessToken = storage.getAccessToken();
    const refreshToken = storage.getRefreshToken();
    
    if (accessToken && refreshToken) {
      return { access_token: accessToken, refresh_token: refreshToken };
    }
    return null;
  },

  // 회원 탈퇴
  withdraw: async () => {
    const response = await authApi.delete('/auth/withdraw');
    storage.clearAuth();
    return response.data;
  },

  // ===== 스토리지 래퍼 메서드 =====
  
  // 사용자 정보 저장
  saveUserToStorage: (user: any) => {
    storage.setUser(user);
  },

  // 토큰 정보 저장
  saveTokensToStorage: (tokens: { access_token: string; refresh_token: string }) => {
    storage.setTokens(tokens);
  },

  // 사용자 정보 가져오기 (스토리지에서)
  getUserFromStorage: () => {
    return storage.getUser();
  },

  // 토큰 정보 가져오기 (스토리지에서)
  getTokensFromStorage: () => {
    const accessToken = storage.getAccessToken();
    const refreshToken = storage.getRefreshToken();
    
    if (accessToken && refreshToken) {
      return { access_token: accessToken, refresh_token: refreshToken };
    }
    return null;
  },
}; 