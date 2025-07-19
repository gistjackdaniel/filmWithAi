import api from './api'

/**
 * 컷 관리 API 서비스
 * 씬(Conte) 내의 개별 컷들을 관리하는 API 연동
 * 프리프로덕션 중심의 컷 세분화 시스템
 */

/**
 * @typedef {Object} CutData
 * @property {number} shotNumber - 샷 번호
 * @property {string} title - 컷 제목
 * @property {string} description - 컷 설명
 * @property {Object} shootingPlan - 촬영 계획
 * @property {string} cutType - 컷 타입 (master, close_up, medium_shot, wide_shot, over_the_shoulder, insert, etc)
 * @property {string} dialogue - 대사
 * @property {string} narration - 내레이션
 * @property {Object} characterMovement - 인물/동선 및 포지션
 * @property {string} productionMethod - 제작 방법 (live_action, ai_generated, hybrid)
 * @property {number} estimatedDuration - 예상 지속 시간 (초)
 * @property {Object} shootingConditions - 촬영 조건
 * @property {Object} requiredPersonnel - 필요 인력
 * @property {Object} requiredEquipment - 필요 장비
 * @property {number} order - 컷 순서
 * @property {Object} metadata - 메타데이터
 */

/**
 * @typedef {Object} CutSegmentationRequest
 * @property {string} segmentationMethod - 세분화 방법 (auto, manual)
 * @property {number} maxCuts - 최대 컷 수
 * @property {Array} focusAreas - 집중 영역
 */

/**
 * 컷 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {CutData} cutData - 컷 데이터
 * @returns {Promise<Object>} 생성된 컷 정보
 */
export const createCut = async (projectId, conteId, cutData) => {
  try {
    console.log('💾 컷 생성 요청:', { projectId, conteId, cutData })
    
    const response = await api.post(`/projects/${projectId}/contes/${conteId}/cuts`, cutData)
    
    console.log('✅ 컷 생성 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 생성 실패:', error)
    throw error
  }
}

/**
 * 씬의 컷 목록 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {Object} options - 조회 옵션
 * @param {string} options.status - 컷 상태 필터
 * @param {string} options.productionMethod - 제작 방법 필터
 * @returns {Promise<Object>} 컷 목록
 */
