import api from './api'

/**
 * AI 스토리 생성 API 서비스 (OpenAI GPT-4o + DALL·E 3)
 * OpenAI GPT-4o를 사용하여 시놉시스 기반 스토리 생성
 * OpenAI DALL·E 3를 사용하여 씬 이미지 생성
 * PRD 2.1.2 AI 스토리 생성 기능의 백엔드 연동
 */

// OpenAI API 제한사항
const OPENAI_LIMITS = {
  GPT4O_REQUESTS_PER_MINUTE: 10,
  DALL_E_REQUESTS_PER_MINUTE: 5,
  MAX_TOKENS_PER_REQUEST: 4000,
  MAX_STORY_LENGTH: 3000,
  IMAGE_GENERATION_LIMIT: 5
}

// API 응답 데이터 구조 정의
/**
 * @typedef {Object} StoryGenerationRequest
 * @property {string} synopsis - 시놉시스 텍스트
 * @property {number} [maxLength] - 최대 스토리 길이 (기본값: 3000)
 * @property {string} [genre] - 영화 장르 (기본값: '일반')
 */

/**
 * @typedef {Object} StoryGenerationResponse
 * @property {string} story - 생성된 스토리 텍스트
 * @property {string} generatedAt - 생성 시간 (ISO 8601 형식)
 * @property {number} tokenCount - 사용된 토큰 수
 * @property {string} model - 사용된 AI 모델명
 * @property {boolean} isFreeTier - 무료 버전 사용 여부
 */

/**
 * @typedef {Object} ImageGenerationRequest
 * @property {string} sceneDescription - 씬 설명
 * @property {string} [style] - 이미지 스타일 (기본값: 'cinematic')
 * @property {string} [genre] - 영화 장르
 * @property {string} [size] - 이미지 크기 (기본값: '1024x1024')
 */

/**
 * @typedef {Object} ImageGenerationResponse
 * @property {string} imageUrl - 생성된 이미지 URL
 * @property {string} prompt - 사용된 프롬프트
 * @property {string} generatedAt - 생성 시간
 * @property {string} model - 사용된 모델명 (dall-e-3)
 * @property {boolean} isFreeTier - 무료 버전 사용 여부
 */

/**
 * AI 스토리 생성 API 호출 (OpenAI GPT-4o)
 * @param {StoryGenerationRequest} requestData - 요청 데이터
 * @returns {Promise<StoryGenerationResponse>} 생성된 스토리 응답
 */
