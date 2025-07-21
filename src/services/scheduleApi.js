import api from './api';

/**
 * 스케줄 API 서비스
 * 백엔드와 스케줄 데이터를 주고받는 서비스
 */
const scheduleApi = {
  /**
   * 프로젝트의 스케줄 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise} 스케줄 데이터
   */
  getSchedule: async (projectId) => {
    try {
      const response = await api.get(`/schedules/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('스케줄 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 스케줄 저장/업데이트
   * @param {string} projectId - 프로젝트 ID
   * @param {Object} scheduleData - 스케줄 데이터
   * @param {Array} conteData - 콘티 데이터
   * @returns {Promise} 저장된 스케줄 데이터
   */
  saveSchedule: async (projectId, scheduleData, conteData) => {
    try {
      const response = await api.post(`/schedules/${projectId}`, {
        scheduleData,
        conteData
      });
      return response.data;
    } catch (error) {
      console.error('스케줄 저장 오류:', error);
      throw error;
    }
  },

  /**
   * 스케줄 삭제
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise} 삭제 결과
   */
  deleteSchedule: async (projectId) => {
    try {
      const response = await api.delete(`/schedules/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('스케줄 삭제 오류:', error);
      throw error;
    }
  },

  /**
   * 콘티 데이터 변경 감지
   * @param {string} projectId - 프로젝트 ID
   * @param {Array} conteData - 콘티 데이터
   * @returns {Promise} 업데이트 필요 여부
   */
  checkScheduleUpdate: async (projectId, conteData) => {
    try {
      const response = await api.post(`/schedules/${projectId}/check-update`, {
        conteData
      });
      return response.data;
    } catch (error) {
      console.error('스케줄 업데이트 확인 오류:', error);
      throw error;
    }
  }
};

export default scheduleApi; 