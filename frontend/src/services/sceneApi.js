import api from './api.js';

/**
 * 씬 관련 API 서비스
 * SceneForge NestJS 백엔드의 씬 엔드포인트와 통신
 */

/**
 * 특정 프로젝트의 모든 씬을 조회합니다.
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 씬 목록
 */
export const getScenesByProject = async (projectId) => {
  try {
    const response = await api.get(`/project/${projectId}/scene`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 목록 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 목록 조회에 실패했습니다.',
    };
  }
};

/**
 * 특정 씬의 상세 정보를 조회합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @returns {Promise<Object>} 씬 상세 정보
 */
export const getSceneById = async (projectId, sceneId) => {
  try {
    const response = await api.get(`/project/${projectId}/scene/${sceneId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 상세 조회 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 상세 조회에 실패했습니다.',
    };
  }
};

/**
 * 새로운 씬을 생성합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} sceneData - 씬 데이터
 * @returns {Promise<Object>} 생성된 씬 정보
 */
export const createScene = async (projectId, sceneData) => {
  try {
    const response = await api.post(`/project/${projectId}/scene`, sceneData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 생성 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 생성에 실패했습니다.',
    };
  }
};

/**
 * 기존 씬을 수정합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} sceneData - 수정할 씬 데이터
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateScene = async (projectId, sceneId, sceneData) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, sceneData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 수정 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 수정에 실패했습니다.',
    };
  }
};

/**
 * 씬을 삭제합니다 (소프트 삭제).
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @returns {Promise<Object>} 삭제된 씬 정보
 */
export const deleteScene = async (projectId, sceneId) => {
  try {
    const response = await api.delete(`/project/${projectId}/scene/${sceneId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 삭제 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 삭제에 실패했습니다.',
    };
  }
};

/**
 * 삭제된 씬을 복구합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @returns {Promise<Object>} 복구된 씬 정보
 */
export const restoreScene = async (projectId, sceneId) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}/restore`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 복구 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 복구에 실패했습니다.',
    };
  }
};

/**
 * 씬 초안을 생성합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} draftData - 초안 생성 데이터
 * @returns {Promise<Object>} 생성된 씬 초안 목록
 */
export const createSceneDraft = async (projectId, draftData) => {
  try {
    const response = await api.post(`/project/${projectId}/scene/draft`, draftData);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 초안 생성 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 초안 생성에 실패했습니다.',
    };
  }
};

/**
 * 씬의 순서를 변경합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {number} newOrder - 새로운 순서
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneOrder = async (projectId, sceneId, newOrder) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      order: newOrder,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 순서 변경 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 순서 변경에 실패했습니다.',
    };
  }
};

/**
 * 씬의 특별 요구사항을 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Array} specialRequirements - 특별 요구사항 목록
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneSpecialRequirements = async (projectId, sceneId, specialRequirements) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      specialRequirements,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 특별 요구사항 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 특별 요구사항 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 출연진 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Array} cast - 출연진 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneCast = async (projectId, sceneId, cast) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      cast,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 출연진 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 출연진 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 인력 구성 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} crew - 인력 구성 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneCrew = async (projectId, sceneId, crew) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      crew,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 인력 구성 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 인력 구성 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 장비 구성 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} equipment - 장비 구성 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneEquipment = async (projectId, sceneId, equipment) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      equipment,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 장비 구성 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 장비 구성 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 조명 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} lighting - 조명 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneLighting = async (projectId, sceneId, lighting) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      lighting,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 조명 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 조명 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 위치 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} location - 위치 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneLocation = async (projectId, sceneId, location) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      location,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 위치 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 위치 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬의 대화 정보를 업데이트합니다.
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Array} dialogues - 대화 정보
 * @returns {Promise<Object>} 수정된 씬 정보
 */
export const updateSceneDialogues = async (projectId, sceneId, dialogues) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}`, {
      dialogues,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('씬 대화 업데이트 오류:', error);
    return {
      success: false,
      error: error.response?.data?.message || '씬 대화 업데이트에 실패했습니다.',
    };
  }
};

/**
 * 씬 API 서비스의 모든 함수들을 내보냅니다.
 */
export default {
  getScenesByProject,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
  restoreScene,
  createSceneDraft,
  updateSceneOrder,
  updateSceneSpecialRequirements,
  updateSceneCast,
  updateSceneCrew,
  updateSceneEquipment,
  updateSceneLighting,
  updateSceneLocation,
  updateSceneDialogues,
};
