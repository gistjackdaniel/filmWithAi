import api from './api';
import { storage } from '../utils/storage';
import { API_ENDPOINTS } from '../constants';
import type { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../types/auth';

export const authService = {
  // Google OAuth 로그인
  async login(accessToken: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      access_token: accessToken,
    });
    return response.data;
  },

  // 토큰 갱신
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  // 회원 탈퇴
  async withdraw(): Promise<{ message: string; deletedUserId: string }> {
    const response = await api.delete(API_ENDPOINTS.AUTH.WITHDRAW);
    return response.data;
  },

  // 스토리지 유틸리티 래퍼
  getUserFromStorage: storage.getUser,
  saveUserToStorage: storage.setUser,
  getTokensFromStorage() {
    const accessToken = storage.getAccessToken();
    const refreshToken = storage.getRefreshToken();
    
    if (accessToken && refreshToken) {
      return { access_token: accessToken, refresh_token: refreshToken };
    }
    return null;
  },
  saveTokensToStorage: storage.setTokens,
  logout: storage.clearAuth,
  isAuthenticated: storage.isAuthenticated,
}; 