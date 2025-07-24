/**
 * SceneForge 타임라인 시간 유틸리티 함수
 * 시간 변환, 포맷팅, 스케일 계산 등 시간 관련 기능 제공
 */

/**
 * 시간 변환 함수들
 */

/**
 * 초를 시:분:초 형식으로 변환
 * @param {number} seconds - 초 단위 시간
 * @returns {string} "HH:MM:SS" 형식의 문자열
 */
export const formatTimeFromSeconds = (seconds) => {
  if (!seconds || seconds < 0) return '00:00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 시:분:초 형식을 초로 변환
 * @param {string} timeString - "HH:MM:SS" 형식의 문자열
 * @returns {number} 초 단위 시간
 */
export const parseTimeToSeconds = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return 0
  
  const parts = timeString.split(':').map(Number)
  if (parts.length !== 3) return 0
  
  const [hours, minutes, seconds] = parts
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * 초를 분:초 형식으로 변환 (1시간 미만일 때)
 * @param {number} seconds - 초 단위 시간
 * @returns {string} "MM:SS" 형식의 문자열
 */
export const formatTimeShort = (seconds) => {
  if (!seconds || seconds < 0) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 시간 스케일 계산 함수들
 */

/**
 * 줌 레벨에 따른 시간 스케일 계산
 * @param {number} zoomLevel - 줌 레벨 (1, 2, 4, 8, 16 등)
 * @param {number} baseScale - 기본 스케일 (픽셀당 초)
 * @returns {number} 픽셀당 시간 (초)
 */
export const calculateTimeScale = (zoomLevel = 1, baseScale = 1) => {
  // 줌 레벨이 높을수록 더 세밀한 시간 표시를 위해 스케일을 조정
  // baseScale은 기본적으로 1초당 몇 픽셀인지를 나타냄
  const adjustedScale = baseScale / Math.max(zoomLevel, 0.1) // 최소 0.1배 줌 보장
  
  // 줌 레벨이 너무 높을 때 스케일이 너무 작아지는 것을 방지
  const minScale = 0.01 // 최소 0.01초당 1픽셀
  const maxScale = 10 // 최대 10초당 1픽셀
  
  return Math.max(minScale, Math.min(maxScale, adjustedScale))
}

/**
 * 시간을 픽셀 위치로 변환
 * @param {number} timeInSeconds - 초 단위 시간
 * @param {number} timeScale - 픽셀당 시간 (초)
 * @returns {number} 픽셀 위치
 */
export const timeToPixels = (timeInSeconds, timeScale) => {
  return timeInSeconds / timeScale
}

/**
 * 픽셀 위치를 시간으로 변환
 * @param {number} pixels - 픽셀 위치
 * @param {number} timeScale - 픽셀당 시간 (초)
 * @returns {number} 초 단위 시간
 */
export const pixelsToTime = (pixels, timeScale) => {
  return pixels * timeScale
}

/**
 * 시간 기반 위치 계산 함수들
 */

/**
 * 씬의 시작 시간 계산 (이전 씬들의 지속 시간 합계)
 * @param {Array} scenes - 씬 배열
 * @param {number} sceneIndex - 현재 씬 인덱스
 * @returns {number} 시작 시간 (초)
 */
export const calculateSceneStartTime = (scenes, sceneIndex) => {
  if (!scenes || sceneIndex < 0 || sceneIndex >= scenes.length) return 0
  
  let startTime = 0
  for (let i = 0; i < sceneIndex; i++) {
    const scene = scenes[i]
    if (scene && scene.duration) {
      startTime += scene.duration
    }
  }
  return startTime
}

/**
 * 씬의 끝 시간 계산
 * @param {Array} scenes - 씬 배열
 * @param {number} sceneIndex - 현재 씬 인덱스
 * @returns {number} 끝 시간 (초)
 */
export const calculateSceneEndTime = (scenes, sceneIndex) => {
  if (!scenes || sceneIndex < 0 || sceneIndex >= scenes.length) return 0
  
  const startTime = calculateSceneStartTime(scenes, sceneIndex)
  const scene = scenes[sceneIndex]
  const duration = scene?.duration || 0
  
  return startTime + duration
}

/**
 * 전체 타임라인 길이 계산
 * @param {Array} scenes - 씬 배열
 * @returns {number} 전체 길이 (초)
 */
export const calculateTotalDuration = (scenes) => {
  if (!scenes || !Array.isArray(scenes)) return 0
  
  return scenes.reduce((total, scene) => {
    return total + (scene?.duration || 0)
  }, 0)
}

/**
 * 시간 포맷팅 함수들
 */

/**
 * 시간을 사람이 읽기 쉬운 형식으로 변환
 * @param {number} seconds - 초 단위 시간
 * @returns {string} "1분 30초" 형식의 문자열
 */
export const formatTimeHumanReadable = (seconds) => {
  if (!seconds || seconds < 0) return '0초'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  let result = ''
  if (hours > 0) {
    result += `${hours}시간 `
  }
  if (minutes > 0) {
    result += `${minutes}분 `
  }
  if (secs > 0 || result === '') {
    result += `${secs}초`
  }
  
  return result.trim()
}

/**
 * 시간 통계 계산 함수들
 */

/**
 * 씬 타입별 시간 통계 계산
 * @param {Array} scenes - 씬 배열
 * @returns {Object} 타입별 시간 통계
 */
export const calculateTimeStats = (scenes) => {
  if (!scenes || !Array.isArray(scenes)) {
    return {
      total: 0,
      generated: 0,
      liveAction: 0,
      average: 0
    }
  }
  
  const stats = {
    total: 0,
    generated: 0,
    liveAction: 0,
    average: 0
  }
  
  scenes.forEach(scene => {
    const duration = scene?.duration || 0
    stats.total += duration
    
    if (scene?.type === 'generated_video') {
      stats.generated += duration
    } else if (scene?.type === 'live_action') {
      stats.liveAction += duration
    }
  })
  
  stats.average = scenes.length > 0 ? stats.total / scenes.length : 0
  
  return stats
}

/**
 * 시간 기반 필터링 함수들
 */

/**
 * 특정 시간 범위의 씬들 필터링
 * @param {Array} scenes - 씬 배열
 * @param {number} startTime - 시작 시간 (초)
 * @param {number} endTime - 끝 시간 (초)
 * @returns {Array} 필터링된 씬 배열
 */
export const filterScenesByTimeRange = (scenes, startTime, endTime) => {
  if (!scenes || !Array.isArray(scenes)) return []
  
  return scenes.filter((scene, index) => {
    const sceneStart = calculateSceneStartTime(scenes, index)
    const sceneEnd = calculateSceneEndTime(scenes, index)
    
    // 씬이 지정된 시간 범위와 겹치는지 확인
    return sceneStart < endTime && sceneEnd > startTime
  })
}

/**
 * 시간 기반 정렬 함수들
 */

/**
 * 씬들을 지속 시간순으로 정렬
 * @param {Array} scenes - 씬 배열
 * @param {string} order - 정렬 순서 ('asc' 또는 'desc')
 * @returns {Array} 정렬된 씬 배열
 */
export const sortScenesByDuration = (scenes, order = 'desc') => {
  if (!scenes || !Array.isArray(scenes)) return []
  
  const sorted = [...scenes].sort((a, b) => {
    const durationA = a?.duration || 0
    const durationB = b?.duration || 0
    
    return order === 'asc' ? durationA - durationB : durationB - durationA
  })
  
  return sorted
}

/**
 * 줌 관련 유틸리티 함수들
 */

/**
 * 줌 레벨에 따른 눈금 간격 계산
 * @param {number} zoomLevel - 줌 레벨
 * @returns {number} 눈금 간격 (초)
 */
export const calculateTickInterval = (zoomLevel) => {
  // 줌 레벨에 따른 동적 눈금 간격 계산
  if (zoomLevel <= 0.5) return 300 // 5분
  if (zoomLevel <= 1) return 60   // 1분
  if (zoomLevel <= 2) return 30   // 30초
  if (zoomLevel <= 4) return 10   // 10초
  if (zoomLevel <= 8) return 5    // 5초
  if (zoomLevel <= 16) return 2   // 2초
  if (zoomLevel <= 32) return 1   // 1초
  if (zoomLevel <= 50) return 0.5 // 0.5초
  
  return 0.2 // 0.2초 (매우 높은 줌)
}

/**
 * 줌 레벨에 따른 최소 씬 너비 계산
 * @param {number} zoomLevel - 줌 레벨
 * @param {number} baseWidth - 기본 너비 (픽셀)
 * @returns {number} 최소 씬 너비 (픽셀)
 */
export const calculateMinSceneWidth = (zoomLevel, baseWidth = 100) => {
  // 줌 레벨에 따른 동적 최소 너비 계산
  // 줌 레벨이 높을수록 더 큰 최소 너비를 가져야 함
  const minWidth = Math.max(baseWidth * zoomLevel, 50) // 최소 50px
  
  // 줌 레벨이 매우 높을 때 (16배 이상) 최소 너비를 더 크게 설정
  if (zoomLevel >= 16) {
    return Math.max(minWidth, 200) // 최소 200px
  } else if (zoomLevel >= 8) {
    return Math.max(minWidth, 150) // 최소 150px
  } else if (zoomLevel >= 4) {
    return Math.max(minWidth, 120) // 최소 120px
  } else if (zoomLevel >= 2) {
    return Math.max(minWidth, 100) // 최소 100px
  }
  
  return minWidth
}

/**
 * 성능 최적화 함수들
 */

/**
 * 가시 영역 내 씬들만 필터링 (가상화용)
 * @param {Array} scenes - 씬 배열
 * @param {number} scrollLeft - 스크롤 위치
 * @param {number} viewportWidth - 뷰포트 너비
 * @param {number} timeScale - 시간 스케일
 * @returns {Array} 가시 영역 내 씬들
 */
export const getVisibleScenes = (scenes, scrollLeft, viewportWidth, timeScale) => {
  if (!scenes || !Array.isArray(scenes)) return []
  
  const startTime = pixelsToTime(scrollLeft, timeScale)
  const endTime = pixelsToTime(scrollLeft + viewportWidth, timeScale)
  
  return filterScenesByTimeRange(scenes, startTime, endTime)
}

/**
 * 시간 유효성 검사 함수들
 */

/**
 * 시간 값이 유효한지 검사
 * @param {number} time - 검사할 시간 (초)
 * @returns {boolean} 유효성 여부
 */
export const isValidTime = (time) => {
  return typeof time === 'number' && time >= 0 && isFinite(time)
}

/**
 * 씬 데이터의 시간 필드 유효성 검사
 * @param {Object} scene - 씬 객체
 * @returns {boolean} 유효성 여부
 */
export const isValidSceneTime = (scene) => {
  if (!scene) return false
  
  const duration = scene.duration
  return isValidTime(duration) && duration > 0
}

/**
 * 이미지 URL을 안전하게 처리하는 함수
 * @param {string} imageUrl - 원본 이미지 URL
 * @returns {string} 처리된 이미지 URL
 */
export const processImageUrl = (imageUrl) => {
  console.log('🔧 processImageUrl 호출됨:', {
    input: imageUrl,
    type: typeof imageUrl,
    isNull: imageUrl === null,
    isUndefined: imageUrl === undefined,
    isEmpty: imageUrl === '',
    length: imageUrl ? imageUrl.length : 0
  })
  
  if (!imageUrl) {
    console.log('❌ processImageUrl: URL이 없음, null 반환')
    return null
  }
  
  // 이미 완전한 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log('✅ processImageUrl: 완전한 URL, 그대로 반환:', imageUrl)
    return imageUrl
  }
  
  // 상대 경로인 경우 API 기본 URL과 결합
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
  const baseUrl = apiBaseUrl.replace('/api', '')
  
  // 경로가 /로 시작하지 않으면 / 추가
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
  const finalUrl = `${baseUrl}${normalizedPath}`
  
  console.log('🔧 processImageUrl 처리 과정:', {
    originalUrl: imageUrl,
    apiBaseUrl: apiBaseUrl,
    baseUrl: baseUrl,
    normalizedPath: normalizedPath,
    finalUrl: finalUrl
  })
  
  console.log('✅ processImageUrl: 최종 URL 반환:', finalUrl)
  return finalUrl
}

export default {
  // 시간 변환
  formatTimeFromSeconds,
  parseTimeToSeconds,
  formatTimeShort,
  formatTimeHumanReadable,
  
  // 스케일 계산
  calculateTimeScale,
  timeToPixels,
  pixelsToTime,
  
  // 위치 계산
  calculateSceneStartTime,
  calculateSceneEndTime,
  calculateTotalDuration,
  
  // 통계
  calculateTimeStats,
  
  // 필터링
  filterScenesByTimeRange,
  sortScenesByDuration,
  getVisibleScenes,
  
  // 줌 관련
  calculateTickInterval,
  calculateMinSceneWidth,
  
  // 유효성 검사
  isValidTime,
  isValidSceneTime,
  processImageUrl
} 