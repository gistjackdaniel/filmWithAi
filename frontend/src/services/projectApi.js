import api from './api.js'

/**
 * 프로젝트 및 스토리 관리 API 서비스
 * SceneForge NestJS 백엔드의 프로젝트 엔드포인트와 통신
 */

/**
 * 새 프로젝트 생성
 * @param {Object} projectData - 프로젝트 데이터
 * @returns {Promise<Object>} 생성된 프로젝트 정보
 */
export const createProject = async (projectData) => {
  try {
    console.log('📁 프로젝트 생성 API 호출 시작:', {
      title: projectData.title,
      synopsisLength: projectData.synopsis?.length || 0,
      storyLength: projectData.story?.length || 0,
      tags: projectData.tags,
      genre: projectData.genre,
      requestData: projectData
    })
    
    const response = await api.post('/project', projectData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ 프로젝트 생성 API 응답 수신:', {
      status: response.status,
      projectId: response.data?._id,
      title: response.data?.title,
      createdAt: response.data?.createdAt,
      responseData: response.data
    })
    
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 생성 API 오류:', {
      errorType: error.constructor.name,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    })
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 생성에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} projectData - 업데이트할 프로젝트 데이터
 * @returns {Promise<Object>} 업데이트된 프로젝트 정보
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.patch(`/project/${projectId}`, projectData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 업데이트 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 업데이트에 실패했습니다.'
    }
  }
}

/**
 * 스토리만 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {string} story - 업데이트할 스토리
 * @returns {Promise<Object>} 업데이트된 프로젝트 정보
 */
