const express = require('express')
const cors = require('cors')
const axios = require('axios')
const mongoose = require('mongoose')
const http = require('http')
const path = require('path')
const { validateEnvironmentVariables } = require('./config/security')
const {
  rateLimiter,
  corsMiddleware,
  helmetMiddleware,
  sqlInjectionProtection,
  requestLogging,
  errorHandler
} = require('./middleware/security')
const RealtimeService = require('./services/realtimeService')
const AnalyticsService = require('./services/analyticsService')
const MonitoringService = require('./services/monitoringService')
require('dotenv').config()

/**
 * SceneForge 백엔드 서버
 * AI 스토리 생성 및 이미지 생성 API 제공
 * MongoDB 연동으로 사용자별 데이터 영구 저장
 * 보안 강화 미들웨어 적용
 */

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5001

// 환경 변수 검증
try {
  validateEnvironmentVariables()
  console.log('✅ 환경 변수 검증 완료')
} catch (error) {
  console.error('❌ 환경 변수 검증 실패:', error.message)
  process.exit(1)
}

// 보안 미들웨어 설정
app.use(helmetMiddleware)
app.use(corsMiddleware)
app.use(rateLimiter)
app.use(requestLogging)
app.use(sqlInjectionProtection)

// 기본 미들웨어 설정
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 정적 파일 서빙 (이미지 파일용) - CORS 헤더 추가
app.use('/uploads', (req, res, next) => {
  // CORS 헤더 설정
  res.header('Access-Control-Allow-Origin', 'http://localhost:3002');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')))

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI // || 'mongodb://localhost:27017/sceneforge_db'

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공:', MONGODB_URI)
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error.message)
  process.exit(1)
})

// MongoDB 연결 상태 모니터링
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB 연결 오류:', error)
})

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB 연결이 끊어졌습니다.')
})

// OpenAI API 키 확인
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.')
  console.log('📝 .env 파일에 OPENAI_API_KEY를 추가해주세요.')
  process.exit(1)
}

// 라우터 등록
const authRoutes = require('./routes/auth'); // 기존 인증 라우트
const userRoutes = require('./routes/users'); // 사용자 관리 라우트
const projectRoutes = require('./routes/projects'); // 프로젝트 관리 라우트
const conteRoutes = require('./routes/contes'); // 콘티 관리 라우트
const timelineRoutes = require('./routes/timeline'); // 타임라인 WebSocket 라우트

app.use('/api/auth', authRoutes); // /api/auth/* 경로를 auth 라우터로 연결
app.use('/api/users', userRoutes); // /api/users/* 경로를 user 라우터로 연결
app.use('/api/projects', projectRoutes); // /api/projects/* 경로를 project 라우터로 연결
app.use('/api/projects', conteRoutes); // /api/projects/*/contes/* 경로를 conte 라우터로 연결
app.use('/api/timeline', timelineRoutes.router); // /api/timeline/* 경로를 timeline 라우터로 연결

/**
 * AI 스토리 생성 API
 * POST /api/story/generate
 */
app.post('/api/story/generate', async (req, res) => {
  try {
    const { synopsis, maxLength = 3000, genre = '일반' } = req.body

    // 입력 검증
    if (!synopsis || !synopsis.trim()) {
      return res.status(400).json({
        success: false,
        message: '시놉시스가 필요합니다.'
      })
    }

    console.log('🎬 AI 스토리 생성 요청:', { synopsis: synopsis.substring(0, 100) + '...', maxLength, genre })

    // OpenAI GPT-4o API 호출
    const prompt = `
다음 시놉시스를 바탕으로 영화 스토리를 생성해주세요.

시놉시스: ${synopsis}
장르: ${genre}
최대 길이: ${maxLength}자

다음 형식으로 작성해주세요:
1. 스토리 개요 (2-3문장)
2. 주요 등장인물 소개
3. 스토리 전개 (시작-전개-위기-절정-결말)
4. 핵심 메시지

한국어로 자연스럽게 작성해주세요.
`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 영화 스토리 작가입니다. 창의적이고 매력적인 스토리를 작성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(maxLength, 4000),
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60초 타임아웃
      }
    )

    const story = response.data.choices[0].message.content.trim()
    const tokenCount = response.data.usage.total_tokens

    console.log('✅ AI 스토리 생성 완료:', { tokenCount, storyLength: story.length })

    // 마크다운 제거 후 응답
    const cleanedStory = cleanStoryText(story)

    res.json({
      success: true,
      story: cleanedStory,
      generatedAt: new Date().toISOString(),
      tokenCount: tokenCount,
      model: 'gpt-4o',
      isFreeTier: false
    })

  } catch (error) {
    console.error('❌ AI 스토리 생성 오류:', error.message)
    
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.error?.message || 'OpenAI API 오류'
      
      switch (status) {
        case 400:
          return res.status(400).json({
            success: false,
            message: '잘못된 요청입니다. 시놉시스를 다시 확인해주세요.'
          })
        case 401:
          return res.status(401).json({
            success: false,
            message: 'OpenAI API 키가 유효하지 않습니다.'
          })
        case 429:
          return res.status(429).json({
            success: false,
            message: 'OpenAI API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.'
          })
        default:
          return res.status(500).json({
            success: false,
            message: 'AI 스토리 생성 중 오류가 발생했습니다.'
          })
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      })
    } else {
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    }
  }
})

/**
 * 장면의 특성에 따라 예상 시간을 계산하는 함수
 * @param {Object} sceneData - 장면 데이터
 * @returns {string} 예상 시간 (예: "3분", "1분 30초")
 */