export const getCuts = async (projectId, conteId, options = {}) => {
  try {
    console.log('📋 컷 목록 조회 요청:', { projectId, conteId, options })
    
    const params = new URLSearchParams()
    if (options.status) params.append('status', options.status)
    if (options.productionMethod) params.append('productionMethod', options.productionMethod)
    
    const response = await api.get(`/projects/${projectId}/contes/${conteId}/cuts?${params}`)
    
    console.log('✅ 컷 목록 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 특정 컷 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<Object>} 컷 정보
 */
export const getCut = async (projectId, conteId, cutId) => {
  try {
    console.log('📋 컷 조회 요청:', { projectId, conteId, cutId })
    
    const response = await api.get(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`)
    
    console.log('✅ 컷 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 조회 실패:', error)
    throw error
  }
}

/**
 * 컷 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 컷 정보
 */
export const updateCut = async (projectId, conteId, cutId, updateData) => {
  try {
    console.log('✏️ 컷 업데이트 요청:', { projectId, conteId, cutId, updateData })
    
    const response = await api.put(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`, updateData)
    
    console.log('✅ 컷 업데이트 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 업데이트 실패:', error)
    throw error
  }
}

/**
 * 컷 순서 변경
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {Array} cutOrders - 컷 순서 배열 [{ cutId, newOrder }]
 * @returns {Promise<Object>} 순서 변경 결과
 */
export const reorderCuts = async (projectId, conteId, cutOrders) => {
  try {
    console.log('🔄 컷 순서 변경 요청:', { projectId, conteId, cutOrders })
    
    const response = await api.put(`/projects/${projectId}/contes/${conteId}/cuts/reorder`, { cutOrders })
    
    console.log('✅ 컷 순서 변경 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 순서 변경 실패:', error)
    throw error
  }
}

/**
 * 컷 삭제
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteCut = async (projectId, conteId, cutId) => {
  try {
    console.log('🗑️ 컷 삭제 요청:', { projectId, conteId, cutId })
    
    const response = await api.delete(`/projects/${projectId}/contes/${conteId}/cuts/${cutId}`)
    
    console.log('✅ 컷 삭제 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 삭제 실패:', error)
    throw error
  }
}

/**
 * 같은 장소의 컷들 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} location - 장소
 * @returns {Promise<Object>} 장소별 컷 목록
 */
export const getCutsByLocation = async (projectId, location) => {
  try {
    console.log('📍 장소별 컷 조회 요청:', { projectId, location })
    
    const response = await api.get(`/projects/${projectId}/cuts/location/${location}`)
    
    console.log('✅ 장소별 컷 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 장소별 컷 조회 실패:', error)
    throw error
  }
}

/**
 * 같은 시간대의 컷들 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} timeOfDay - 시간대
 * @returns {Promise<Object>} 시간대별 컷 목록
 */
export const getCutsByTimeOfDay = async (projectId, timeOfDay) => {
  try {
    console.log('⏰ 시간대별 컷 조회 요청:', { projectId, timeOfDay })
    
    const response = await api.get(`/projects/${projectId}/cuts/time/${timeOfDay}`)
    
    console.log('✅ 시간대별 컷 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 시간대별 컷 조회 실패:', error)
    throw error
  }
}

/**
 * 제작 방법별 컷들 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} method - 제작 방법
 * @returns {Promise<Object>} 제작 방법별 컷 목록
 */
export const getCutsByProductionMethod = async (projectId, method) => {
  try {
    console.log('🎬 제작 방법별 컷 조회 요청:', { projectId, method })
    
    const response = await api.get(`/projects/${projectId}/cuts/method/${method}`)
    
    console.log('✅ 제작 방법별 컷 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 제작 방법별 컷 조회 실패:', error)
    throw error
  }
}

/**
 * 컷 타입별 컷들 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} cutType - 컷 타입
 * @returns {Promise<Object>} 컷 타입별 컷 목록
 */
export const getCutsByCutType = async (projectId, cutType) => {
  try {
    console.log('🎬 컷 타입별 컷 조회 요청:', { projectId, cutType })
    
    const response = await api.get(`/projects/${projectId}/cuts/type/${cutType}`)
    
    console.log('✅ 컷 타입별 컷 조회 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ 컷 타입별 컷 조회 실패:', error)
    throw error
  }
}

/**
 * AI 컷 세분화 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {CutSegmentationRequest} segmentationData - 세분화 요청 데이터
 * @returns {Promise<Object>} 생성된 컷들
 */
export const generateCutSegmentation = async (projectId, conteId, segmentationData) => {
  try {
    console.log('🤖 AI 컷 세분화 요청:', { projectId, conteId, segmentationData })
    
    const response = await api.post(`/projects/${projectId}/contes/${conteId}/cuts/segment`, segmentationData)
    
    console.log('✅ AI 컷 세분화 성공:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ AI 컷 세분화 실패:', error)
    throw error
  }
}

/**
 * 재시도 로직을 포함한 AI 컷 세분화
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {CutSegmentationRequest} segmentationData - 세분화 요청 데이터
 * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @returns {Promise<Object>} 생성된 컷들
 */
export const generateCutSegmentationWithRetry = async (projectId, conteId, segmentationData, maxRetries = 3) => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateCutSegmentation(projectId, conteId, segmentationData)
    } catch (error) {
      lastError = error
      
      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`AI 컷 세분화 재시도 ${attempt}/${maxRetries}`)
      }
    }
  }
  
  // 모든 재시도 실패
  throw lastError
}

/**
 * 컷 데이터 검증
 * @param {CutData} cutData - 컷 데이터
 * @returns {boolean} 검증 결과
 */