export const generateStory = async (requestData) => {
  try {
    // 요청 데이터 검증
    if (!requestData.synopsis || !requestData.synopsis.trim()) {
      throw new Error('시놉시스가 필요합니다.')
    }

    // OpenAI 제한 적용
    const maxLength = Math.min(requestData.maxLength || 3000, OPENAI_LIMITS.MAX_STORY_LENGTH)
    
    // 기본값 설정
    const request = {
      synopsis: requestData.synopsis.trim(),
      maxLength: maxLength,
      genre: requestData.genre || '일반',
      model: 'gpt-4o', // GPT-4o 모델 사용
      isFreeTier: false // OpenAI는 유료 서비스
    }

    // OpenAI GPT-4o API 호출
    const response = await api.post('/story/generate', request, {
      timeout: 60000, // 60초 타임아웃
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return {
      ...response.data,
      isFreeTier: false
    }
  } catch (error) {
    // 에러 처리 및 재시도 로직
    if (error.response) {
      // 서버 응답 에러
      const status = error.response.status
      const message = error.response.data?.message || '알 수 없는 오류가 발생했습니다.'
      
      switch (status) {
        case 400:
          throw new Error('잘못된 요청입니다. 시놉시스를 다시 확인해주세요.')
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
        case 429:
          throw new Error('OpenAI API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.')
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
      throw new Error(error.message || '알 수 없는 오류가 발생했습니다.')
    }
  }
}

/**
 * AI 이미지 생성 API 호출 (OpenAI DALL·E 3)
 * @param {ImageGenerationRequest} requestData - 요청 데이터
 * @returns {Promise<ImageGenerationResponse>} 생성된 이미지 응답
 */
export const generateSceneImage = async (requestData) => {
  try {
    // 요청 데이터 검증
    if (!requestData.sceneDescription || !requestData.sceneDescription.trim()) {
      throw new Error('씬 설명이 필요합니다.')
    }

    console.log('🎨 이미지 생성 시작:', requestData.sceneDescription)

    try {
      // 실제 이미지 생성 API 호출 시도
      const response = await api.post('/image/generate', requestData, {
        timeout: 60000, // 1분 타임아웃
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('✅ 실제 이미지 생성 완료:', response.data)
      return response.data

    } catch (apiError) {
      console.warn('⚠️ 실제 API 호출 실패, 모의 이미지 생성으로 대체:', apiError.message)
      
      // 실제 API 실패 시 Unsplash API로 모의 이미지 생성
      const mockImageUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(requestData.sceneDescription)}&${Date.now()}`
      
      const mockResponse = {
        imageUrl: mockImageUrl,
        prompt: requestData.sceneDescription,
        generatedAt: new Date().toISOString(),
        model: 'unsplash-api',
        isFreeTier: true
      }

      console.log('✅ 모의 이미지 생성 완료:', mockImageUrl)
      return mockResponse
    }

  } catch (error) {
    console.error('❌ 이미지 생성 완전 실패:', error)
    throw error
  }
}

/**
 * 재시도 로직을 포함한 AI 스토리 생성
 * @param {StoryGenerationRequest} requestData - 요청 데이터
 * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @returns {Promise<StoryGenerationResponse>} 생성된 스토리 응답
 */
export const generateStoryWithRetry = async (requestData, maxRetries = 3) => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateStory(requestData)
    } catch (error) {
      lastError = error
      
      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`AI 스토리 생성 재시도 ${attempt}/${maxRetries}`)
      }
    }
  }
  
  // 모든 재시도 실패
  throw lastError
}

/**
 * 스토리 생성 진행률 콜백을 포함한 API 호출 (향후 구현)
 * @param {StoryGenerationRequest} requestData - 요청 데이터
 * @param {Function} onProgress - 진행률 콜백 함수
 * @returns {Promise<StoryGenerationResponse>} 생성된 스토리 응답
 */
export const generateStoryWithProgress = async (requestData, onProgress) => {
  // TODO: Server-Sent Events 또는 WebSocket을 사용한 실시간 진행률 구현
  onProgress && onProgress(0)
  
  try {
    const result = await generateStory(requestData)
    onProgress && onProgress(100)
    return result
  } catch (error) {
    onProgress && onProgress(-1) // 에러 상태
    throw error
  }
}

/**
 * 스토리 품질 검증 (향후 구현)
 * @param {string} story - 생성된 스토리
 * @returns {Promise<boolean>} 품질 검증 결과
 */
export const validateStoryQuality = async (story) => {
  // TODO: 스토리 품질 검증 로직 구현
  // - 최소 길이 확인
  // - 문법 검사
  // - 내용 일관성 검사
  return story.length >= 100
}

/**
 * 스토리 생성 히스토리 저장 (향후 구현)
 * @param {StoryGenerationRequest} request - 요청 데이터
 * @param {StoryGenerationResponse} response - 응답 데이터
 * @returns {Promise<void>}
 */
export const saveStoryHistory = async (request, response) => {
  try {
    await api.post('/story/history', {
      request,
      response,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.warn('스토리 히스토리 저장 실패:', error)
    // 히스토리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * AI 콘티 생성 API 호출 (OpenAI GPT-4o)
 * @param {ConteGenerationRequest} requestData - 요청 데이터
 * @returns {Promise<ConteGenerationResponse>} 생성된 콘티 응답
 */
export const generateConte = async (requestData) => {
  try {
    // 요청 데이터 검증
    if (!requestData.story || !requestData.story.trim()) {
      throw new Error('스토리가 필요합니다.')
    }

    console.log('🎬 콘티 생성 시작:', { 
      storyLength: requestData.story.length,
      maxScenes: requestData.maxScenes,
      genre: requestData.genre
    })

    // 실제 API 호출
    const response = await api.post('/conte/generate', requestData, {
      timeout: 120000, // 2분 타임아웃
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('✅ 콘티 생성 완료:', response.data)
    
    return response.data

  } catch (error) {
    console.error('❌ 콘티 생성 실패:', error)
    
    // 에러 처리
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || '콘티 생성에 실패했습니다.'
      
      switch (status) {
        case 400:
          throw new Error('잘못된 요청입니다. 스토리를 다시 확인해주세요.')
        case 401:
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.')
        case 429:
          throw new Error('API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.')
        case 500:
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
        default:
          throw new Error(message)
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.')
    } else {
      throw new Error(error.message || '콘티 생성에 실패했습니다.')
    }
  }
}



/**
 * 재시도 로직을 포함한 AI 콘티 생성
 * @param {ConteGenerationRequest} requestData - 요청 데이터
 * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 3)
 * @returns {Promise<ConteGenerationResponse>} 생성된 콘티 응답
 */
export const generateConteWithRetry = async (requestData, maxRetries = 3) => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateConte(requestData)
    } catch (error) {
      lastError = error
      
      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000) // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`AI 콘티 생성 재시도 ${attempt}/${maxRetries}`)
      }
    }
  }
  
  // 모든 재시도 실패
  throw lastError
}

/**
 * 개별 콘티 재생성 API
 * @param {Object} conteData - 재생성할 콘티 데이터
 * @returns {Promise<Object>} 재생성된 콘티 데이터
 */
export const regenerateConte = async (conteData) => {
  try {
    // 요청 데이터 검증
    if (!conteData || !conteData.id) {
      throw new Error('콘티 데이터가 필요합니다.')
    }

    // 재생성 요청 데이터 구성
    const request = {
      conteId: conteData.id,
      title: conteData.title,
      description: conteData.description,
      type: conteData.type,
      scene: conteData.scene,
      // 기존 데이터를 기반으로 재생성
      baseData: {
        dialogue: conteData.dialogue,
        cameraAngle: conteData.cameraAngle,
        cameraWork: conteData.cameraWork,
        lensSpecs: conteData.lensSpecs,
        visualEffects: conteData.visualEffects,
        characterLayout: conteData.characterLayout,
        props: conteData.props,
        lighting: conteData.lighting,
        weather: conteData.weather,
        visualDescription: conteData.visualDescription,
        transition: conteData.transition,
        keywords: conteData.keywords
      }
    }

    // 콘티 재생성 API 호출
    const response = await api.post('/conte/regenerate', request, {
      timeout: 90000, // 90초 타임아웃
      headers: {
        'Content-Type': 'application/json'
      }
    })

    return {
      ...response.data,
      id: conteData.id, // 기존 ID 유지
      scene: conteData.scene, // 기존 씬 번호 유지
      lastModified: new Date().toISOString(),
      modifiedBy: '사용자'
    }
  } catch (error) {
    // 에러 처리
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.message || '콘티 재생성에 실패했습니다.'
      
      switch (status) {
        case 400:
          throw new Error('잘못된 요청입니다. 콘티 데이터를 다시 확인해주세요.')
        case 404:
          throw new Error('콘티를 찾을 수 없습니다.')
        case 429:
          throw new Error('API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.')
        case 500:
          throw new Error('콘티 재생성 서버 오류가 발생했습니다.')
        default:
          throw new Error(message)
      }
    } else if (error.request) {
      throw new Error('네트워크 연결을 확인해주세요.')
    } else {
      throw new Error(error.message || '콘티 재생성에 실패했습니다.')
    }
  }
}

/**
 * 재시도 로직을 포함한 콘티 재생성
 * @param {Object} conteData - 재생성할 콘티 데이터
 * @param {number} maxRetries - 최대 재시도 횟수 (기본값: 2)
 * @returns {Promise<Object>} 재생성된 콘티 데이터
 */
export const regenerateConteWithRetry = async (conteData, maxRetries = 2) => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await regenerateConte(conteData)
    } catch (error) {
      lastError = error
      
      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, delay))
        console.log(`콘티 재생성 재시도 ${attempt}/${maxRetries}`)
      }
    }
  }
  
  // 모든 재시도 실패
  throw lastError
}

export default {
  generateStory,
  generateStoryWithRetry,
  generateStoryWithProgress,
  generateSceneImage,
  validateStoryQuality,
  saveStoryHistory,
  generateConte,
  generateConteWithRetry
} 