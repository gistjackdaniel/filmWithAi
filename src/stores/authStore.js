import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

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
        set({ token })
        if (token) {
          // 토큰이 있으면 API 요청 헤더에 추가
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          // 토큰이 없으면 헤더에서 제거
          delete api.defaults.headers.common['Authorization']
        }
      },

      /**
       * Google OAuth 로그인 처리
       * @param {string} googleCode - Google OAuth 인증 코드
       * @returns {Object} 로그인 결과 { success: boolean, error?: string }
       */
      login: async (googleCode) => {
        try {
          set({ loading: true })
          
          // 서버에 Google 인증 코드 전송하여 JWT 토큰 받기
          const response = await api.post('/auth/google', { code: googleCode })
          const { token, user } = response.data
          
          // 토큰과 사용자 정보 설정
          get().setToken(token)
          get().setUser(user)
          set({ loading: false })
          
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: error.message }
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
          loading: false 
        })
        get().setToken(null)
      },

      /**
       * 인증 상태 확인
       * 저장된 토큰으로 서버에 인증 상태 확인 요청
       */
      checkAuth: async () => {
        try {
          const token = get().token
          if (!token) {
            // 토큰이 없으면 로딩 상태만 해제
            set({ loading: false })
            return
          }

          // 서버에 현재 사용자 정보 요청
          const response = await api.get('/auth/me')
          get().setUser(response.data.user)
          set({ loading: false })
        } catch (error) {
          // 인증 실패 시 로그아웃 처리
          get().logout()
        }
      },

      /**
       * 앱 초기화
       * 앱 시작 시 저장된 인증 정보로 인증 상태 확인
       */
      initialize: async () => {
        await get().checkAuth()
      }
    }),
    {
      // 로컬 스토리지 설정
      name: 'auth-storage', // 스토리지 키 이름
      partialize: (state) => ({ 
        // 영구 저장할 상태만 선택
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
)

export default useAuthStore 