export const validateCutData = (cutData) => {
  if (!cutData.shotNumber || !cutData.title || !cutData.description) {
    console.error('❌ 컷 데이터 검증 실패: 필수 필드 누락')
    return false
  }
  
  if (cutData.shotNumber < 1) {
    console.error('❌ 컷 데이터 검증 실패: 샷 번호는 1 이상이어야 합니다')
    return false
  }
  
  if (cutData.estimatedDuration && (cutData.estimatedDuration < 1 || cutData.estimatedDuration > 300)) {
    console.error('❌ 컷 데이터 검증 실패: 지속 시간은 1초 이상 300초 이하여야 합니다')
    return false
  }
  
  console.log('✅ 컷 데이터 검증 통과')
  return true
}

/**
 * 컷 지속 시간 포맷팅
 * @param {number} duration - 지속 시간 (초)
 * @returns {string} 포맷된 지속 시간
 */
export const formatDuration = (duration) => {
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`
  }
  return `${seconds}초`
}

/**
 * 컷 상태 한글화
 * @param {string} status - 컷 상태
 * @returns {string} 한글 상태명
 */
export const getStatusLabel = (status) => {
  const statusLabels = {
    'planned': '계획됨',
    'in_progress': '진행 중',
    'completed': '완료됨',
    'reviewed': '검토됨',
    'approved': '승인됨'
  }
  
  return statusLabels[status] || status
}

/**
 * 제작 방법 한글화
 * @param {string} method - 제작 방법
 * @returns {string} 한글 제작 방법명
 */
export const getProductionMethodLabel = (method) => {
  const methodLabels = {
    'live_action': '실사 촬영',
    'ai_generated': 'AI 생성',
    'hybrid': '하이브리드'
  }
  
  return methodLabels[method] || method
}

/**
 * 컷 타입 한글화
 * @param {string} cutType - 컷 타입
 * @returns {string} 한글 컷 타입명
 */
export const getCutTypeLabel = (cutType) => {
  const cutTypeLabels = {
    'master': '마스터 샷',
    'close_up': '클로즈업',
    'medium_shot': '미디엄 샷',
    'wide_shot': '와이드 샷',
    'over_the_shoulder': '어깨 너머 샷',
    'insert': '인서트',
    'two_shot': '투 샷',
    'group_shot': '그룹 샷',
    'establishing': '설정 샷',
    'reaction': '반응 샷',
    'point_of_view': 'POV',
    'etc': '기타'
  }
  
  return cutTypeLabels[cutType] || cutType
}

/**
 * 컷 타입별 색상 반환
 * @param {string} cutType - 컷 타입
 * @returns {string} 색상 코드
 */
export const getCutTypeColor = (cutType) => {
  const colors = {
    'master': '#3498DB', // 파란색
    'close_up': '#E74C3C', // 빨간색
    'medium_shot': '#2ECC71', // 초록색
    'wide_shot': '#F39C12', // 주황색
    'over_the_shoulder': '#9B59B6', // 보라색
    'insert': '#1ABC9C', // 청록색
    'two_shot': '#E67E22', // 주황색
    'group_shot': '#34495E', // 회색
    'establishing': '#16A085', // 청록색
    'reaction': '#D35400', // 주황색
    'point_of_view': '#8E44AD', // 보라색
    'etc': '#95A5A6' // 회색
  }
  
  return colors[cutType] || '#95A5A6'
}

export default {
  createCut,
  getCuts,
  getCut,
  updateCut,
  reorderCuts,
  deleteCut,
  getCutsByLocation,
  getCutsByTimeOfDay,
  getCutsByProductionMethod,
  getCutsByCutType,
  generateCutSegmentation,
  generateCutSegmentationWithRetry,
  validateCutData,
  formatDuration,
  getStatusLabel,
  getProductionMethodLabel,
  getCutTypeLabel,
  getCutTypeColor
} 