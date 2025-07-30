import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

/**
 * 인증 상태 관리 스토어
 * Zustand를 사용하여 사용자 인증 상태를 전역적으로 관리
 * 로컬 스토리지에 인증 정보를 영구 저장
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== 상태 (State) =====
      user: null, // 현재 로그인한 사용자 정보
      isAuthenticated: false, // 인증 상태 플래그
      loading: true, // 로딩 상태 (초기 인증 확인 중)
      token: null, // JWT 토큰
      refreshToken: null, // 리프레시 토큰
      autoLogoutTimer: null, // 자동 로그아웃 타이머

      // ===== 액션 (Actions) =====
      
      /**
       * 로딩 상태 설정
       * @param {boolean} loading - 로딩 상태
       */
      setLoading: (loading) => set({ loading }),
      
      /**
       * 사용자 정보 설정 및 인증 상태 업데이트
       * @param {Object} user - 사용자 정보 객체
       */
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      /**
       * JWT 토큰 설정 및 API 헤더 업데이트
       * @param {string} token - JWT 토큰
       */
      setToken: (token) => {
        set({ token });
        if (token) {
          // 토큰이 있으면 API 요청 헤더에 추가
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // 보안 강화: 토큰을 세션 스토리지에도 저장 (httpOnly 쿠키 대안)
          try {
            sessionStorage.setItem('auth-token', token);
          } catch (error) {
            console.warn('Failed to store token in sessionStorage:', error);
          }
        } else {
          // 토큰이 없으면 헤더에서 제거
          delete api.defaults.headers.common['Authorization'];
          
          // 세션 스토리지에서도 제거
          try {
            sessionStorage.removeItem('auth-token');
          } catch (error) {
            console.warn('Failed to remove token from sessionStorage:', error);
          }
        }
      },

      /**
       * 리프레시 토큰 설정
       * @param {string} refreshToken - 리프레시 토큰
       */
      setRefreshToken: (refreshToken) => {
        set({ refreshToken });
        if (refreshToken) {
          try {
            sessionStorage.setItem('refresh-token', refreshToken);
          } catch (error) {
            console.warn('Failed to store refresh token in sessionStorage:', error);
          }
        } else {
          try {
            sessionStorage.removeItem('refresh-token');
          } catch (error) {
            console.warn('Failed to remove refresh token from sessionStorage:', error);
          }
        }
      },

      /**
       * Google OAuth 로그인 처리
       * @param {string} accessToken - Google OAuth access token
       * @returns {Object} 로그인 결과 { success: boolean, error?: string }
       */
      login: async (accessToken) => {
        try {
          set({ loading: true });
          
          // NestJS 백엔드에 Google access token 전송하여 JWT 토큰 받기
          const response = await api.post('/auth/login', { access_token: accessToken });
          const { access_token, refresh_token, user } = response.data;
          
          // 토큰과 사용자 정보 설정
          get().setToken(access_token);
          get().setRefreshToken(refresh_token);
          get().setUser(user);
          
          // 자동 로그아웃 타이머 설정
          get().setAutoLogoutTimer();
          
          set({ loading: false });
          
          return { success: true };
        } catch (error) {
          set({ loading: false });
          return { success: false, error: error.message };
        }
      },

      /**
       * 로그아웃 처리
       * 모든 인증 정보를 초기화
       */
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          token: null,
          refreshToken: null,
          loading: false, 
        });
        get().setToken(null);
        get().setRefreshToken(null);
      },

      /**
       * 토큰 만료 확인
       * @param {string} token - JWT 토큰
       * @returns {boolean} 토큰이 만료되었는지 여부
       */
      isTokenExpired: (token) => {
        if (!token) return true;
        
        try {
          // JWT 토큰의 페이로드 부분을 디코드
          const payload = JSON.parse(atob(token.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          // 토큰 만료 시간 확인 (exp 필드)
          return payload.exp < currentTime;
        } catch (error) {
          console.error('Token decode error:', error);
          return true;
        }
      },

      /**
       * 토큰 갱신
       * @returns {Promise<boolean>} 갱신 성공 여부
       */
      refreshToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          if (!currentRefreshToken) {
            return false;
          }

          // NestJS 백엔드에 토큰 갱신 요청
          const response = await api.post('/auth/refresh', {
            refresh_token: currentRefreshToken,
          });
          
          const { access_token: newToken, expires_in } = response.data;
          
          // 새 토큰 설정
          get().setToken(newToken);
          console.log('Token refreshed successfully');
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          // 갱신 실패 시 로그아웃
          get().logout();
          return false;
        }
      },

      /**
       * 강제 인증 갱신 (401 오류 시 사용)
       * @returns {Promise<Object>} 갱신 결과
       */
      forceAuthRefresh: async () => {
        try {
          const result = await get().refreshToken();
          return { success: result };
        } catch (error) {
          console.error('Force auth refresh failed:', error);
          return { success: false, error: error.message };
        }
      },

      /**
       * 인증 상태 확인
       * 저장된 토큰으로 서버에 인증 상태 확인 요청
       */
      checkAuth: async () => {
        try {
          const token = get().token;
          if (!token) {
            // 토큰이 없으면 로딩 상태만 해제
            set({ loading: false });
            return;
          }

          // 토큰 만료 확인
          if (get().isTokenExpired(token)) {
            console.log('Token expired, attempting refresh...');
            // 토큰 갱신 시도
            const refreshSuccess = await get().refreshToken();
            if (!refreshSuccess) {
              console.log('Token refresh failed, logging out...');
              get().logout();
              return;
            }
          }

          // NestJS 백엔드에 현재 사용자 정보 요청
          const response = await api.get('/profile');
          get().setUser(response.data);
          set({ loading: false });
        } catch (error) {
          console.error('Auth check error:', error);
          // 인증 실패 시 로그아웃 처리
          get().logout();
        }
      },

      /**
       * 자동 로그아웃 타이머 설정
       * @param {number} timeoutMinutes - 타임아웃 시간 (분)
       */
      setAutoLogoutTimer: (timeoutMinutes = 30) => {
        // 기존 타이머 제거
        const currentTimer = get().autoLogoutTimer;
        if (currentTimer) {
          clearTimeout(currentTimer);
        }

        // 새 타이머 설정 (30분 기본값)
        const timer = setTimeout(() => {
          console.log('Auto logout due to inactivity');
          get().logout();
          // 사용자에게 알림 (선택사항)
          if (typeof window !== 'undefined' && window.toast) {
            window.toast.warning('장시간 미사용으로 자동 로그아웃되었습니다.');
          }
        }, timeoutMinutes * 60 * 1000);

        set({ autoLogoutTimer: timer });
      },

      /**
       * 자동 로그아웃 타이머 리셋
       * 사용자 활동 시 호출
       */
      resetAutoLogoutTimer: () => {
        get().setAutoLogoutTimer();
      },

      /**
       * 세션 동기화 설정
       * 브라우저 탭 간 인증 상태 동기화
       */
      setupSessionSync: () => {
        // 다른 탭에서 로그아웃 시 현재 탭도 로그아웃
        window.addEventListener('storage', (event) => {
          if (event.key === 'auth-storage' && event.newValue === null) {
            console.log('Session sync: logging out due to other tab logout');
            get().logout();
          }
        });

        // 페이지 언로드 시 세션 정리
        window.addEventListener('beforeunload', () => {
          // 필요한 경우 세션 정리 로직
        });

        // 사용자 활동 감지 (자동 로그아웃 타이머 리셋)
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
          document.addEventListener(event, () => {
            if (get().isAuthenticated) {
              get().resetAutoLogoutTimer();
            }
          });
        });
      },

      /**
       * 앱 초기화
       * 앱 시작 시 저장된 인증 정보로 인증 상태 확인
       */
      initialize: async () => {
        try {
          // 세션 동기화 설정
          get().setupSessionSync();
          
          await get().checkAuth();
        } catch (error) {
          console.error('App initialization error:', error);
          // 초기화 실패 시 로그아웃 상태로 설정
          set({ 
            user: null, 
            isAuthenticated: false, 
            token: null,
            refreshToken: null,
            loading: false, 
          });
        }
      },
    }),
    {
      // 로컬 스토리지 설정
      name: 'auth-storage', // 스토리지 키 이름
      partialize: (state) => ({ 
        // 영구 저장할 상태만 선택
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated, 
      }),
    },
  ),
);

export { useAuthStore }; 