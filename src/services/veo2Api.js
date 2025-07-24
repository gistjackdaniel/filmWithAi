/**
 * Google Cloud Veo2 API 서비스
 * Veo2 모델을 사용한 AI 비디오 생성 기능
 */

// Veo2 API 설정
const VEO2_API_BASE_URL = import.meta.env.VITE_VEO2_API_URL || 'https://us-central1-aiplatform.googleapis.com'
const VEO2_PROJECT_ID = import.meta.env.VITE_GOOGLE_CLOUD_PROJECT_ID
const VEO2_LOCATION = import.meta.env.VITE_GOOGLE_CLOUD_LOCATION || 'us-central1'
const VEO2_MODEL_ID = 'veo-2.0-generate-001' // Veo2 모델 ID

const getVeo2ApiConfig = () => {
  if (!VEO2_PROJECT_ID) {
    throw new Error('Google Cloud Project ID가 설정되지 않았습니다. VITE_GOOGLE_CLOUD_PROJECT_ID 환경변수를 확인하세요.')
  }
  return {
    projectId: VEO2_PROJECT_ID,
    location: VEO2_LOCATION,
    apiBaseUrl: VEO2_API_BASE_URL,
    modelId: VEO2_MODEL_ID,
    endpoint: `projects/${VEO2_PROJECT_ID}/locations/${VEO2_LOCATION}/publishers/google/models/${VEO2_MODEL_ID}`
  }
}

/**
 * 컷 정보를 Veo2 프롬프트로 변환
 * @param {Object} cut - 컷 데이터
 * @returns {Object} { prompt, duration }
 */
const convertCutToVeo2Prompt = (cut) => {
  const {
    title = '',
    description = '',
    shotSize = '',
    angleDirection = '',
    cameraMovement = '',
    lighting = '',
    weather = '',
    timeOfDay = '',
    characters = '',
    dialogue = '',
    visualEffects = ''
  } = cut

  // 기본 프롬프트 구성
  let prompt = `영화적인 장면: ${title || '컷'}`

  // 상세 정보 추가
  if (description) {
    prompt += `, ${description}`
  }

  // 촬영 기술적 요소들 추가
  const technicalElements = []
  if (shotSize) technicalElements.push(`${shotSize} 샷`)
  if (angleDirection) technicalElements.push(`${angleDirection} 앵글`)
  if (cameraMovement) technicalElements.push(`${cameraMovement} 카메라 움직임`)
  
  if (technicalElements.length > 0) {
    prompt += `, ${technicalElements.join(', ')}`
  }

  // 조명 및 분위기
  if (lighting) prompt += `, ${lighting} 조명`
  if (weather) prompt += `, ${weather} 날씨`
  if (timeOfDay) prompt += `, ${timeOfDay} 시간대`

  // 캐릭터 및 대사
  if (characters) prompt += `, ${characters}`
  if (dialogue) prompt += `, 대사: "${dialogue}"`

  // 시각 효과
  if (visualEffects) prompt += `, ${visualEffects}`

  // 영화적 품질 강화
  prompt += ', 영화 스타일, 높은 품질, 상세한 렌더링, 전문적인 촬영'

  // Veo2는 5-8초 지원, 기본값 8초
  const duration = Math.min(Math.max(5, cut.estimatedDuration || 8), 8)

  return { prompt, duration }
}

/**
 * Veo2 API를 사용한 비디오 생성
 * @param {Object} cut - 컷 데이터
 * @param {Function} onProgress - 진행 상황 콜백
 * @returns {Promise<Object>} 생성된 비디오 정보
 */
