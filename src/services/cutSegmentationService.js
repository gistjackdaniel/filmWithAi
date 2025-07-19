/**
 * 컷 세분화 서비스
 * 콘티 구성요소를 기반으로 AI가 자동으로 샷을 생성하는 서비스
 * 프리프로덕션 중심으로 설계되어 촬영 계획과 제작 방법을 포함
 */

import cutApi from './cutApi'

// 컷 정보 구조 정의
/**
 * @typedef {Object} CutInfo
 * @property {string} id - 컷 고유 ID
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
 * @property {string} status - 컷 상태 (planned, in_progress, completed, reviewed, approved)
 * @property {number} order - 컷 순서
 */

/**
 * 컷 세분화 분석 결과
 * @typedef {Object} SegmentationResult
 * @property {Array<CutInfo>} cuts - 생성된 컷들
 * @property {number} totalDuration - 전체 예상 지속 시간
 * @property {number} cutCount - 컷 개수
 * @property {Object} statistics - 통계 정보
 */

/**
 * AI 기반 컷 세분화 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {Object} options - 세분화 옵션
 * @returns {Promise<SegmentationResult>} 세분화 결과
 */
export const generateCutSegmentation = async (projectId, conteId, options = {}) => {
  try {
    console.log('🎬 AI 컷 세분화 시작:', { projectId, conteId, options })
    
    const segmentationData = {
      segmentationMethod: options.segmentationMethod || 'auto',
      maxCuts: options.maxCuts || 5,
      focusAreas: options.focusAreas || []
    }
    
    const result = await cutApi.generateCutSegmentationWithRetry(
      projectId, 
      conteId, 
      segmentationData
    )
    
    if (!result.success) {
      throw new Error(result.message || '컷 세분화 생성에 실패했습니다.')
    }
    
    const cuts = result.data.cuts
    const totalDuration = cuts.reduce((sum, cut) => sum + cut.estimatedDuration, 0)
    
    const segmentationResult = {
      cuts: cuts,
      totalDuration: totalDuration,
      cutCount: cuts.length,
      statistics: {
        averageDuration: totalDuration / cuts.length,
        typeDistribution: cuts.reduce((acc, cut) => {
          acc[cut.productionMethod] = (acc[cut.productionMethod] || 0) + 1
          return acc
        }, {}),
        statusDistribution: cuts.reduce((acc, cut) => {
          acc[cut.status] = (acc[cut.status] || 0) + 1
          return acc
        }, {})
      }
    }
    
    console.log('✅ AI 컷 세분화 완료:', segmentationResult)
    return segmentationResult
    
  } catch (error) {
    console.error('❌ AI 컷 세분화 실패:', error)
    throw new Error('컷 세분화 생성 중 오류가 발생했습니다.')
  }
}

/**
 * 씬의 컷 목록 조회
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {Object} options - 조회 옵션
 * @returns {Promise<Array<CutInfo>>} 컷 목록
 */
export const getCutsForScene = async (projectId, conteId, options = {}) => {
  try {
    console.log('📋 씬 컷 목록 조회:', { projectId, conteId, options })
    
    const result = await cutApi.getCuts(projectId, conteId, options)
    
    if (!result.success) {
      throw new Error(result.message || '컷 목록 조회에 실패했습니다.')
    }
    
    console.log('✅ 씬 컷 목록 조회 완료:', result.data.cuts)
    return result.data.cuts
    
  } catch (error) {
    console.error('❌ 씬 컷 목록 조회 실패:', error)
    throw error
  }
}

/**
 * 컷 생성
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {CutInfo} cutData - 컷 데이터
 * @returns {Promise<CutInfo>} 생성된 컷 정보
 */
