import { STORAGE_KEYS } from '../constants';

export const storage = {
  // 토큰 관련
  getAccessToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  
  setAccessToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },
  
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  
  setRefreshToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },
  
  // 사용자 정보 관련
  getUser: (): any => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  setUser: (user: any): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  // 토큰들 한번에 설정
  setTokens: (tokens: { access_token: string; refresh_token: string }): void => {
    storage.setAccessToken(tokens.access_token);
    storage.setRefreshToken(tokens.refresh_token);
  },
  
  // 모든 인증 데이터 삭제
  clearAuth: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  // 인증 상태 확인
  isAuthenticated: (): boolean => {
    return !!storage.getAccessToken();
  },
}; 