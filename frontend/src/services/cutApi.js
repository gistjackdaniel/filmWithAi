import api from './api.js';

/**
 * 컷 관리 API 서비스
 * NestJS 백엔드와 연동하여 컷 CRUD 및 이미지 관리 기능을 제공
 */

/**
 * @typedef {Object} CutData
 * @property {string} title - 컷 제목
 * @property {string} description - 컷 설명
 * @property {string} shotSize - 샷 사이즈
 * @property {string} angleDirection - 앵글 방향
 * @property {string} lightingSetup - 조명 설정
 * @property {Object} dialogue - 대사 정보
 * @property {Object} cameraWork - 카메라 워크
 * @property {Object} visualEffects - 시각 효과
 * @property {Object} props - 소품 정보
 */

/**
 * @typedef {Object} CutResponse
 * @property {string} _id - 컷 ID
 * @property {string} title - 컷 제목
 * @property {string} description - 컷 설명
 * @property {string} shotSize - 샷 사이즈
 * @property {string} angleDirection - 앵글 방향
 * @property {string} lightingSetup - 조명 설정
 * @property {Object} dialogue - 대사 정보
 * @property {Object} cameraWork - 카메라 워크
 * @property {Object} visualEffects - 시각 효과
 * @property {Object} props - 소품 정보
 * @property {string} imageUrl - 이미지 URL
 * @property {string} createdAt - 생성 시간
 * @property {string} updatedAt - 수정 시간
 */

/**
 * 컷 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {CutData} cutData - 컷 데이터
 * @returns {Promise<CutResponse>} 생성된 컷 정보
 */
export const createCut = async (projectId, sceneId, cutData) => {
  try {
    const response = await api.post(`/project/${projectId}/scene/${sceneId}/cut`, cutData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 생성 오류:', error);
    throw new Error('컷 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 초안 생성 (AI 기반)
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {Object} draftData - 초안 생성 데이터
 * @returns {Promise<CutResponse[]>} 생성된 컷 초안 목록
 */
export const createCutDraft = async (projectId, sceneId, draftData) => {
  try {
    const response = await api.post(`/project/${projectId}/scene/${sceneId}/cut/draft`, draftData, {
      timeout: 300000, // 5분 - AI 생성 시간 고려
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 초안 생성 오류:', error);
    throw new Error('컷 초안 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 목록 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @returns {Promise<CutResponse[]>} 컷 목록
 */
export const getCuts = async (projectId, sceneId) => {
  try {
    const response = await api.get(`/project/${projectId}/scene/${sceneId}/cut`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 목록 조회 오류:', error);
    throw new Error('컷 목록 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 상세 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<CutResponse>} 컷 정보
 */
export const getCut = async (projectId, sceneId, cutId) => {
  try {
    const response = await api.get(`/project/${projectId}/scene/${sceneId}/cut/${cutId}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 상세 조회 오류:', error);
    throw new Error('컷 상세 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 수정
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @param {CutData} cutData - 수정할 컷 데이터
 * @returns {Promise<CutResponse>} 수정된 컷 정보
 */
export const updateCut = async (projectId, sceneId, cutId, cutData) => {
  try {
    const response = await api.put(`/project/${projectId}/scene/${sceneId}/cut/${cutId}`, cutData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 수정 오류:', error);
    throw new Error('컷 수정 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 삭제
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<CutResponse>} 삭제된 컷 정보
 */
export const deleteCut = async (projectId, sceneId, cutId) => {
  try {
    const response = await api.delete(`/project/${projectId}/scene/${sceneId}/cut/${cutId}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 삭제 오류:', error);
    throw new Error('컷 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 이미지 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<string>} 이미지 URL
 */
export const getCutImage = async (projectId, sceneId, cutId) => {
  try {
    const response = await api.get(`/project/${projectId}/scene/${sceneId}/cut/${cutId}/image`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 이미지 조회 오류:', error);
    throw new Error('컷 이미지 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 이미지 업로드
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @param {File} imageFile - 업로드할 이미지 파일
 * @returns {Promise<string>} 업로드된 이미지 URL
 */
export const uploadCutImage = async (projectId, sceneId, cutId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const response = await api.post(`/project/${projectId}/scene/${sceneId}/cut/${cutId}/image`, formData, {
      timeout: 60000, // 1분
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 이미지 업로드 오류:', error);
    throw new Error('컷 이미지 업로드 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 이미지 삭제
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<string>} 삭제 결과 메시지
 */
export const deleteCutImage = async (projectId, sceneId, cutId) => {
  try {
    const response = await api.delete(`/project/${projectId}/scene/${sceneId}/cut/${cutId}/image`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 이미지 삭제 오류:', error);
    throw new Error('컷 이미지 삭제 중 오류가 발생했습니다.');
  }
};

/**
 * 컷 이미지 생성 (AI 기반)
 * @param {string} projectId - 프로젝트 ID
 * @param {string} sceneId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<string>} 생성된 이미지 URL
 */
export const generateCutImage = async (projectId, sceneId, cutId) => {
  try {
    const response = await api.post(`/project/${projectId}/scene/${sceneId}/cut/${cutId}/image/generate`, {}, {
      timeout: 300000, // 5분 - AI 생성 시간 고려
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ 컷 이미지 생성 오류:', error);
    throw new Error('컷 이미지 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 스토리지 정보 조회
 * @returns {Promise<Object>} 스토리지 정보
 */
export const getStorageInfo = async () => {
  try {
    const response = await api.get('/cut/storage-info', {
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('❌ 스토리지 정보 조회 오류:', error);
    throw new Error('스토리지 정보 조회 중 오류가 발생했습니다.');
  }
};

export default {
  createCut,
  createCutDraft,
  getCuts,
  getCut,
  updateCut,
  deleteCut,
  getCutImage,
  uploadCutImage,
  deleteCutImage,
  generateCutImage,
  getStorageInfo,
}; 