export const createCut = async (projectId, conteId, cutData) => {
  try {
    console.log('💾 컷 생성:', { projectId, conteId, cutData })
    
    // 데이터 검증
    if (!cutApi.validateCutData(cutData)) {
      throw new Error('컷 데이터가 유효하지 않습니다.')
    }
    
    const result = await cutApi.createCut(projectId, conteId, cutData)
    
    if (!result.success) {
      throw new Error(result.message || '컷 생성에 실패했습니다.')
    }
    
    console.log('✅ 컷 생성 완료:', result.data.cut)
    return result.data.cut
    
  } catch (error) {
    console.error('❌ 컷 생성 실패:', error)
    throw error
  }
}

/**
 * 컷 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {string} conteId - 씬 ID
 * @param {string} cutId - 컷 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<CutInfo>} 업데이트된 컷 정보
 */
export const updateCut = async (projectId, conteId, cutId, updateData) => {
  try {
    console.log('✏️ 컷 업데이트:', { projectId, conteId, cutId, updateData })
    
    const result = await cutApi.updateCut(projectId, conteId, cutId, updateData)
    
    if (!result.success) {
      throw new Error(result.message || '컷 업데이트에 실패했습니다.')
    }
    
    console.log('✅ 컷 업데이트 완료:', result.data.cut)
    return result.data.cut
    
  } catch (error) {
    console.error('❌ 컷 업데이트 실패:', error)
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
    console.log('🗑️ 컷 삭제:', { projectId, conteId, cutId })
    
    const result = await cutApi.deleteCut(projectId, conteId, cutId)
    
    if (!result.success) {
      throw new Error(result.message || '컷 삭제에 실패했습니다.')
    }
    
    console.log('✅ 컷 삭제 완료')
    return result
    
  } catch (error) {
    console.error('❌ 컷 삭제 실패:', error)
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
    console.log('🔄 컷 순서 변경:', { projectId, conteId, cutOrders })
    
    const result = await cutApi.reorderCuts(projectId, conteId, cutOrders)
    
    if (!result.success) {
      throw new Error(result.message || '컷 순서 변경에 실패했습니다.')
    }
    
    console.log('✅ 컷 순서 변경 완료')
    return result
    
  } catch (error) {
    console.error('❌ 컷 순서 변경 실패:', error)
    throw error
  }
}

/**
 * 컷 정보를 타임라인 형식으로 변환
 * @param {Array<CutInfo>} cuts - 컷 배열
 * @returns {Array} 타임라인 형식의 컷 데이터
 */
export const convertCutsToTimeline = (cuts) => {
  return cuts.map((cut, index) => ({
    id: cut.id,
    title: cut.title,
    description: cut.description,
    shotNumber: cut.shotNumber,
    estimatedDuration: cut.estimatedDuration,
    durationFormatted: cutApi.formatDuration(cut.estimatedDuration),
    cutType: cut.cutType,
    dialogue: cut.dialogue,
    narration: cut.narration,
    characterMovement: cut.characterMovement,
    type: cut.productionMethod,
    status: cut.status,
    order: cut.order,
    metadata: {
      shootingPlan: cut.shootingPlan,
      shootingConditions: cut.shootingConditions,
      requiredPersonnel: cut.requiredPersonnel,
      requiredEquipment: cut.requiredEquipment,
      statusLabel: cutApi.getStatusLabel(cut.status),
      productionMethodLabel: cutApi.getProductionMethodLabel(cut.productionMethod),
      cutTypeLabel: cutApi.getCutTypeLabel(cut.cutType),
      cutTypeColor: cutApi.getCutTypeColor(cut.cutType)
    }
  }))
}

/**
 * 컷 세분화 결과를 시각화 데이터로 변환
 * @param {SegmentationResult} result - 세분화 결과
 * @returns {Object} 시각화 데이터
 */
