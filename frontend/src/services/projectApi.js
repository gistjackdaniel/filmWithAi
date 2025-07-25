import api from './api.js'

/**
 * 프로젝트 관리 API 서비스
 * 스토리 편집, 저장, 조회 기능을 제공
 * PRD 2.1.5 프로젝트 관리 기능의 백엔드 연동
 */

// API 응답 데이터 구조 정의
/**
 * @typedef {Object} ProjectData
 * @property {string} projectTitle - 프로젝트 제목
 * @property {string} synopsis - 시놉시스
 * @property {string} story - 생성된 스토리
 * @property {Array} conteList - 콘티 리스트 (선택사항)
 */

/**
 * @typedef {Object} ProjectResponse
 * @property {string} _id - 프로젝트 ID
 * @property {string} projectTitle - 프로젝트 제목
 * @property {string} synopsis - 시놉시스
 * @property {string} story - 생성된 스토리
 * @property {Array} conteList - 콘티 리스트
 * @property {string} createdAt - 생성 시간
 * @property {string} updatedAt - 수정 시간
 */

/**
 * 새 프로젝트 생성
 * @param {ProjectData} projectData - 프로젝트 데이터
 * @returns {Promise<ProjectResponse>} 생성된 프로젝트 정보
 */
export const createProject = async (projectData) => {
  console.log('📁 프로젝트 생성 API 호출 시작:', {
    projectTitle: projectData.projectTitle,
    synopsisLength: projectData.synopsis?.length || 0,
    storyLength: projectData.story?.length || 0,
    conteCount: projectData.conteList?.length || 0,
    requestData: projectData
  })
  
  try {
    console.log('📤 프로젝트 생성 API 요청 전송...')
    const response = await api.post('/projects', projectData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ 프로젝트 생성 API 응답 수신:', {
      status: response.status,
      projectId: response.data?._id,
      projectTitle: response.data?.projectTitle,
      createdAt: response.data?.createdAt,
      responseData: response.data
    })
    
    return response.data
  } catch (error) {
    console.error('❌ 프로젝트 생성 API 오류:', {
      errorType: error.constructor.name,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    })
    handleProjectError(error, '프로젝트 생성')
  }
}

/**
 * 프로젝트 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {ProjectData} projectData - 업데이트할 프로젝트 데이터
 * @returns {Promise<ProjectResponse>} 업데이트된 프로젝트 정보
 */
