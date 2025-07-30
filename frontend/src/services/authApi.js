import api from './api.js';

/**
 * 인증 관련 API 서비스
 * SceneForge NestJS 백엔드의 인증 엔드포인트와 통신
 */

/**
 * Google OAuth 로그인을 수행합니다.
 * @param {string} accessToken - Google OAuth 액세스 토큰
 * @returns {Promise<Object>} 로그인 결과 (토큰 및 사용자 정보)
 */
export const login = async (accessToken) => {
  try {
    const response = await api.post('/auth/login', {
      access_token: accessToken,
    });
    
    // 토큰을 세션 스토리지에 저장
    if (response.data.access_token) {
      sessionStorage.setItem('auth-token', response.data.access_token);
      sessionStorage.setItem('refresh-token', response.data.refresh_token);
    }
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('로그인 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '로그인에 실패했습니다.',
    };
  }
};

/**
 * 테스트용 로그인을 수행합니다 (개발 환경에서만 사용).
 * @param {string} testToken - 테스트 토큰
 * @returns {Promise<Object>} 로그인 결과
 */
export const loginTest = async (testToken) => {
  try {
    const response = await api.post('/auth/login', {
      access_token: testToken,
    });
    
    // 토큰을 세션 스토리지에 저장
    if (response.data.access_token) {
      sessionStorage.setItem('auth-token', response.data.access_token);
      sessionStorage.setItem('refresh-token', response.data.refresh_token);
    }
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('테스트 로그인 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '테스트 로그인에 실패했습니다.',
    };
  }
};

/**
 * 액세스 토큰을 갱신합니다.
 * @param {string} refreshToken - 리프레시 토큰
 * @returns {Promise<Object>} 토큰 갱신 결과
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    // 새로운 액세스 토큰을 세션 스토리지에 저장
    if (response.data.access_token) {
      sessionStorage.setItem('auth-token', response.data.access_token);
    }
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('토큰 갱신 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '토큰 갱신에 실패했습니다.',
    };
  }
};

/**
 * 회원 탈퇴를 수행합니다.
 * @returns {Promise<Object>} 탈퇴 결과
 */
export const withdraw = async () => {
  try {
    const response = await api.delete('/auth/withdraw');
    
    // 로그아웃 처리
    logout();
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '회원 탈퇴에 실패했습니다.',
    };
  }
};

/**
 * 로그아웃을 수행합니다.
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const logout = async () => {
  try {
    // 세션 스토리지에서 토큰 제거
    sessionStorage.removeItem('auth-token');
    sessionStorage.removeItem('refresh-token');
    
    // 로컬 스토리지에서도 인증 관련 데이터 제거
    localStorage.removeItem('auth-storage');
    
    return {
      success: true,
      message: '로그아웃되었습니다.',
    };
  } catch (error) {
    console.error('로그아웃 오류:', error);
    return {
      success: false,
      error: '로그아웃 처리 중 오류가 발생했습니다.',
    };
  }
};

/**
 * 현재 인증 상태를 확인합니다.
 * @returns {Promise<Object>} 인증 상태 확인 결과
 */
export const checkAuthStatus = async () => {
  try {
    // 세션 스토리지에서 토큰 확인
    const token = sessionStorage.getItem('auth-token');
    
    if (!token) {
      return {
        success: false,
        isAuthenticated: false,
        error: '인증 토큰이 없습니다.',
      };
    }
    
    // 토큰 유효성 검증을 위해 프로필 API 호출
    const response = await api.get('/profile');
    
    return {
      success: true,
      isAuthenticated: true,
      data: response.data,
    };
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    
    // 401 오류인 경우 토큰이 만료된 것으로 간주
    if (error.response?.status === 401) {
      // 만료된 토큰 제거
      sessionStorage.removeItem('auth-token');
      sessionStorage.removeItem('refresh-token');
      
      return {
        success: false,
        isAuthenticated: false,
        error: '토큰이 만료되었습니다.',
      };
    }
    
    return {
      success: false,
      isAuthenticated: false,
      error: error.response?.data?.message || '인증 상태 확인에 실패했습니다.',
    };
  }
};

/**
 * 토큰을 강제로 갱신합니다.
 * @returns {Promise<Object>} 토큰 갱신 결과
 */
export const forceAuthRefresh = async () => {
  try {
    const refreshToken = sessionStorage.getItem('refresh-token');
    
    if (!refreshToken) {
      return {
        success: false,
        error: '리프레시 토큰이 없습니다.',
      };
    }
    
    const result = await refreshAccessToken(refreshToken);
    
    if (result.success) {
      return {
        success: true,
        message: '토큰이 성공적으로 갱신되었습니다.',
      };
    } else {
      // 갱신 실패 시 로그아웃 처리
      logout();
      return {
        success: false,
        error: '토큰 갱신에 실패했습니다. 다시 로그인해주세요.',
      };
    }
  } catch (error) {
    console.error('토큰 강제 갱신 오류:', error);
    
    // 오류 발생 시 로그아웃 처리
    logout();
    return {
      success: false,
      error: '토큰 갱신 중 오류가 발생했습니다. 다시 로그인해주세요.',
    };
  }
};

/**
 * 현재 저장된 토큰을 가져옵니다.
 * @returns {Object} 토큰 정보
 */
export const getStoredTokens = () => {
  const accessToken = sessionStorage.getItem('auth-token');
  const refreshToken = sessionStorage.getItem('refresh-token');
  
  return {
    accessToken,
    refreshToken,
    hasTokens: !!(accessToken && refreshToken),
  };
};

/**
 * 토큰을 저장합니다.
 * @param {string} accessToken - 액세스 토큰
 * @param {string} refreshToken - 리프레시 토큰
 */
export const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    sessionStorage.setItem('auth-token', accessToken);
  }
  if (refreshToken) {
    sessionStorage.setItem('refresh-token', refreshToken);
  }
};

/**
 * 저장된 토큰을 제거합니다.
 */
export const clearStoredTokens = () => {
  sessionStorage.removeItem('auth-token');
  sessionStorage.removeItem('refresh-token');
};

/**
 * 인증 API 서비스의 모든 함수들을 내보냅니다.
 */
export default {
  login,
  loginTest,
  refreshAccessToken,
  withdraw,
  logout,
  checkAuthStatus,
  forceAuthRefresh,
  getStoredTokens,
  storeTokens,
  clearStoredTokens,
};