export const convertToVisualizationData = (result) => {
  return {
    timeline: result.cuts.map(cut => ({
      id: cut.id,
      title: cut.title,
      shotNumber: cut.shotNumber,
      duration: cut.estimatedDuration,
      durationFormatted: cutApi.formatDuration(cut.estimatedDuration),
      cutType: cut.cutType,
      cutTypeLabel: cutApi.getCutTypeLabel(cut.cutType),
      cutTypeColor: cutApi.getCutTypeColor(cut.cutType),
      dialogue: cut.dialogue,
      narration: cut.narration,
      characterMovement: cut.characterMovement,
      label: cutApi.getProductionMethodLabel(cut.productionMethod),
      color: getProductionMethodColor(cut.productionMethod),
      status: cut.status,
      statusLabel: cutApi.getStatusLabel(cut.status),
      metadata: {
        shootingPlan: cut.shootingPlan,
        shootingConditions: cut.shootingConditions,
        requiredPersonnel: cut.requiredPersonnel,
        requiredEquipment: cut.requiredEquipment
      }
    })),
    statistics: result.statistics,
    summary: {
      totalDuration: result.totalDuration,
      totalDurationFormatted: cutApi.formatDuration(result.totalDuration),
      cutCount: result.cutCount,
      averageDuration: result.statistics.averageDuration,
      averageDurationFormatted: cutApi.formatDuration(result.statistics.averageDuration)
    }
  }
}

/**
 * 제작 방법별 색상 반환
 * @param {string} method - 제작 방법
 * @returns {string} 색상 코드
 */
const getProductionMethodColor = (method) => {
  const colors = {
    'live_action': '#4ECDC4', // 청록색 - 실사 촬영
    'ai_generated': '#FF6B6B', // 빨간색 - AI 생성
    'hybrid': '#FFE66D' // 노란색 - 하이브리드
  }
  return colors[method] || '#95A5A6'
}

/**
 * 컷 세분화 결과 검증
 * @param {SegmentationResult} result - 세분화 결과
 * @returns {boolean} 검증 결과
 */
export const validateSegmentationResult = (result) => {
  if (!result.cuts || !Array.isArray(result.cuts)) {
    console.error('❌ 컷 세분화 결과 검증 실패: cuts 배열이 없습니다.')
    return false
  }
  
  if (result.cuts.length === 0) {
    console.error('❌ 컷 세분화 결과 검증 실패: 컷이 없습니다.')
    return false
  }
  
  // 샷 번호 연속성 검증
  for (let i = 0; i < result.cuts.length - 1; i++) {
    if (result.cuts[i].shotNumber + 1 !== result.cuts[i + 1].shotNumber) {
      console.error('❌ 컷 세분화 결과 검증 실패: 샷 번호 연속성이 없습니다.')
      return false
    }
  }
  
  console.log('✅ 컷 세분화 결과 검증 통과')
  return true
}

/**
 * 컷 통계 정보 생성
 * @param {Array<CutInfo>} cuts - 컷 배열
 * @returns {Object} 통계 정보
 */
export const generateCutStatistics = (cuts) => {
  const totalDuration = cuts.reduce((sum, cut) => sum + cut.estimatedDuration, 0)
  const averageDuration = totalDuration / cuts.length
  
  const productionMethodStats = cuts.reduce((acc, cut) => {
    acc[cut.productionMethod] = (acc[cut.productionMethod] || 0) + 1
    return acc
  }, {})
  
  const cutTypeStats = cuts.reduce((acc, cut) => {
    acc[cut.cutType] = (acc[cut.cutType] || 0) + 1
    return acc
  }, {})
  
  const statusStats = cuts.reduce((acc, cut) => {
    acc[cut.status] = (acc[cut.status] || 0) + 1
    return acc
  }, {})
  
  return {
    totalDuration,
    totalDurationFormatted: cutApi.formatDuration(totalDuration),
    averageDuration,
    averageDurationFormatted: cutApi.formatDuration(averageDuration),
    cutCount: cuts.length,
    productionMethodDistribution: productionMethodStats,
    cutTypeDistribution: cutTypeStats,
    statusDistribution: statusStats
  }
}

export default {
  generateCutSegmentation,
  getCutsForScene,
  createCut,
  updateCut,
  deleteCut,
  reorderCuts,
  convertCutsToTimeline,
  convertToVisualizationData,
  validateSegmentationResult,
  generateCutStatistics
} 