export const updateStory = async (projectId, story) => {
  try {
    const response = await api.patch(`/project/${projectId}`, { story }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 업데이트 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 업데이트에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 조회
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 프로젝트 정보
 */
export const getProject = async (projectId) => {
  try {
    const response = await api.get(`/project/${projectId}`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 조회 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 조회에 실패했습니다.'
    }
  }
}

/**
 * 사용자 프로젝트 목록 조회
 * @returns {Promise<Object>} 프로젝트 목록
 */
export const getProjects = async () => {
  try {
    const response = await api.get('/project', {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 목록 조회 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 목록 조회에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 삭제
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 삭제된 프로젝트 정보
 */
export const deleteProject = async (projectId) => {
  try {
    const response = await api.delete(`/project/${projectId}`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 삭제 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 삭제에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 복원
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 복원된 프로젝트 정보
 */
export const restoreProject = async (projectId) => {
  try {
    const response = await api.post(`/project/${projectId}/restore`, {}, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 복원 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 복원에 실패했습니다.'
    }
  }
}

/**
 * 즐겨찾기 프로젝트 목록 조회
 * @returns {Promise<Object>} 즐겨찾기 프로젝트 목록
 */
export const getFavoriteProjects = async () => {
  try {
    const response = await api.get('/project/favorite', {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 즐겨찾기 프로젝트 조회 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '즐겨찾기 프로젝트 조회에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 자동 저장
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} projectData - 저장할 프로젝트 데이터
 * @returns {Promise<Object>} 저장된 프로젝트 정보
 */
export const autoSaveProject = async (projectId, projectData) => {
  try {
    const response = await api.patch(`/project/${projectId}`, projectData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 자동 저장 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 자동 저장에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 검색
 * @param {string} query - 검색 쿼리
 * @returns {Promise<Object>} 검색 결과
 */
export const searchProjects = async (query) => {
  try {
    const response = await api.get('/project', {
      timeout: 10000,
      params: { search: query }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 프로젝트 검색 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '프로젝트 검색에 실패했습니다.'
    }
  }
}

// ===== 스토리 관련 API =====

/**
 * AI 기반 스토리 생성
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 스토리가 생성된 프로젝트 정보
 */
export const generateStory = async (projectId) => {
  try {
    console.log('📝 스토리 생성 시작:', { projectId })
    
    const response = await api.post(`/project/${projectId}/generate-story`, {}, {
      timeout: 300000, // 5분 - AI 생성 시간 고려
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ 스토리 생성 완료:', response.data._id)
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 생성 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 생성에 실패했습니다.'
    }
  }
}

/**
 * 스토리 생성 상태 확인
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 생성 상태 정보
 */
export const checkStoryGenerationStatus = async (projectId) => {
  try {
    const response = await api.get(`/project/${projectId}/generate-story/status`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 생성 상태 확인 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 생성 상태 확인에 실패했습니다.'
    }
  }
}

/**
 * 스토리 생성 취소
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 취소 결과
 */
export const cancelStoryGeneration = async (projectId) => {
  try {
    const response = await api.delete(`/project/${projectId}/generate-story`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 생성 취소 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 생성 취소에 실패했습니다.'
    }
  }
}

/**
 * 스토리 분석
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 스토리 분석 결과
 */
export const analyzeStory = async (projectId) => {
  try {
    const response = await api.post(`/project/${projectId}/analyze-story`, {}, {
      timeout: 60000, // 1분
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 분석 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 분석에 실패했습니다.'
    }
  }
}

/**
 * 스토리 요약 생성
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 스토리 요약 정보
 */
export const generateStorySummary = async (projectId) => {
  try {
    const response = await api.post(`/project/${projectId}/summary`, {}, {
      timeout: 60000, // 1분
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 요약 생성 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 요약 생성에 실패했습니다.'
    }
  }
}

/**
 * 스토리 생성 히스토리 조회
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 스토리 생성 히스토리
 */
export const getStoryGenerationHistory = async (projectId) => {
  try {
    const response = await api.get(`/project/${projectId}/generate-story/history`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 생성 히스토리 조회 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 생성 히스토리 조회에 실패했습니다.'
    }
  }
}

/**
 * 스토리 품질 검증
 * @param {string} story - 검증할 스토리 내용
 * @returns {Promise<Object>} 품질 검증 결과
 */
export const validateStoryQuality = async (story) => {
  try {
    const response = await api.post('/story/validate-quality', { story }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 품질 검증 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 품질 검증에 실패했습니다.'
    }
  }
}

/**
 * 스토리 개선 제안
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 개선 제안 결과
 */
export const getStoryImprovementSuggestions = async (projectId) => {
  try {
    const response = await api.post(`/project/${projectId}/story/improve`, {}, {
      timeout: 60000, // 1분
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 개선 제안 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 개선 제안에 실패했습니다.'
    }
  }
}

/**
 * 스토리 버전 관리
 * @param {string} projectId - 프로젝트 ID
 * @param {string} version - 버전 정보
 * @returns {Promise<Object>} 버전 관리 결과
 */
export const createStoryVersion = async (projectId, version) => {
  try {
    const response = await api.post(`/project/${projectId}/story/version`, { version }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 버전 생성 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 버전 생성에 실패했습니다.'
    }
  }
}

/**
 * 스토리 버전 목록 조회
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 스토리 버전 목록
 */
export const getStoryVersions = async (projectId) => {
  try {
    const response = await api.get(`/project/${projectId}/story/versions`, {
      timeout: 10000
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 버전 목록 조회 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 버전 목록 조회에 실패했습니다.'
    }
  }
}

/**
 * 스토리 버전 복원
 * @param {string} projectId - 프로젝트 ID
 * @param {string} versionId - 버전 ID
 * @returns {Promise<Object>} 복원된 프로젝트 정보
 */
export const restoreStoryVersion = async (projectId, versionId) => {
  try {
    const response = await api.post(`/project/${projectId}/story/version/${versionId}/restore`, {}, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 버전 복원 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 버전 복원에 실패했습니다.'
    }
  }
}

/**
 * 스토리 공유
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} shareOptions - 공유 옵션
 * @returns {Promise<Object>} 공유 결과
 */
export const shareStory = async (projectId, shareOptions) => {
  try {
    const response = await api.post(`/project/${projectId}/story/share`, shareOptions, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 공유 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 공유에 실패했습니다.'
    }
  }
}

/**
 * 스토리 내보내기
 * @param {string} projectId - 프로젝트 ID
 * @param {string} format - 내보내기 형식 (pdf, docx, txt)
 * @returns {Promise<Object>} 내보내기 결과
 */
export const exportStory = async (projectId, format = 'pdf') => {
  try {
    const response = await api.post(`/project/${projectId}/story/export`, { format }, {
      timeout: 60000, // 1분
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return {
      success: true,
      data: response.data
    }
  } catch (error) {
    console.error('❌ 스토리 내보내기 오류:', error)
    return {
      success: false,
      error: error.response?.data?.message || '스토리 내보내기에 실패했습니다.'
    }
  }
}

/**
 * 프로젝트 및 스토리 API 서비스의 모든 함수들을 내보냅니다.
 */
export default {
  // 프로젝트 관련
  createProject,
  updateProject,
  updateStory,
  getProject,
  getProjects,
  deleteProject,
  restoreProject,
  getFavoriteProjects,
  autoSaveProject,
  searchProjects,
  
  // 스토리 관련
  generateStory,
  checkStoryGenerationStatus,
  cancelStoryGeneration,
  analyzeStory,
  generateStorySummary,
  getStoryGenerationHistory,
  validateStoryQuality,
  getStoryImprovementSuggestions,
  createStoryVersion,
  getStoryVersions,
  restoreStoryVersion,
  shareStory,
  exportStory
} 