const calculateSceneDuration = (sceneData) => {
  let baseDuration = 2 // 기본 2분
  
  // 대사 길이에 따른 시간 계산 (더 정교한 계산)
  if (sceneData.dialogue) {
    const dialogueLength = sceneData.dialogue.length
    const wordCount = sceneData.dialogue.split(/\s+/).length
    
    // 대사가 있는 경우 기본 시간 증가
    if (dialogueLength > 0) {
      baseDuration += 0.5
    }
    
    // 대사 길이에 따른 추가 시간
    if (dialogueLength > 100) {
      baseDuration += 1 // 긴 대사
    } else if (dialogueLength > 50) {
      baseDuration += 0.5 // 중간 길이 대사
    }
    
    // 단어 수에 따른 추가 시간 (한국어 기준)
    if (wordCount > 20) {
      baseDuration += 0.5 // 많은 단어
    } else if (wordCount > 10) {
      baseDuration += 0.25 // 중간 단어 수
    }
    
    // 감정적 대사는 시간 증가
    if (sceneData.dialogue.includes('!') || 
        sceneData.dialogue.includes('?') ||
        sceneData.dialogue.includes('...') ||
        sceneData.dialogue.includes('ㅠ') ||
        sceneData.dialogue.includes('ㅜ')) {
      baseDuration += 0.25
    }
  }
  
  // 특수효과나 CG가 필요한 장면은 시간 증가
  if (sceneData.visualEffects && (
    sceneData.visualEffects.includes('CG') ||
    sceneData.visualEffects.includes('특수효과') ||
    sceneData.visualEffects.includes('AI')
  )) {
    baseDuration += 1
  }
  
  // 액션 장면은 시간 증가
  if (sceneData.description && (
    sceneData.description.includes('액션') ||
    sceneData.description.includes('싸움') ||
    sceneData.description.includes('추격') ||
    sceneData.description.includes('달리기')
  )) {
    baseDuration += 1
  }
  
  // 감정적 장면은 시간 증가
  if (sceneData.description && (
    sceneData.description.includes('감정') ||
    sceneData.description.includes('눈물') ||
    sceneData.description.includes('고백') ||
    sceneData.description.includes('이별')
  )) {
    baseDuration += 1
  }
  
  // 단순한 자연 풍경은 시간 감소
  if (sceneData.visualDescription && (
    sceneData.visualDescription.includes('하늘') ||
    sceneData.visualDescription.includes('바다') ||
    sceneData.visualDescription.includes('구름')
  )) {
    baseDuration = Math.max(1, baseDuration - 1)
  }
  
  // AI 생성 비디오는 일반적으로 시간 감소
  if (sceneData.type === 'generated_video') {
    baseDuration = Math.max(1, baseDuration - 0.5)
  }
  
  // 최소 1분, 최대 8분으로 제한
  baseDuration = Math.max(1, Math.min(8, baseDuration))
  
  // 분과 초로 변환
  const minutes = Math.floor(baseDuration)
  const seconds = Math.round((baseDuration - minutes) * 60)
  
  if (seconds === 0) {
    return `${minutes}분`
  } else {
    return `${minutes}분 ${seconds}초`
  }
}

/**
 * AI 이미지 생성 API
 * POST /api/image/generate
 */
app.post('/api/image/generate', async (req, res) => {
  try {
    // 개발 환경에서는 임시 이미지 반환
    if (process.env.NODE_ENV === 'development') {
      // 서버가 정적 파일을 /uploads/images 경로로 서비스한다고 가정
      const imageUrl = `/uploads/images/dev_placeholder.png`;
      console.log('🥝🥝🥝 AI 이미지 안 만듦');
      return res.json({
        success: true,
        imageUrl: imageUrl,
        prompt: '[개발용 임시 이미지]',
        generatedAt: new Date().toISOString(),
        model: 'dev-placeholder',
        isFreeTier: true
      });
    }
    const { sceneDescription, style = 'cinematic', genre = '일반', size = '1024x1024' } = req.body

    // 입력 검증
    if (!sceneDescription || !sceneDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: '씬 설명이 필요합니다.'
      })
    }

    console.log('🎨 AI 이미지 생성 요청:', { sceneDescription: sceneDescription.substring(0, 100) + '...', style, genre })

    // DALL·E 3 프롬프트 생성
    const prompt = `${sceneDescription}, ${style} style, ${genre} movie scene, high quality, cinematic lighting`

    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
        style: 'natural'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2분 타임아웃
      }
    )

    const imageUrl = response.data.data[0].url

    console.log('✅ AI 이미지 생성 완료:', { imageUrl })

    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      generatedAt: new Date().toISOString(),
      model: 'dall-e-3',
      isFreeTier: false
    })

  } catch (error) {
    console.error('❌ AI 이미지 생성 오류:', error.message)
    
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.error?.message || 'OpenAI API 오류'
      
      switch (status) {
        case 400:
          return res.status(400).json({
            success: false,
            message: '잘못된 요청입니다. 씬 설명을 다시 확인해주세요.'
          })
        case 429:
          return res.status(429).json({
            success: false,
            message: 'DALL·E 3 API 사용 한도에 도달했습니다.'
          })
        default:
          return res.status(500).json({
            success: false,
            message: 'AI 이미지 생성 중 오류가 발생했습니다.'
          })
      }
    } else {
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    }
  }
})

/**
 * AI 콘티 생성 API
 * POST /api/conte/generate
 */