export const generateVideoWithVeo2 = async (cut, onProgress) => {
  try {
    const config = getVeo2ApiConfig()
    const { prompt, duration } = convertCutToVeo2Prompt(cut)
    
    console.log('🎬 Veo2 비디오 생성 시작:', {
      cutId: cut.id,
      prompt: prompt.substring(0, 100) + '...',
      duration
    })

    if (onProgress) {
      onProgress({ status: 'initiating', message: 'Veo2 API 요청을 시작합니다...' })
    }

    // Google Cloud 인증 토큰 가져오기
    const authToken = await getGoogleCloudAuthToken()
    
    // Veo2 API 요청 데이터 구성
    const requestData = {
      instances: [
        {
          prompt: prompt
        }
      ],
      parameters: {
        durationSeconds: duration,
        sampleCount: 1,
        aspectRatio: "16:9",
        personGeneration: "allow_adult",
        enhancePrompt: true
      }
    }

    console.log('📤 Veo2 API 요청 전송:', {
      endpoint: `${config.endpoint}:predictLongRunning`,
      promptLength: prompt.length,
      duration
    })

    // Veo2 API 호출
    const response = await fetch(`${config.apiBaseUrl}/v1/${config.endpoint}:predictLongRunning`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Veo2 API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const operationId = data.name

    console.log('✅ Veo2 API 요청 성공, 작업 ID:', operationId)

    if (onProgress) {
      onProgress({ status: 'processing', message: '비디오를 생성하고 있습니다...', operationId })
    }

    // 작업 완료 대기
    const result = await waitForVeo2Operation(operationId, authToken, config, onProgress)
    
    return {
      id: operationId,
      status: 'completed',
      videoUrl: result.videoUrl,
      prompt: prompt,
      duration: duration,
      createdAt: new Date().toISOString(),
      cutId: cut.id,
      model: 'veo2'
    }

  } catch (error) {
    console.error('❌ Veo2 비디오 생성 오류:', error)
    throw new Error(`Veo2 비디오 생성 실패: ${error.message}`)
  }
}

/**
 * Veo2 작업 완료 대기
 * @param {string} operationId - 작업 ID
 * @param {string} authToken - 인증 토큰
 * @param {Object} config - API 설정
 * @param {Function} onProgress - 진행 상황 콜백
 * @returns {Promise<Object>} 작업 결과
 */
const waitForVeo2Operation = async (operationId, authToken, config, onProgress) => {
  const maxAttempts = 60 // 최대 5분 대기 (5초마다)
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const statusResponse = await fetch(`${config.apiBaseUrl}/v1/${config.endpoint}:fetchPredictOperation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operationName: operationId })
      })

      if (!statusResponse.ok) {
        throw new Error(`상태 확인 실패: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      
      console.log(`🔄 Veo2 작업 상태 확인 (${attempts + 1}/${maxAttempts}):`, {
        done: statusData.done,
        hasResponse: !!statusData.response
      })

      if (statusData.done) {
        if (statusData.response && statusData.response.generatedSamples) {
          const videoSample = statusData.response.generatedSamples[0]
          if (videoSample && videoSample.video && videoSample.video.uri) {
            console.log('✅ Veo2 비디오 생성 완료:', videoSample.video.uri)
            return { videoUrl: videoSample.video.uri, operationId }
          }
        }
        throw new Error('비디오 생성은 완료되었지만 결과를 찾을 수 없습니다.')
      }

      if (onProgress) {
        const progress = Math.min((attempts / maxAttempts) * 100, 95)
        onProgress({ 
          status: 'processing', 
          message: `비디오 생성 중... (${progress.toFixed(1)}%)`,
          progress: progress
        })
      }

      // 5초 대기
      await new Promise(resolve => setTimeout(resolve, 5000))
      attempts++

    } catch (error) {
      console.error('❌ Veo2 작업 상태 확인 오류:', error)
      attempts++
      
      if (attempts >= maxAttempts) {
        throw new Error('작업 상태 확인 중 오류가 발생했습니다.')
      }
      
      // 오류 발생 시 10초 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  }

  throw new Error('비디오 생성 시간 초과 (5분)')
}

/**
 * Google Cloud 인증 토큰 가져오기
 * @returns {Promise<string>} 인증 토큰
 */
const getGoogleCloudAuthToken = async () => {
  try {
    const response = await fetch('/api/auth/google-cloud-token')
    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Google Cloud 인증 실패')
    }
    
    return data.token
  } catch (error) {
    console.error('❌ Google Cloud 인증 토큰 가져오기 실패:', error)
    throw new Error('Google Cloud 인증에 실패했습니다.')
  }
}

/**
 * Veo2 API 사용 가능 여부 확인
 * @returns {Promise<boolean>} 사용 가능 여부
 */
export const checkVeo2ApiAvailability = async () => {
  try {
    const config = getVeo2ApiConfig()
    const authToken = await getGoogleCloudAuthToken()
    
    // 간단한 테스트 요청으로 API 사용 가능 여부 확인
    const testResponse = await fetch(`${config.apiBaseUrl}/v1/${config.endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    return testResponse.ok
  } catch (error) {
    console.error('❌ Veo2 API 사용 가능 여부 확인 실패:', error)
    return false
  }
}

/**
 * Veo2 모델 정보 가져오기
 * @returns {Promise<Object>} 모델 정보
 */
export const getVeo2ModelInfo = async () => {
  try {
    const config = getVeo2ApiConfig()
    const authToken = await getGoogleCloudAuthToken()
    
    const response = await fetch(`${config.apiBaseUrl}/v1/${config.endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`모델 정보 가져오기 실패: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('❌ Veo2 모델 정보 가져오기 실패:', error)
    throw error
  }
}

export default {
  generateVideoWithVeo2,
  checkVeo2ApiAvailability,
  getVeo2ModelInfo
} 