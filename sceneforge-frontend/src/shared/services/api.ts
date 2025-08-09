import axios from 'axios';
import { STORAGE_KEYS } from '../constants';

// 공통 API 설정 - 도메인별 API에서 확장하여 사용
export const createApiClient = (baseURL?: string) => {
  const api = axios.create({
    baseURL: baseURL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
    timeout: 60000, // 60초로 증가 (AI 생성 시간 고려)
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터 - 토큰 추가
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터 - 에러 처리
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // 토큰 만료 시 로그아웃 처리
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// 기본 API 클라이언트 (기존 호환성을 위해)
export default createApiClient(); 