import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types/auth';
import { authService } from '../services/authService';

interface AuthState {
  // 상태
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 액션
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // 인증 액션
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  initializeAuth: () => void;
  
  // API 액션
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithTest: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  withdraw: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // 상태 설정 액션
        setUser: (user: User) => set({ user, isAuthenticated: true }),
        setTokens: (tokens: AuthTokens) => set({ tokens }),
        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),

        // 인증 액션
        login: (user: User, tokens: AuthTokens) => {
          // 스토리지에 저장
          authService.saveUserToStorage(user);
          authService.saveTokensToStorage(tokens);
          
          // 상태 업데이트
          set({ 
            user, 
            tokens, 
            isAuthenticated: true, 
            error: null 
          });
        },

        logout: () => {
          // 스토리지 클리어
          authService.logout();
          
          // 상태 클리어
          set({ 
            user: null, 
            tokens: null, 
            isAuthenticated: false, 
            error: null 
          });
        },

        initializeAuth: () => {
          const savedUser = authService.getUserFromStorage();
          const savedTokens = authService.getTokensFromStorage();
          const isAuthenticated = authService.isAuthenticated();

          if (savedUser && savedTokens && isAuthenticated) {
            set({
              user: savedUser,
              tokens: savedTokens,
              isAuthenticated: true,
            });
          }
        },

        // API 액션
        loginWithGoogle: async (accessToken: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login(accessToken);
            get().login(response.user, {
              access_token: response.access_token,
              refresh_token: response.refresh_token,
            });
          } catch (error: any) {
            set({ 
              error: error.response?.data?.message || '로그인에 실패했습니다.',
              isLoading: false 
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        loginWithTest: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login('test_token_for_development');
            get().login(response.user, {
              access_token: response.access_token,
              refresh_token: response.refresh_token,
            });
          } catch (error: any) {
            set({ 
              error: error.response?.data?.message || '테스트 로그인에 실패했습니다.',
              isLoading: false 
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        refreshTokens: async () => {
          const { tokens } = get();
          if (!tokens?.refresh_token) {
            get().logout();
            return;
          }

          try {
            const response = await authService.refreshToken(tokens.refresh_token);
            const newTokens = {
              access_token: response.access_token,
              refresh_token: tokens.refresh_token, // refresh token은 그대로 유지
            };
            
            authService.saveTokensToStorage(newTokens);
            set({ tokens: newTokens });
          } catch (error) {
            get().logout();
            throw error;
          }
        },

        withdraw: async () => {
          try {
            await authService.withdraw();
            get().logout();
          } catch (error: any) {
            set({ 
              error: error.response?.data?.message || '회원 탈퇴에 실패했습니다.' 
            });
            throw error;
          }
        },
      }),
      {
        name: 'auth-storage', // localStorage 키
        partialize: (state) => ({ 
          user: state.user, 
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated 
        }), // 저장할 상태만 선택
      }
    ),
    {
      name: 'auth-store', // Redux DevTools 이름
    }
  )
); 