app.post('/api/conte/generate', async (req, res) => {
  try {
    const { story, maxScenes = 2, genre = '일반' } = req.body

    // 입력 검증
    if (!story || !story.trim()) {
      return res.status(400).json({
        success: false,
        message: '스토리가 필요합니다.'
      })
    }

    console.log('🎬 AI 콘티 생성 요청:', { storyLength: story.length, maxScenes, genre })

    // maxScenes 검증 및 제한
    const validatedMaxScenes = Math.min(Math.max(parseInt(maxScenes) || 2, 1), 10)
    console.log('✅ 검증된 maxScenes:', validatedMaxScenes)

    // OpenAI GPT-4o API 호출 - 캡션 카드 구조에 맞춘 상세한 콘티 생성
    const prompt = `
다음 스토리를 바탕으로 영화 캡션 카드를 생성해주세요.

스토리: ${story}
장르: ${genre}
최대 씬 수: ${validatedMaxScenes}

**중요: 정확히 ${validatedMaxScenes}개의 씬만 생성해주세요. 더 많거나 적게 생성하지 마세요.**

각 캡션 카드는 다음 12개 구성 요소를 모두 포함해야 합니다:

1. **인물들이 처한 상황에 대한 대략적인 설명**: 등장인물들의 현재 상황과 감정 상태
2. **해당 장면을 대표하는 대사**: 장면의 전체 시간 동안 나올 모든 대사, 내레이션, 음성 효과를 포함 (예상 시간에 맞는 충분한 대사량)
3. **카메라/그림 앵글과 구도를 설명하는 배치도**: 카메라 위치, 앵글, 구도 설명
4. **카메라 워크 및 그림의 장면 전환을 설명하는 화살표들**: 카메라 이동과 전환 효과
5. **인물 배치도와 인물의 동선을 설명하는 화살표**: 등장인물들의 위치와 움직임
6. **소품 배치**: 장면에 필요한 소품들의 배치와 사용법
7. **날씨와 지형**: 촬영 환경의 날씨 조건과 지형적 특징
8. **조명**: 조명 설정, 분위기, 조명 효과
9. **각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명**: 시각적 묘사
10. **장면, 시퀀스의 전환점**: 이전/다음 장면과의 연결성
11. **렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식**: 기술적 촬영 정보
12. **사용할 그래픽 툴, 넣어야하는 시각효과**: 후반 작업 정보

그리고 각 카드의 타입을 다음 기준에 따라 분류해주세요:

**"generated_video" (AI 생성 비디오)로 분류하는 경우:**
- 특수효과나 CG가 필요한 장면
- 환상적이거나 초자연적인 요소가 포함된 장면 (마법, 미래, 우주, 초자연적 현상 등)
- AI 시각효과가 포함된 장면
- 실제로 촬영하기 어려운 장면들
- 단순한 자연 풍경 장면 (하늘, 바다, 자연 풍경)

**"live_action" (실사 촬영)로 분류하는 경우:**
- 실제 배우의 연기가 중요한 장면
- 실제 소품과 물리적 상호작용이 필요한 장면
- 자연광이나 실제 조명 효과가 중요한 장면
- 특정 실제 장소에서 촬영이 필요한 장면
- 실제 감정 표현이나 인간적 상호작용이 중심인 장면

분류 시 각 장면의 특성을 분석하여 가장 적합한 방식을 선택해주세요.

**예상 시간 계산 기준:**
- 기본 시간: 2분
- 대사가 있는 장면: +0.5분
- 긴 대사 (100자 이상): +1분
- 중간 길이 대사 (50자 이상): +0.5분
- 많은 단어 (20개 이상): +0.5분
- 중간 단어 수 (10개 이상): +0.25분
- 감정적 대사 (!, ?, ..., ㅠ, ㅜ): +0.25분
- 특수효과/CG 장면: +1분  
- 액션 장면: +1분
- 감정적 장면: +1분
- 단순 자연 풍경: -1분
- AI 생성 비디오: -0.5분
- 최소 1분, 최대 8분으로 제한

**대사 생성 지침:**
- 각 장면의 예상 시간에 맞는 충분한 대사량을 생성해주세요
- 1분당 약 150-200자 정도의 대사가 적절합니다
- 대사는 자연스러운 대화 흐름을 따라야 합니다
- 내레이션, 음성 효과, 배경 음성도 포함해주세요
- 대사가 없는 장면도 있지만, 대부분의 장면에는 적절한 대사가 있어야 합니다
- 대사 형식 예시:
  * "안녕하세요, 어떻게 지내세요?" (대화)
  * "그 순간, 모든 것이 바뀌었다..." (내레이션)
  * "[배경음: 차량 소음]" (음성 효과)
  * "아... 정말 힘들어..." (감정 표현)

**필요인력 및 필요장비 정보:**
- **필요인력**: 각 장면에 필요한 인력 구성 (예: "감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명")
- **필요장비**: 각 장면에 필요한 장비 목록 (예: "카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개")
- **카메라 정보**: C1부터 C20까지의 카메라 중 해당 장면에 적합한 카메라 지정 (예: "C1", "C2", "C3" 등)

**시간대 구분:**
- **낮**: 해가 떠있는 시간대 (오전 6시 ~ 오후 6시)
- **밤**: 해가 진 시간대 (오후 6시 ~ 오전 6시)

**중요:**
- 반드시 각 콘티의 keywords에 timeOfDay(촬영 시간대)를 포함해야 하며,
  "낮" 또는 "밤" 중 하나로 명확히 작성해야 합니다.
- timeOfDay가 누락된 콘티는 절대 생성하지 마세요.
- 누락 시 전체 응답을 다시 생성하세요.

반드시 다음 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:

{
  "conteList": [
    {
      "id": "scene_1",
      "scene": 1,
      "title": "씬 제목",
      "description": "인물들이 처한 상황에 대한 대략적인 설명",
      "dialogue": "해당 장면을 대표하는 대사",
      "cameraAngle": "카메라/그림 앵글과 구도를 설명하는 배치도",
      "cameraWork": "카메라 워크 및 그림의 장면 전환을 설명하는 화살표들",
      "characterLayout": "인물 배치도와 인물의 동선을 설명하는 화살표",
      "props": "소품 배치",
      "weather": "날씨와 지형",
      "lighting": "조명",
      "visualDescription": "각 장면과 시퀀스를 직관적으로 이해시킬 대표적인 그림 설명",
      "transition": "장면, 시퀀스의 전환점",
      "lensSpecs": "렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식",
      "visualEffects": "사용할 그래픽 툴, 넣어야하는 시각효과",
      "type": "generated_video",
      "typeReason": "AI 시각효과와 특수효과가 필요한 장면으로 판단됨",
      "estimatedDuration": "3분",
      "requiredPersonnel": "감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명",
      "requiredEquipment": "카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개",
      "camera": "C1",
      "keywords": {
        "userInfo": "기본 사용자",
        "location": "기본 장소",
        "date": "2024-01-01",
        "equipment": "기본 장비",
        "cast": ["주인공", "조연"],
        "props": ["기본 소품"],
        "lighting": "기본 조명",
        "weather": "맑음",
        "timeOfDay": "낮", // 반드시 "낮" 또는 "밤"으로 포함!
        "specialRequirements": []
      },
      "weights": {
        "locationPriority": 1,
        "equipmentPriority": 1,
        "castPriority": 1,
        "timePriority": 1,
        "complexity": 1
      },
      "canEdit": true,
      "lastModified": "",
      "modifiedBy": ""
    }
  ]
}

**반드시 모든 콘티에 timeOfDay가 포함되어야 하며, 누락 시 전체 응답을 다시 생성하세요.**

JSON 이외의 텍스트는 포함하지 마세요.
한국어로 자연스럽게 작성해주세요.
`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 영화 캡션 카드 작가입니다. 상세하고 전문적인 캡션 카드를 작성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2분 타임아웃
      }
    )

    const content = response.data.choices[0].message.content.trim()
    const tokenCount = response.data.usage.total_tokens

    // JSON 파싱 시도
    let conteList = []
    try {
      // 1. content가 JSON 문자열인지 확인
      let parsed = null
      
      console.log('🔍 원본 응답 분석:', {
        contentType: typeof content,
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...',
        hasConteList: content.includes('conteList'),
        hasScenes: content.includes('scenes'),
        hasCards: content.includes('cards')
      })
      
      // JSON 객체로 직접 파싱 시도
      try {
        parsed = JSON.parse(content)
        console.log('✅ 직접 JSON 파싱 성공')
        console.log('📋 파싱된 객체 분석:', {
          parsedType: typeof parsed,
          parsedKeys: Object.keys(parsed),
          hasConteList: parsed.conteList ? 'yes' : 'no',
          conteListType: parsed.conteList ? typeof parsed.conteList : 'N/A',
          isConteListArray: Array.isArray(parsed.conteList)
        })
      } catch (parseError) {
        console.log('❌ 직접 JSON 파싱 실패:', parseError.message)
        
        // 2. content에서 JSON 부분만 추출 시도
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0])
            console.log('✅ JSON 추출 파싱 성공')
          } catch (extractError) {
            console.log('❌ JSON 추출 파싱도 실패:', extractError.message)
            
            // 3. 간단한 기본 콘티 생성 (파싱 실패 시)
            console.log('⚠️ 파싱 실패로 기본 콘티 생성')
            parsed = {
              conteList: [{
                id: 'scene_1',
                scene: 1,
                title: '기본 씬',
                description: '스토리 기반 기본 씬',
                dialogue: '기본 대사',
                cameraAngle: '기본 카메라 앵글',
                cameraWork: '기본 카메라 워크',
                characterLayout: '기본 인물 배치',
                props: '기본 소품',
                weather: '맑음',
                lighting: '기본 조명',
                visualDescription: '기본 시각적 묘사',
                transition: '기본 전환',
                lensSpecs: '기본 렌즈 사양',
                visualEffects: '기본 시각효과',
                type: 'live_action',
                typeReason: '실제 배우의 연기와 물리적 상호작용이 중요한 장면으로 판단됨',
                estimatedDuration: calculateSceneDuration({
                  dialogue: '기본 대사',
                  visualEffects: '기본 시각효과',
                  description: '스토리 기반 기본 씬',
                  type: 'live_action'
                }),
                keywords: {
                  userInfo: '기본 사용자',
                  location: '기본 장소',
                  date: '2024-01-01',
                  equipment: '기본 장비',
                  cast: ['주인공'],
                  props: ['기본 소품'],
                  lighting: '기본 조명',
                  weather: '맑음',
                  timeOfDay: '주간',
                  specialRequirements: []
                },
                weights: {
                  locationPriority: 1,
                  equipmentPriority: 1,
                  castPriority: 1,
                  timePriority: 1,
                  complexity: 1
                },
                canEdit: true,
                lastModified: new Date().toISOString(),
                modifiedBy: 'AI'
              }]
            }
          }
        }
      }
      
      // 파싱된 결과에서 conteList 추출 (구조화된 접근)
      if (parsed) {
        console.log('파싱된 객체 키들:', Object.keys(parsed))
        
        // 다양한 키 이름으로 배열 찾기
        const possibleArrayKeys = ['conteList', 'scenes', 'cards', 'list', 'items']
        let foundArray = null
        let foundKey = null
        
        for (const key of possibleArrayKeys) {
          if (parsed[key] && Array.isArray(parsed[key])) {
            foundArray = parsed[key]
            foundKey = key
            break
          }
        }
        
        if (foundArray) {
          // 각 배열 요소가 올바른 캡션 카드 구조를 가지고 있는지 검증
          conteList = foundArray.map((item, index) => {
            console.log(`🔍 배열 요소 ${index} 분석:`, {
              itemType: typeof item,
              itemKeys: typeof item === 'object' ? Object.keys(item) : 'N/A',
              hasId: item.id ? 'yes' : 'no',
              hasScene: item.scene ? 'yes' : 'no',
              hasTitle: item.title ? 'yes' : 'no'
            })
            
            // 캡션 카드의 필수 키들 확인
            const requiredKeys = ['id', 'scene', 'title', 'description']
            const hasRequiredKeys = requiredKeys.every(key => item[key] !== undefined)
            
            if (hasRequiredKeys) {
              console.log(`✅ 요소 ${index}: 올바른 캡션 카드 구조`)
              return item
            } else {
              console.log(`⚠️ 요소 ${index}: 구조가 불완전함, 기본값으로 보완`)
                          // 구조가 불완전한 경우 기본값으로 보완
            return {
              id: item.id || `scene_${index + 1}`,
              scene: item.scene || index + 1,
              title: item.title || `씬 ${index + 1}`,
              description: item.description || item.content || item.text || '설명 없음',
              dialogue: item.dialogue || item.dialog || '',
              cameraAngle: item.cameraAngle || item.camera || '',
              cameraWork: item.cameraWork || item.cameraMovement || '',
              characterLayout: item.characterLayout || item.layout || '',
              props: item.props || item.prop || '',
              weather: item.weather || '',
              lighting: item.lighting || item.light || '',
              visualDescription: item.visualDescription || item.visual || '',
              transition: item.transition || '',
              lensSpecs: item.lensSpecs || item.lens || '',
              visualEffects: item.visualEffects || item.effects || '',
              type: item.type || 'live_action',
              estimatedDuration: item.estimatedDuration || item.duration || '5분',
              requiredPersonnel: item.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
              requiredEquipment: item.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
              camera: item.camera || 'C1',
              keywords: item.keywords || {
                userInfo: item.userInfo || '기본 사용자',
                location: item.location || '기본 장소',
                date: item.date || '2024-01-01',
                equipment: item.equipment || '기본 장비',
                cast: Array.isArray(item.cast) ? item.cast : ['기본 배우'],
                props: Array.isArray(item.props) ? item.props : ['기본 소품'],
                lighting: item.lighting || '기본 조명',
                weather: item.weather || '맑음',
                timeOfDay: item.timeOfDay || '낮',
                specialRequirements: Array.isArray(item.specialRequirements) ? item.specialRequirements : []
              },
              weights: item.weights || {
                locationPriority: item.locationPriority || 1,
                equipmentPriority: item.equipmentPriority || 1,
                castPriority: item.castPriority || 1,
                timePriority: item.timePriority || 1,
                complexity: item.complexity || 1
              },
              canEdit: item.canEdit !== undefined ? item.canEdit : true,
              lastModified: item.lastModified || new Date().toISOString(),
              modifiedBy: item.modifiedBy || 'AI'
            }
            }
          })
          console.log(`✅ ${foundKey} 배열 사용:`, conteList.length)
        } else if (Array.isArray(parsed)) {
          // parsed 자체가 배열인 경우
          conteList = parsed.map((item, index) => {
            console.log(`🔍 배열 요소 ${index} 분석:`, {
              itemType: typeof item,
              itemKeys: typeof item === 'object' ? Object.keys(item) : 'N/A'
            })
            
            // 위와 동일한 검증 및 보완 로직 적용
            const requiredKeys = ['id', 'scene', 'title', 'description']
            const hasRequiredKeys = requiredKeys.every(key => item[key] !== undefined)
            
            if (hasRequiredKeys) {
              return item
            } else {
              return {
                id: item.id || `scene_${index + 1}`,
                scene: item.scene || index + 1,
                title: item.title || `씬 ${index + 1}`,
                description: item.description || item.content || item.text || '설명 없음',
                dialogue: item.dialogue || item.dialog || '',
                cameraAngle: item.cameraAngle || item.camera || '',
                cameraWork: item.cameraWork || item.cameraMovement || '',
                characterLayout: item.characterLayout || item.layout || '',
                props: item.props || item.prop || '',
                weather: item.weather || '',
                lighting: item.lighting || item.light || '',
                visualDescription: item.visualDescription || item.visual || '',
                transition: item.transition || '',
                lensSpecs: item.lensSpecs || item.lens || '',
                visualEffects: item.visualEffects || item.effects || '',
                type: item.type || 'live_action',
                estimatedDuration: item.estimatedDuration || item.duration || '5분',
                requiredPersonnel: item.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
                requiredEquipment: item.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
                camera: item.camera || 'C1',
                keywords: item.keywords || {
                  userInfo: item.userInfo || '기본 사용자',
                  location: item.location || '기본 장소',
                  date: item.date || '2024-01-01',
                  equipment: item.equipment || '기본 장비',
                  cast: Array.isArray(item.cast) ? item.cast : ['기본 배우'],
                  props: Array.isArray(item.props) ? item.props : ['기본 소품'],
                  lighting: item.lighting || '기본 조명',
                  weather: item.weather || '맑음',
                  timeOfDay: item.timeOfDay || '낮',
                  specialRequirements: Array.isArray(item.specialRequirements) ? item.specialRequirements : []
                },
                weights: item.weights || {
                  locationPriority: item.locationPriority || 1,
                  equipmentPriority: item.equipmentPriority || 1,
                  castPriority: item.castPriority || 1,
                  timePriority: item.timePriority || 1,
                  complexity: item.complexity || 1
                },
                canEdit: item.canEdit !== undefined ? item.canEdit : true,
                lastModified: item.lastModified || new Date().toISOString(),
                modifiedBy: item.modifiedBy || 'AI'
              }
            }
          })
          console.log('✅ 배열 형태 사용:', conteList.length)
        } else {
          // 단일 객체인 경우 배열로 변환
          const item = parsed
          console.log('🔍 단일 객체 분석:', {
            itemType: typeof item,
            itemKeys: typeof item === 'object' ? Object.keys(item) : 'N/A'
          })
          
          conteList = [{
            id: item.id || 'scene_1',
            scene: item.scene || 1,
            title: item.title || '기본 씬',
            description: item.description || item.content || item.text || '설명 없음',
            dialogue: item.dialogue || item.dialog || '',
            cameraAngle: item.cameraAngle || item.camera || '',
            cameraWork: item.cameraWork || item.cameraMovement || '',
            characterLayout: item.characterLayout || item.layout || '',
            props: item.props || item.prop || '',
            weather: item.weather || '',
            lighting: item.lighting || item.light || '',
            visualDescription: item.visualDescription || item.visual || '',
            transition: item.transition || '',
            lensSpecs: item.lensSpecs || item.lens || '',
            visualEffects: item.visualEffects || item.effects || '',
            type: item.type || 'live_action',
            estimatedDuration: item.estimatedDuration || item.duration || '5분',
            requiredPersonnel: item.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
            requiredEquipment: item.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
            camera: item.camera || 'C1',
            keywords: item.keywords || {
              userInfo: item.userInfo || '기본 사용자',
              location: item.location || '기본 장소',
              date: item.date || '2024-01-01',
              equipment: item.equipment || '기본 장비',
              cast: Array.isArray(item.cast) ? item.cast : ['기본 배우'],
              props: Array.isArray(item.props) ? item.props : ['기본 소품'],
              lighting: item.lighting || '기본 조명',
              weather: item.weather || '맑음',
              timeOfDay: item.timeOfDay || '낮',
              specialRequirements: Array.isArray(item.specialRequirements) ? item.specialRequirements : []
            },
            weights: item.weights || {
              locationPriority: item.locationPriority || 1,
              equipmentPriority: item.equipmentPriority || 1,
              castPriority: item.castPriority || 1,
              timePriority: item.timePriority || 1,
              complexity: item.complexity || 1
            },
            canEdit: item.canEdit !== undefined ? item.canEdit : true,
            lastModified: item.lastModified || new Date().toISOString(),
            modifiedBy: item.modifiedBy || 'AI'
          }]
          console.log('✅ 단일 객체를 배열로 변환:', conteList.length)
        }
      } else {
        console.log('❌ 파싱 실패, 에러 반환')
        console.log('원본 content:', content)
        
        // 파싱 실패 시 에러 반환 (더미데이터 생성하지 않음)
        return res.status(500).json({
          success: false,
          message: 'AI 콘티 생성에 실패했습니다. 다시 시도해주세요.',
          error: {
            code: 'PARSE_ERROR',
            details: 'AI 응답을 파싱할 수 없습니다.'
          }
        })
      }
      
      console.log('✅ JSON 파싱 완료:', { 
        parsedType: typeof parsed, 
        conteListLength: conteList.length,
        firstItem: conteList[0] 
      })
      
      // 생성된 콘티 개수 제한 (요청된 개수만큼만)
      if (conteList.length > validatedMaxScenes) {
        console.log(`⚠️ 생성된 콘티가 요청된 개수보다 많음: ${conteList.length} > ${validatedMaxScenes}`)
        conteList = conteList.slice(0, validatedMaxScenes)
        console.log(`✅ 콘티 개수 제한 완료: ${conteList.length}개`)
      }

      // 각 캡션 카드에 고유 ID와 타임스탬프 추가
      conteList = conteList.map((card, index) => {
        // 키워드 노드 개별 파싱 함수
        const parseKeywords = (cardKeywords) => {
          const defaultKeywords = {
            userInfo: '기본 사용자',
            location: '기본 장소',
            date: '2024-01-01',
            equipment: '기본 장비',
            cast: ['기본 배우'],
            props: ['기본 소품'],
            lighting: '기본 조명',
            weather: '맑음',
            timeOfDay: '주간',
            specialRequirements: []
          }

          // cardKeywords가 없거나 객체가 아닌 경우 기본값 반환
          if (!cardKeywords || typeof cardKeywords !== 'object') {
            return defaultKeywords
          }

          // 각 키워드 개별적으로 파싱
          return {
            userInfo: cardKeywords.userInfo || defaultKeywords.userInfo,
            location: cardKeywords.location || defaultKeywords.location,
            date: cardKeywords.date || defaultKeywords.date,
            equipment: cardKeywords.equipment || defaultKeywords.equipment,
            cast: Array.isArray(cardKeywords.cast) ? cardKeywords.cast : 
                  (typeof cardKeywords.cast === 'string' ? [cardKeywords.cast] : defaultKeywords.cast),
            props: Array.isArray(cardKeywords.props) ? cardKeywords.props : 
                   (typeof cardKeywords.props === 'string' ? [cardKeywords.props] : defaultKeywords.props),
            lighting: cardKeywords.lighting || defaultKeywords.lighting,
            weather: cardKeywords.weather || defaultKeywords.weather,
            timeOfDay: cardKeywords.timeOfDay || defaultKeywords.timeOfDay,
            specialRequirements: Array.isArray(cardKeywords.specialRequirements) ? cardKeywords.specialRequirements : 
                               (typeof cardKeywords.specialRequirements === 'string' ? [cardKeywords.specialRequirements] : defaultKeywords.specialRequirements)
          }
        }

        // 가중치 개별 파싱 함수
        const parseWeights = (cardWeights) => {
          const defaultWeights = {
            locationPriority: 1,
            equipmentPriority: 1,
            castPriority: 1,
            timePriority: 1,
            complexity: 1
          }

          // cardWeights가 없거나 객체가 아닌 경우 기본값 반환
          if (!cardWeights || typeof cardWeights !== 'object') {
            return defaultWeights
          }

          // 각 가중치 개별적으로 파싱
          return {
            locationPriority: typeof cardWeights.locationPriority === 'number' ? cardWeights.locationPriority : defaultWeights.locationPriority,
            equipmentPriority: typeof cardWeights.equipmentPriority === 'number' ? cardWeights.equipmentPriority : defaultWeights.equipmentPriority,
            castPriority: typeof cardWeights.castPriority === 'number' ? cardWeights.castPriority : defaultWeights.castPriority,
            timePriority: typeof cardWeights.timePriority === 'number' ? cardWeights.timePriority : defaultWeights.timePriority,
            complexity: typeof cardWeights.complexity === 'number' ? cardWeights.complexity : defaultWeights.complexity
          }
        }

        // 기본 필드 검증 및 기본값 설정
        const processedCard = {
          id: card.id || `scene_${index + 1}`,
          scene: card.scene || index + 1,
          title: removeMarkdown(card.title || `씬 ${card.scene || index + 1}`),
          description: removeMarkdown(card.description || '설명 없음'),
          dialogue: removeMarkdown(card.dialogue || '대사 없음'),
          cameraAngle: removeMarkdown(card.cameraAngle || '설정 없음'),
          cameraWork: removeMarkdown(card.cameraWork || '설정 없음'),
          characterLayout: removeMarkdown(card.characterLayout || '설정 없음'),
          props: removeMarkdown(card.props || '설정 없음'),
          weather: removeMarkdown(card.weather || '설정 없음'),
          lighting: removeMarkdown(card.lighting || '설정 없음'),
          visualDescription: removeMarkdown(card.visualDescription || '설명 없음'),
          transition: removeMarkdown(card.transition || '설정 없음'),
          lensSpecs: removeMarkdown(card.lensSpecs || '설정 없음'),
          visualEffects: removeMarkdown(card.visualEffects || '설정 없음'),
          type: card.type || 'generated_video', // 기본값: AI 생성 비디오
          estimatedDuration: card.estimatedDuration || '5분',
          // 스케줄링 정보 - 필요인력, 필요장비, 카메라 정보 추가
          requiredPersonnel: card.requiredPersonnel || '감독 1명, 촬영감독 1명, 카메라맨 2명, 조명감독 1명, 음향감독 1명, 배우 3명, 스태프 5명',
          requiredEquipment: card.requiredEquipment || '카메라 C1, 조명장비 3세트, 마이크 2개, 리플렉터 1개, 삼각대 2개',
          camera: card.camera || 'C1',
          // 키워드 노드 정보 - timeOfDay가 반드시 포함되도록 파싱
          keywords: parseKeywords(card.keywords),
          // 그래프 가중치 - 개별 파싱
          weights: parseWeights(card.weights),
          // 편집 권한
          canEdit: card.canEdit !== false,
          lastModified: card.lastModified || new Date().toISOString(),
          modifiedBy: card.modifiedBy || 'AI'
        }
        
        console.log(`✅ 캡션 카드 ${index + 1} 파싱 완료:`, {
          id: processedCard.id,
          title: processedCard.title,
          keywordsCount: Object.keys(processedCard.keywords).length,
          weightsCount: Object.keys(processedCard.weights).length
        })
        
        return processedCard
      })
      
    } catch (parseError) {
      console.error('❌ 콘티 JSON 파싱 실패:', parseError)
      console.log('원본 응답:', content)
      
      // 파싱 실패 시 에러 반환 (더미데이터 생성하지 않음)
      return res.status(500).json({
        success: false,
        message: 'AI 콘티 생성에 실패했습니다. 다시 시도해주세요.',
        error: {
          code: 'PARSE_ERROR',
          details: 'AI 응답을 파싱할 수 없습니다.'
        }
      })
    }

    console.log('✅ AI 콘티 생성 완료:', { tokenCount, sceneCount: conteList.length })

    res.json({
      success: true,
      conteList: conteList,
      generatedAt: new Date().toISOString(),
      tokenCount: tokenCount,
      model: 'gpt-4o',
      isFreeTier: false
    })

  } catch (error) {
    console.error('❌ AI 콘티 생성 오류:', error.message)
    
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.error?.message || 'OpenAI API 오류'
      
      switch (status) {
        case 400:
          return res.status(400).json({
            success: false,
            message: '잘못된 요청입니다. 스토리를 다시 확인해주세요.'
          })
        case 401:
          return res.status(401).json({
            success: false,
            message: 'OpenAI API 키가 유효하지 않습니다.'
          })
        case 429:
          return res.status(429).json({
            success: false,
            message: 'OpenAI API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.'
          })
        default:
          return res.status(500).json({
            success: false,
            message: 'AI 콘티 생성 중 오류가 발생했습니다.'
          })
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      })
    } else {
      return res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      })
    }
  }
})

