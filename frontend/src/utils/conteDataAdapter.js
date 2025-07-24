/**
 * 콘티 데이터 어댑터
 * 프론트엔드 콘티 데이터를 백엔드 Conte 모델에 맞게 변환
 */

/**
 * 프론트엔드 콘티 데이터를 백엔드 모델에 맞게 변환
 * @param {Object} conteData - 프론트엔드 콘티 데이터
 * @param {string} projectId - 프로젝트 ID
 * @returns {Object} 백엔드 모델에 맞는 콘티 데이터
 */
export const adaptConteForBackend = (conteData, projectId) => {
  // 기본 필수 필드 검증
  if (!conteData.scene || !conteData.title || !conteData.description) {
    throw new Error('씬 번호, 제목, 설명은 필수입니다.')
  }

  // 백엔드 모델에 맞는 데이터 구조로 변환
  const adaptedConte = {
    projectId: projectId,
    scene: parseInt(conteData.scene) || 1,
    title: conteData.title || `씬 ${conteData.scene}`,
    description: conteData.description || '',
    
    // 12개 구성요소
    dialogue: conteData.dialogue || '',
    cameraAngle: conteData.cameraAngle || '',
    cameraWork: conteData.cameraWork || '',
    characterLayout: conteData.characterLayout || '',
    props: conteData.props || '',
    weather: conteData.weather || '',
    lighting: conteData.lighting || '',
    visualDescription: conteData.visualDescription || '',
    transition: conteData.transition || '',
    lensSpecs: conteData.lensSpecs || '',
    visualEffects: conteData.visualEffects || '',
    
    // 콘티 타입 (enum 값 검증)
    type: conteData.type === 'generated_video' ? 'generated_video' : 'live_action',
    estimatedDuration: conteData.estimatedDuration || '5분',
    
    // 키워드 노드 구조
    keywords: {
      userInfo: conteData.keywords?.userInfo || '기본 사용자',
      location: conteData.keywords?.location || '기본 장소',
      date: conteData.keywords?.date || '2024-01-01',
      equipment: conteData.keywords?.equipment || '기본 장비',
      cast: Array.isArray(conteData.keywords?.cast) ? conteData.keywords.cast : ['기본 배우'],
      props: Array.isArray(conteData.keywords?.props) ? conteData.keywords.props : ['기본 소품'],
      lighting: conteData.keywords?.lighting || '기본 조명',
      weather: conteData.keywords?.weather || '맑음',
      timeOfDay: validateTimeOfDay(conteData.keywords?.timeOfDay),
      specialRequirements: Array.isArray(conteData.keywords?.specialRequirements) 
        ? conteData.keywords.specialRequirements : []
    },
    
    // 그래프 가중치
    weights: {
      locationPriority: validateWeight(conteData.weights?.locationPriority, 1),
      equipmentPriority: validateWeight(conteData.weights?.equipmentPriority, 1),
      castPriority: validateWeight(conteData.weights?.castPriority, 1),
      timePriority: validateWeight(conteData.weights?.timePriority, 1),
      complexity: validateWeight(conteData.weights?.complexity, 1)
    },
    
    // 편집 권한
    canEdit: conteData.canEdit !== false,
    
    // 순서 (씬 번호와 동일하게 설정)
    order: parseInt(conteData.scene) || 1
  }

  return adaptedConte
}

/**
 * timeOfDay 값 검증 (백엔드 enum에 맞게)
 * @param {string} timeOfDay - 시간대 값
 * @returns {string} 검증된 시간대 값
 */
const validateTimeOfDay = (timeOfDay) => {
  const validTimes = ['새벽', '아침', '오후', '저녁', '밤', '낮']
  
  if (validTimes.includes(timeOfDay)) {
    return timeOfDay
  }
  
  // '낮' 값이 없었던 문제 해결
  if (timeOfDay === '주간' || timeOfDay === 'day') {
    return '낮'
  }
  
  return '오후' // 기본값
}

/**
 * 가중치 값 검증 (1-5 범위)
 * @param {number} weight - 가중치 값
 * @param {number} defaultValue - 기본값
 * @returns {number} 검증된 가중치 값
 */
const validateWeight = (weight, defaultValue = 1) => {
  const numWeight = parseInt(weight)
  
  if (isNaN(numWeight)) {
    return defaultValue
  }
  
  // 1-5 범위로 제한
  return Math.max(1, Math.min(5, numWeight))
}

/**
 * 백엔드 콘티 데이터를 프론트엔드에 맞게 변환
 * @param {Object} backendConte - 백엔드 콘티 데이터
 * @returns {Object} 프론트엔드에 맞는 콘티 데이터
 */
export const adaptConteForFrontend = (backendConte) => {
  return {
    id: backendConte._id || backendConte.id,
    scene: backendConte.scene,
    title: backendConte.title,
    description: backendConte.description,
    
    // 12개 구성요소
    dialogue: backendConte.dialogue,
    cameraAngle: backendConte.cameraAngle,
    cameraWork: backendConte.cameraWork,
    characterLayout: backendConte.characterLayout,
    props: backendConte.props,
    weather: backendConte.weather,
    lighting: backendConte.lighting,
    visualDescription: backendConte.visualDescription,
    transition: backendConte.transition,
    lensSpecs: backendConte.lensSpecs,
    visualEffects: backendConte.visualEffects,
    
    // 콘티 타입
    type: backendConte.type,
    estimatedDuration: backendConte.estimatedDuration,
    
    // 키워드 노드
    keywords: backendConte.keywords || {},
    
    // 그래프 가중치
    weights: backendConte.weights || {},
    
    // 편집 권한
    canEdit: backendConte.canEdit !== false,
    
    // 수정 정보
    lastModified: backendConte.lastModified,
    modifiedBy: backendConte.modifiedBy,
    
    // 순서
    order: backendConte.order
  }
}

/**
 * 콘티 데이터 검증
 * @param {Object} conteData - 검증할 콘티 데이터
 * @returns {Object} 검증 결과
 */
export const validateConteData = (conteData) => {
  const errors = []
  
  // 필수 필드 검증
  if (!conteData.scene) {
    errors.push('씬 번호가 필요합니다.')
  }
  
  if (!conteData.title || !conteData.title.trim()) {
    errors.push('제목이 필요합니다.')
  }
  
  if (!conteData.description || !conteData.description.trim()) {
    errors.push('설명이 필요합니다.')
  }
  
  // 타입 검증
  if (conteData.type && !['generated_video', 'live_action'].includes(conteData.type)) {
    errors.push('올바르지 않은 콘티 타입입니다.')
  }
  
  // timeOfDay 검증
  if (conteData.keywords?.timeOfDay) {
    const validTimes = ['새벽', '아침', '오후', '저녁', '밤', '낮']
    if (!validTimes.includes(conteData.keywords.timeOfDay)) {
      errors.push('올바르지 않은 시간대입니다.')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
} 