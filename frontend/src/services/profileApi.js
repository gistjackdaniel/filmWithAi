import api from './api.js';

/**
 * 프로필 관련 API 서비스
 * SceneForge NestJS 백엔드의 프로필 엔드포인트와 통신
 */

/**
 * 현재 사용자의 프로필 정보를 조회합니다.
 * @returns {Promise<Object>} 프로필 정보
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/profile');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '프로필 조회에 실패했습니다.',
    };
  }
};

/**
 * 프로젝트를 즐겨찾기에 추가합니다.
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 업데이트된 프로필 정보
 */
export const addFavoriteProject = async (projectId) => {
  try {
    const response = await api.post(`/profile/project/${projectId}/favorite`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('즐겨찾기 추가 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '즐겨찾기 추가에 실패했습니다.',
    };
  }
};

/**
 * 프로젝트를 즐겨찾기에서 제거합니다.
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 업데이트된 프로필 정보
 */
export const removeFavoriteProject = async (projectId) => {
  try {
    const response = await api.delete(`/profile/project/${projectId}/favorite`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('즐겨찾기 제거 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '즐겨찾기 제거에 실패했습니다.',
    };
  }
};

/**
 * 프로필의 즐겨찾기 프로젝트 목록을 가져옵니다.
 * @returns {Promise<Array>} 즐겨찾기 프로젝트 목록
 */
export const getFavoriteProjects = async () => {
  try {
    const response = await api.get('/profile');
    const favoriteProjects = response.data.projects?.filter(project => project.isFavorite) || [];
    return {
      success: true,
      data: favoriteProjects,
    };
  } catch (error) {
    console.error('즐겨찾기 프로젝트 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '즐겨찾기 프로젝트 조회에 실패했습니다.',
    };
  }
};

/**
 * 프로필의 모든 프로젝트 목록을 가져옵니다.
 * @returns {Promise<Array>} 프로젝트 목록
 */
export const getProfileProjects = async () => {
  try {
    const response = await api.get('/profile');
    return {
      success: true,
      data: response.data.projects || [],
    };
  } catch (error) {
    console.error('프로필 프로젝트 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '프로필 프로젝트 조회에 실패했습니다.',
    };
  }
};

/**
 * 프로필 정보를 업데이트합니다.
 * @param {Object} profileData - 업데이트할 프로필 데이터
 * @returns {Promise<Object>} 업데이트된 프로필 정보
 */
export const updateProfile = async (profileData) => {
  try {
    const response = await api.patch('/profile', profileData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '프로필 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 프로필의 마지막 로그인 시간을 업데이트합니다.
 * @returns {Promise<Object>} 업데이트된 프로필 정보
 */
export const updateLastLogin = async () => {
  try {
    const response = await api.patch('/profile', {
      lastLoginAt: new Date().toISOString(),
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('마지막 로그인 시간 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '마지막 로그인 시간 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 프로젝트가 즐겨찾기인지 확인합니다.
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<boolean>} 즐겨찾기 여부
 */
export const isProjectFavorite = async (projectId) => {
  try {
    const response = await api.get('/profile');
    const project = response.data.projects?.find(p => p.projectId === projectId);
    return {
      success: true,
      data: project?.isFavorite || false,
    };
  } catch (error) {
    console.error('즐겨찾기 확인 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '즐겨찾기 확인에 실패했습니다.',
      data: false,
    };
  }
};

/**
 * 프로필 API 서비스의 모든 함수들을 내보냅니다.
 */
export default {
  getProfile,
  addFavoriteProject,
  removeFavoriteProject,
  getFavoriteProjects,
  getProfileProjects,
  updateProfile,
  updateLastLogin,
  isProjectFavorite,
};