/**
 * 마크다운 문법을 제거하고 깔끔한 텍스트로 변환하는 유틸리티 함수
 * @param {string} text - 원본 텍스트
 * @returns {string} 마크다운이 제거된 텍스트
 */
const removeMarkdown = (text) => {
  if (!text || typeof text !== 'string') {
    return text
  }

  return text
    // 헤딩 제거 (###, ##, #)
    .replace(/^#{1,6}\s+/gm, '')
    // 볼드 제거 (**text** 또는 __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // 이탤릭 제거 (*text* 또는 _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // 코드 블록 제거 (```code```)
    .replace(/```[\s\S]*?```/g, '')
    // 인라인 코드 제거 (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // 링크 제거 ([text](url))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 이미지 제거 (![alt](url))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 리스트 마커 제거 (-, *, +)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    // // 번호 리스트 제거 (1., 2., etc.)
    // .replace(/^[\s]*\d+\.\s+/gm, '')
    // 인용 제거 (> text)
    .replace(/^>\s+/gm, '')
    // 수평선 제거 (---, ***, ___)
    .replace(/^[-*_]{3,}$/gm, '')
    // // 줄바꿈 정리 (연속된 줄바꿈을 2개로 제한)
    // .replace(/\n{3,}/g, '\n\n')
    // // 앞뒤 공백 제거
    // .trim()
}

/**
 * 스토리 텍스트를 정리하는 함수
 * @param {string} story - 원본 스토리 텍스트
 * @returns {string} 정리된 스토리 텍스트
 */
const cleanStoryText = (story) => {
  if (!story || typeof story !== 'string') {
    return story
  }

  return removeMarkdown(story)
    // // 문단 구분을 위한 줄바꿈 정리 (빈 줄을 2개로 통일)
    // .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // // 앞뒤 공백 제거
    // .trim()
}

/**
 * 서버 상태 확인 API
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SceneForge 백엔드 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!OPENAI_API_KEY
  })
})

// API 성능 모니터링 미들웨어
app.use((req, res, next) => {
  const startTime = Date.now()
  
  // 응답 완료 후 성능 메트릭 기록
  res.on('finish', () => {
    const responseTime = Date.now() - startTime
    monitoringService.recordAPIMetric(req.path, responseTime, res.statusCode)
  })
  
  next()
})

// 에러 핸들링 미들웨어 (마지막에 추가)
app.use(errorHandler)

// 실시간 협업 서비스 초기화
const realtimeService = new RealtimeService(server)

// WebSocket 서비스 초기화
timelineRoutes.initializeWebSocket(server)

// 데이터 분석 서비스 초기화
const analyticsService = new AnalyticsService()

// 모니터링 서비스 초기화
const monitoringService = new MonitoringService()

// 실시간 서비스 상태 확인 API
app.get('/api/realtime/stats', (req, res) => {
  res.json({
    success: true,
    stats: realtimeService.getStats(),
    timestamp: new Date().toISOString()
  })
})

// 데이터 분석 API
app.get('/api/analytics/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const analytics = await analyticsService.getUserAnalytics(userId)
    res.json({
      success: true,
      analytics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

app.get('/api/analytics/system', async (req, res) => {
  try {
    const analytics = await analyticsService.getSystemAnalytics()
    res.json({
      success: true,
      analytics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

app.get('/api/analytics/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const analytics = await analyticsService.getProjectAnalytics(projectId)
    res.json({
      success: true,
      analytics
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 활동 로그 기록 API
app.post('/api/analytics/log', (req, res) => {
  try {
    const logData = req.body
    analyticsService.logActivity(logData)
    res.json({
      success: true,
      message: '활동 로그가 기록되었습니다.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 모니터링 API
app.get('/api/monitoring/status', (req, res) => {
  try {
    const status = monitoringService.getSystemStatus()
    res.json({
      success: true,
      status
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

app.get('/api/monitoring/report', (req, res) => {
  try {
    const report = monitoringService.generatePerformanceReport()
    res.json({
      success: true,
      report
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

app.get('/api/monitoring/alerts', (req, res) => {
  try {
    const alerts = monitoringService.alerts
    res.json({
      success: true,
      alerts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

app.post('/api/monitoring/alerts/:alertId/acknowledge', (req, res) => {
  try {
    const { alertId } = req.params
    monitoringService.acknowledgeAlert(alertId)
    res.json({
      success: true,
      message: '알림이 확인되었습니다.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 SceneForge 백엔드 서버가 포트 ${PORT}에서 실행 중입니다.`)
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api`)
  console.log(`🔑 OpenAI API 키: ${OPENAI_API_KEY ? '✅ 설정됨' : '❌ 설정되지 않음'}`)
  console.log(`🔒 보안 미들웨어: ✅ 활성화됨`)
  console.log(`🔗 실시간 협업: ✅ Socket.io 활성화됨`)
  console.log(`📊 데이터 분석: ✅ Analytics 서비스 활성화됨`)
  console.log(`📈 시스템 모니터링: ✅ Monitoring 서비스 활성화됨`)
})

module.exports = app 