export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/projects/${projectId}`, projectData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '프로젝트 업데이트')
  }
}

/**
 * 스토리만 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {string} story - 업데이트할 스토리
 * @returns {Promise<ProjectResponse>} 업데이트된 프로젝트 정보
 */
export const updateStory = async (projectId, story) => {
  try {
    const response = await api.patch(`/projects/${projectId}/story`, { story }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '스토리 업데이트')
  }
}

/**
 * 프로젝트 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} options - 조회 옵션
 * @param {boolean} options.includeContes - 콘티 목록 포함 여부 (기본값: true)
 * @returns {Promise<ProjectResponse>} 프로젝트 정보
 */
export const getProject = async (projectId, options = {}) => {
  console.log('📁 프로젝트 조회 API 호출 시작:', {
    projectId: projectId,
    options: options,
    includeContes: options.includeContes
  })
  
  try {
    const { includeContes = true } = options
    const params = new URLSearchParams()
    
    if (includeContes) {
      params.append('includeContes', 'true')
    }
    
    console.log('📤 프로젝트 조회 API 요청 전송:', {
      url: `/projects/${projectId}?${params.toString()}`,
      timeout: 5000
    })
    
    const response = await api.get(`/projects/${projectId}?${params.toString()}`, {
      timeout: 5000
    })
    
    console.log('✅ 프로젝트 조회 API 응답 수신:', {
      status: response.status,
      projectId: response.data?._id,
      projectTitle: response.data?.projectTitle,
      synopsisLength: response.data?.synopsis?.length || 0,
      storyLength: response.data?.story?.length || 0,
      conteCount: response.data?.conteList?.length || 0,
      createdAt: response.data?.createdAt,
      updatedAt: response.data?.updatedAt
    })
    
    // 콘티 데이터가 포함된 경우 상세 분석
    if (response.data?.conteList && Array.isArray(response.data.conteList)) {
      console.log('📊 콘티 데이터 분석:', {
        totalContes: response.data.conteList.length,
        contesWithImages: response.data.conteList.filter(c => c.imageUrl).length,
        averageSceneLength: response.data.conteList.reduce((acc, c) => acc + (c.description?.length || 0), 0) / response.data.conteList.length,
        sampleConte: response.data.conteList[0] ? {
          id: response.data.conteList[0].id,
          scene: response.data.conteList[0].scene,
          title: response.data.conteList[0].title,
          descriptionLength: response.data.conteList[0].description?.length || 0,
          hasImage: !!response.data.conteList[0].imageUrl
        } : null
      })
    }
    
    return response.data
  } catch (error) {
    console.error('❌ 프로젝트 조회 API 오류:', {
      errorType: error.constructor.name,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
      projectId: projectId
    })
    handleProjectError(error, '프로젝트 조회')
  }
}

/**
 * 사용자의 프로젝트 목록 조회
 * @returns {Promise<Array<ProjectResponse>>} 프로젝트 목록
 */
export const getProjects = async () => {
  console.log('📁 프로젝트 목록 조회 API 호출 시작')
  
  try {
    console.log('📤 프로젝트 목록 조회 API 요청 전송...')
    const response = await api.get('/projects', {
      timeout: 5000
    })
    
    console.log('✅ 프로젝트 목록 조회 API 응답 수신:', {
      status: response.status,
      totalProjects: Array.isArray(response.data) ? response.data.length : 'N/A',
      isArray: Array.isArray(response.data)
    })
    
    // 프로젝트 목록 분석
    if (Array.isArray(response.data)) {
      console.log('📊 프로젝트 목록 분석:', {
        totalProjects: response.data.length,
        projectsWithStories: response.data.filter(p => p.story).length,
        projectsWithContes: response.data.filter(p => p.conteList && p.conteList.length > 0).length,
        averageSynopsisLength: response.data.reduce((acc, p) => acc + (p.synopsis?.length || 0), 0) / response.data.length,
        sampleProject: response.data[0] ? {
          id: response.data[0]._id,
          title: response.data[0].projectTitle,
          synopsisLength: response.data[0].synopsis?.length || 0,
          storyLength: response.data[0].story?.length || 0,
          conteCount: response.data[0].conteList?.length || 0,
          createdAt: response.data[0].createdAt
        } : null
      })
    }
    
    return response.data
  } catch (error) {
    console.error('❌ 프로젝트 목록 조회 API 오류:', {
      errorType: error.constructor.name,
      message: error.message,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    })
    handleProjectError(error, '프로젝트 목록 조회')
  }
}

/**
 * 프로젝트 삭제
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<void>}
 */
export const deleteProject = async (projectId) => {
  try {
    await api.delete(`/projects/${projectId}`, {
      timeout: 5000
    })
  } catch (error) {
    handleProjectError(error, '프로젝트 삭제')
  }
}

/**
 * 프로젝트 자동 저장 (실시간 저장)
 * @param {string} projectId - 프로젝트 ID
 * @param {ProjectData} projectData - 저장할 프로젝트 데이터
 * @returns {Promise<ProjectResponse>} 저장된 프로젝트 정보
 */
export const autoSaveProject = async (projectId, projectData) => {
  try {
    const response = await api.post('/project/save', projectData, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    // 자동 저장 실패는 사용자에게 알리지 않음 (백그라운드에서 처리)
    console.warn('자동 저장 실패:', error)
    return null
  }
}

/**
 * 콘티 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} conteData - 콘티 데이터
 * @returns {Promise<Object>} 생성된 콘티 정보
 */
export const createConte = async (projectId, conteData) => {
  try {
    const response = await api.post(`/projects/${projectId}/contes`, conteData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('프로젝트 콘티 생성 응답 전체:', JSON.stringify(response, null, 2));
    return response.data
  } catch (error) {
    handleProjectError(error, '콘티 생성')
  }
}

/**
 * 콘티 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 콘티 ID
 * @param {Object} conteData - 업데이트할 콘티 데이터
 * @returns {Promise<Object>} 업데이트된 콘티 정보
 */
export const updateConte = async (projectId, conteId, conteData) => {
  try {
    const response = await api.put(`/projects/${projectId}/contes/${conteId}`, conteData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '콘티 업데이트')
  }
}

/**
 * 프로젝트 복사
 * @param {string} projectId - 복사할 프로젝트 ID
 * @param {string} newTitle - 새 프로젝트 제목
 * @returns {Promise<ProjectResponse>} 복사된 프로젝트 정보
 */
export const duplicateProject = async (projectId, newTitle) => {
  try {
    const response = await api.post(`/projects/${projectId}/duplicate`, { 
      newTitle 
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '프로젝트 복사')
  }
}

/**
 * 프로젝트 검색
 * @param {string} query - 검색 쿼리
 * @returns {Promise<Array<ProjectResponse>>} 검색 결과
 */
export const searchProjects = async (query) => {
  try {
    const response = await api.get('/projects/search', {
      params: { q: query },
      timeout: 5000
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '프로젝트 검색')
  }
}

/**
 * 프로젝트 즐겨찾기 토글
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object>} 토글 결과
 */
export const toggleProjectFavorite = async (projectId) => {
  try {
    // baseURL에 이미 /api가 포함되어 있으므로, 경로에서 /api를 제거
    const response = await api.put(`/projects/${projectId}/favorite`, {}, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '즐겨찾기 토글')
  }
}

/**
 * 즐겨찾기된 프로젝트 목록 조회
 * @returns {Promise<Array<ProjectResponse>>} 즐겨찾기 프로젝트 목록
 */
export const getFavoriteProjects = async () => {
  try {
    // baseURL에 이미 /api가 포함되어 있으므로, 경로에서 /api를 제거
    const response = await api.get('/projects/favorites', {
      timeout: 5000
    })
    return response.data
  } catch (error) {
    handleProjectError(error, '즐겨찾기 프로젝트 조회')
  }
}

/**
 * 프로젝트 에러 처리
 * @param {Error} error - 발생한 에러
 * @param {string} operation - 수행 중이던 작업
 */
const handleProjectError = (error, operation) => {
  if (error.response) {
    // 서버 응답 에러
    const status = error.response.status
    const message = error.response.data?.message || '알 수 없는 오류가 발생했습니다.'
    
    switch (status) {
      case 400:
        throw new Error(`${operation}에 실패했습니다. 입력 데이터를 확인해주세요.`)
      case 401:
        throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
      case 403:
        throw new Error('해당 프로젝트에 접근할 권한이 없습니다.')
      case 404:
        throw new Error('프로젝트를 찾을 수 없습니다.')
      case 500:
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      default:
        throw new Error(message)
    }
  } else if (error.request) {
    // 네트워크 에러
    throw new Error('네트워크 연결을 확인해주세요.')
  } else {
    // 기타 에러
    throw new Error(error.message || `${operation}에 실패했습니다.`)
  }
}

export default {
  createProject,
  updateProject,
  updateStory,
  getProject,
  getProjects,
  deleteProject,
  autoSaveProject,
  duplicateProject,
  searchProjects,
  toggleProjectFavorite,
  getFavoriteProjects
} 