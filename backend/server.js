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

/**
 * LLM을 사용하여 씬 정보를 기반으로 컷들을 생성하는 함수
 * @param {Object} sceneData - 씬 데이터
 * @returns {Array} 생성된 컷 배열
 */
const generateCutsFromScene = async (sceneData) => {
  try {
    const cuts = []
    const sceneDuration = calculateSceneDuration(sceneData)
    const totalSeconds = Math.floor(sceneDuration * 60) // 분을 초로 변환
    
    // 데모 시연을 위한 컷 수 조정 (한 씬당 3-5개 컷)
    // 기존 코드: const baseCutDuration = 10
    // 기존 코드: const numCuts = Math.ceil(totalSeconds / baseCutDuration)
    
    // 새로운 로직: 씬 지속시간에 따라 3-5개 컷 생성
    let numCuts = 3 // 기본 3개 컷
    if (sceneDuration >= 3) numCuts = 4 // 3분 이상이면 4개 컷
    if (sceneDuration >= 5) numCuts = 5 // 5분 이상이면 5개 컷
    
    const baseCutDuration = Math.floor(totalSeconds / numCuts) // 컷당 평균 지속시간
    
    // 씬에서 파싱 가능한 정보들
    const sceneInfo = {
      title: sceneData.title || '',
      description: sceneData.description || '',
      keywords: sceneData.keywords || [],
      weights: sceneData.weights || [],
      timeOfDay: sceneData.keywords?.find(k => k.includes('timeOfDay'))?.split(':')[1]?.trim() || '낮',
      location: sceneData.keywords?.find(k => k.includes('location'))?.split(':')[1]?.trim() || '',
      characters: sceneData.keywords?.find(k => k.includes('characters'))?.split(':')[1]?.trim() || '',
      mood: sceneData.keywords?.find(k => k.includes('mood'))?.split(':')[1]?.trim() || '',
      lighting: sceneData.keywords?.find(k => k.includes('lighting'))?.split(':')[1]?.trim() || '자연광',
      weather: sceneData.keywords?.find(k => k.includes('weather'))?.split(':')[1]?.trim() || '맑음',
      equipment: sceneData.keywords?.find(k => k.includes('equipment'))?.split(':')[1]?.trim() || '',
      dialogue: sceneData.description || '',
      narration: sceneData.description || ''
    }
    
    // LLM을 사용하여 컷 생성 프롬프트 작성
    const prompt = `
다음 씬 정보를 바탕으로 ${numCuts}개의 컷을 생성해주세요.

**씬 정보:**
- 제목: ${sceneInfo.title}
- 설명: ${sceneInfo.description}
- 시간대: ${sceneInfo.timeOfDay}
- 장소: ${sceneInfo.location}
- 등장인물: ${sceneInfo.characters}
- 분위기: ${sceneInfo.mood}
- 조명: ${sceneInfo.lighting}
- 날씨: ${sceneInfo.weather}
- 장비: ${sceneInfo.equipment}
- 대사: ${sceneInfo.dialogue}
- 총 지속시간: ${sceneDuration}분 (${totalSeconds}초)
- 컷 개수: ${numCuts}개 (각 컷 평균 ${baseCutDuration}초)

**중요한 제약사항:**
1. 모든 컷은 반드시 같은 시간대(${sceneInfo.timeOfDay})를 유지해야 합니다.
2. 모든 컷은 반드시 같은 장소(${sceneInfo.location})를 유지해야 합니다.
3. 모든 컷은 반드시 같은 등장인물(${sceneInfo.characters})을 유지해야 합니다.
4. 모든 컷은 씬 전체의 분위기(${sceneInfo.mood})를 해치지 않아야 하며, 감정의 흐름에 따라 컷마다 다르게 표현될 수 있습니다.
   예: 긴장된 씬이라면 컷마다 다르게 표현되더라도 전체적으로 긴장감을 유지해야 합니다.
5. 모든 컷의 조명(${sceneInfo.lighting})은 씬의 기본 조명 스타일을 기반으로 하지만, 샷 구도나 감정 강조에 따라 세부 조명이 컷마다 조절될 수 있습니다.
   예: 형광등 조명 기반이라면 일부 컷에 역광, 실루엣 등 연출적 조명도 허용됩니다.
6. 모든 컷은 반드시 같은 날씨(${sceneInfo.weather})를 유지해야 합니다.
7. 모든 컷은 씬에서 정의된 주요 장비(${sceneInfo.equipment})를 중심으로 구성하되, 필요한 경우 보조적인 카메라 장비(예: 드론, 짐벌 등)를 일부 컷에 한해 추가로 사용할 수 있습니다.
   단, 장비의 변화는 촬영 스타일의 일관성을 해치지 않아야 합니다.
8. 각 컷의 샷 사이즈, 앵글 방향, 카메라 움직임은 씬의 분위기와 컷의 순서에 따라 다양하게 생성해야 합니다.
9. 조명 세팅은 씬의 기본 조명을 기반으로 하되, 각 컷의 분위기와 샷 구도에 맞게 세부 조정해야 합니다.
   예: 자연광 기반 씬이라면 메인 라이트는 창문, 필 라이트는 반사판, 백 라이트는 역광으로 설정

**영화 제작 표준 컷 생성 규칙:**

**샷 사이즈 (Shot Size):**
- EWS (Extreme Wide Shot): 전체 환경을 보여주는 극도로 넓은 샷
- WS (Wide Shot): 전체 장면과 배경을 보여주는 넓은 샷
- MS (Medium Shot): 인물의 상반신을 보여주는 중간 샷
- CU (Close Up): 인물의 얼굴이나 특정 부분을 보여주는 클로즈업
- ECU (Extreme Close Up): 매우 가까운 거리에서 특정 부분을 보여주는 극도 클로즈업

**앵글 방향 (Angle Direction):**
- Eye-level: 일반적인 시선 높이에서 촬영
- High: 높은 위치에서 아래를 향해 촬영
- Low: 낮은 위치에서 위를 향해 촬영
- Dutch: 기울어진 앵글로 불안감이나 긴장감 표현
- Bird_eye: 매우 높은 위치에서 수직으로 아래를 향해 촬영

**카메라 움직임 (Camera Movement):**
- Static: 고정된 카메라
- Pan: 좌우로 회전하는 카메라
- Tilt: 상하로 회전하는 카메라
- Dolly: 카메라가 전후좌우로 이동
- Zoom: 렌즈를 통해 확대/축소
- Handheld: 손으로 들고 촬영하는 흔들리는 효과

**컷 생성 패턴:**
1. 각 컷은 평균 ${baseCutDuration}초 지속시간을 가져야 합니다 (전체 ${totalSeconds}초를 ${numCuts}개 컷으로 분할).
2. 샷 사이즈는 WS → MS → CU → ECU → WS 순서로 변화하거나, 분위기에 맞게 선택해야 합니다.
3. 앵글 방향은 씬의 분위기에 맞게 선택해야 합니다 (감정적 장면은 Dutch, 액션 장면은 Low 등).
4. 카메라 움직임은 씬의 동적인 정도에 맞게 선택해야 합니다.
5. 대사는 씬의 전체 대사를 컷 수로 나누어 분배해야 합니다.
6. 인물 동선은 컷별로 자연스럽게 변화해야 합니다.
7. 조명 세팅은 씬의 기본 조명을 기반으로 하되, 각 컷의 분위기에 맞게 조정해야 합니다.
   예: 감정적 장면은 부드러운 조명, 긴장감 있는 장면은 대비가 강한 조명

**응답 형식:**
반드시 다음 JSON 형식으로만 응답해주세요:

{
  "cuts": [
    {
      "cutId": "CUT_001_01",
      "cutNumber": 1,
      "duration": "${baseCutDuration}초",
      "description": "씬 제목 - 1번째 컷",
      "shotSize": "WS",
      "angleDirection": "Eye-level",
      "cameraMovement": "Static",
      "lensSpecs": "24mm",
      "cutType": "WS",
      "lighting": "자연광",
      "lightingSetup": {
        "mainLight": "창문",
        "fillLight": "반사판", 
        "backLight": "역광",
        "specialEffects": "",
        "intensity": "보통",
        "color": "백색광"
      },
      "weather": "맑음",
      "visualEffects": "",
      "characters": [
        {
          "name": "주인공",
          "actor": "배우",
          "action": "연기",
          "dialogue": "대사 내용",
          "position": "중앙 정면"
        }
      ],
      "dialogue": "대사 내용",
      "narration": "내레이션",
      "characterMovement": "중앙 정면",
      "equipment": {
        "camera": "C1",
        "lens": "24mm",
        "lighting": ["자연광"],
        "props": []
      },
      "aiGenerated": false,
      "aiVideoUrl": "",
      "aiObjects": [],
      "premiereMetadata": {
        "clipName": "Scene_1_Cut_1",
        "binPath": "Scenes/Scene_1",
        "colorLabel": "blue",
        "markers": []
      },
      "startTime": 0,
      "endTime": ${baseCutDuration},
      "totalDuration": ${baseCutDuration}
    }
  ]
}

JSON 이외의 텍스트는 포함하지 마세요.
한국어로 자연스럽게 작성해주세요.
`

    // OpenAI API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 영화 촬영 전문가입니다. 씬 정보를 바탕으로 일관성 있는 컷들을 생성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60초 타임아웃
      }
    )

    const content = response.data.choices[0].message.content.trim()
    const tokenCount = response.data.usage.total_tokens

    // JSON 파싱
    let parsedCuts = []
    try {
      const parsed = JSON.parse(content)
      if (parsed.cuts && Array.isArray(parsed.cuts)) {
        parsedCuts = parsed.cuts
      } else {
        throw new Error('Invalid cuts array')
      }
    } catch (parseError) {
      console.error('❌ LLM 응답 파싱 실패:', parseError.message)
      console.log('원본 응답:', content)
      
      // 파싱 실패 시 기본 컷 생성
      console.log('⚠️ 파싱 실패로 기본 컷 생성')
      for (let i = 0; i < numCuts; i++) {
        const cutNumber = i + 1
        const startTime = i * baseCutDuration
        const endTime = Math.min((i + 1) * baseCutDuration, totalSeconds)
        const duration = endTime - startTime
        
        // 기본 컷 정보 (영화 제작 표준)
        let cutType = 'MS'
        let shotSize = 'MS'
        let angleDirection = 'Eye-level'
        let cameraMovement = 'Static'
        let lensSpecs = '50mm'
        
        // 씬 분위기에 따른 앵글과 움직임 선택
        const getAngleAndMovement = (mood, cutNumber) => {
          // 감정적 장면
          if (mood.includes('감정') || mood.includes('슬픔') || mood.includes('기쁨') || mood.includes('사랑')) {
            return { angle: 'Eye-level', movement: 'Static' }
          }
          // 긴장감 있는 장면
          if (mood.includes('긴장') || mood.includes('두려움') || mood.includes('불안')) {
            return { angle: 'Dutch', movement: 'Handheld' }
          }
          // 액션 장면
          if (mood.includes('액션') || mood.includes('싸움') || mood.includes('추격')) {
            return { angle: 'Low', movement: 'Dolly' }
          }
          // 웅장한 장면
          if (mood.includes('웅장') || mood.includes('대규모') || mood.includes('전체')) {
            return { angle: 'High', movement: 'Pan' }
          }
          // 일상적인 장면
          return { angle: 'Eye-level', movement: 'Static' }
        }
        
        const { angle, movement } = getAngleAndMovement(sceneInfo.mood, cutNumber)
        angleDirection = angle
        cameraMovement = movement
        
        // 데모 시연을 위한 3-5개 컷 패턴
        if (cutNumber === 1) {
          cutType = 'WS'
          shotSize = 'WS'
          lensSpecs = '24mm'
        } else if (cutNumber === 2) {
          cutType = 'MS'
          shotSize = 'MS'
          lensSpecs = '50mm'
        } else if (cutNumber === 3) {
          cutType = 'CU'
          shotSize = 'CU'
          lensSpecs = '85mm'
        } else if (cutNumber === 4) {
          cutType = 'ECU'
          shotSize = 'ECU'
          lensSpecs = '100mm'
        } else if (cutNumber === 5) {
          // 5번째 컷은 다시 WS로 돌아가서 전체를 보여줌
          cutType = 'WS'
          shotSize = 'WS'
          lensSpecs = '24mm'
        }
        
        const dialogueParts = sceneInfo.dialogue.split('.').filter(part => part.trim())
        const dialogueIndex = i % dialogueParts.length
        const cutDialogue = dialogueParts[dialogueIndex] || sceneInfo.dialogue
        
        const characterPositions = [
          '중앙 정면',
          '좌측 45도',
          '우측 45도',
          '후면',
          '좌측 측면',
          '우측 측면'
        ]
        const positionIndex = i % characterPositions.length
        
        // 컷 이미지 생성
        let cutImageUrl = null
        try {
          const cutImagePrompt = `${sceneInfo.title} - ${cutNumber}번째 컷: ${cutDialogue}. ${shotSize} 샷, ${angleDirection} 앵글, ${sceneInfo.lighting} 조명, 시네마틱한 구도`
          
          const imageResponse = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
              model: 'dall-e-3',
              prompt: cutImagePrompt,
              n: 1,
              size: '1024x1024',
              quality: 'standard',
              style: 'natural'
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 60000
            }
          )
          
          cutImageUrl = imageResponse.data.data[0].url
          console.log(`✅ 컷 ${cutNumber} 이미지 생성 완료:`, cutImageUrl.substring(0, 50) + '...')
        } catch (imageError) {
          console.error(`❌ 컷 ${cutNumber} 이미지 생성 실패:`, imageError.message)
          // 이미지 생성 실패는 치명적이지 않으므로 계속 진행
        }

        parsedCuts.push({
          cutId: `CUT_${sceneData.scene.toString().padStart(3, '0')}_${cutNumber.toString().padStart(2, '0')}`,
          cutNumber: cutNumber,
          duration: `${duration}초`,
          description: `${sceneInfo.title} - ${cutNumber}번째 컷`,
          shotSize: shotSize,
          angleDirection: angleDirection,
          cameraMovement: cameraMovement,
          lensSpecs: lensSpecs,
          cutType: cutType,
          lighting: sceneInfo.lighting,
          lightingSetup: {
            mainLight: sceneInfo.lighting === '자연광' ? '창문' : '메인 라이트',
            fillLight: sceneInfo.lighting === '자연광' ? '반사판' : '필 라이트',
            backLight: sceneInfo.lighting === '자연광' ? '역광' : '백 라이트',
            specialEffects: '',
            intensity: '보통',
            color: '백색광'
          },
          weather: sceneInfo.weather,
          visualEffects: '',
          characters: [{
            name: sceneInfo.characters || '주인공',
            actor: '배우',
            action: '연기',
            dialogue: cutDialogue,
            position: characterPositions[positionIndex]
          }],
          dialogue: cutDialogue,
          narration: sceneInfo.narration,
          characterMovement: characterPositions[positionIndex],
          equipment: {
            camera: sceneInfo.equipment || 'C1',
            lens: lensSpecs,
            lighting: [sceneInfo.lighting],
            props: []
          },
          aiGenerated: false,
          aiVideoUrl: '',
          aiObjects: [],
          imageUrl: cutImageUrl, // 컷 이미지 URL 추가
          premiereMetadata: {
            clipName: `Scene_${sceneData.scene}_Cut_${cutNumber}`,
            binPath: `Scenes/Scene_${sceneData.scene}`,
            colorLabel: 'blue',
            markers: []
          },
          startTime: startTime,
          endTime: endTime,
          totalDuration: duration
        })
      }
    }
    
    console.log(`✅ 씬 ${sceneData.scene}에서 ${parsedCuts.length}개의 컷 생성 완료 (LLM 사용)`)
    return parsedCuts
    
  } catch (error) {
    console.error('❌ 컷 생성 오류:', error.message)
    return []
  }
}

/**
 * 씬 데이터에서 컷 정보를 파싱하는 함수
 * @param {Object} sceneData - 씬 데이터
 * @returns {Object} 파싱된 컷 정보
 */
const parseSceneForCuts = (sceneData) => {
  const parsed = {
    title: sceneData.title || '',
    description: sceneData.description || '',
    keywords: sceneData.keywords || [],
    weights: sceneData.weights || [],
    timeOfDay: '낮',
    location: '',
    characters: '',
    mood: '',
    lighting: '자연광',
    weather: '맑음',
    equipment: 'C1',
    dialogue: '',
    narration: ''
  }
  
  // keywords에서 정보 파싱
  if (sceneData.keywords) {
    sceneData.keywords.forEach(keyword => {
      if (keyword.includes('timeOfDay:')) {
        parsed.timeOfDay = keyword.split(':')[1]?.trim() || '낮'
      } else if (keyword.includes('location:')) {
        parsed.location = keyword.split(':')[1]?.trim() || ''
      } else if (keyword.includes('characters:')) {
        parsed.characters = keyword.split(':')[1]?.trim() || ''
      } else if (keyword.includes('mood:')) {
        parsed.mood = keyword.split(':')[1]?.trim() || ''
      } else if (keyword.includes('lighting:')) {
        parsed.lighting = keyword.split(':')[1]?.trim() || '자연광'
      } else if (keyword.includes('weather:')) {
        parsed.weather = keyword.split(':')[1]?.trim() || '맑음'
      } else if (keyword.includes('equipment:')) {
        parsed.equipment = keyword.split(':')[1]?.trim() || 'C1'
      }
    })
  }
  
  // description에서 대사 및 내레이션 추출
  if (sceneData.description) {
    parsed.dialogue = sceneData.description
    parsed.narration = sceneData.description
  }
  
  return parsed
}

// 라우터 등록
const authRoutes = require('./routes/auth'); // 기존 인증 라우트
const userRoutes = require('./routes/users'); // 사용자 관리 라우트
const projectRoutes = require('./routes/projects'); // 프로젝트 관리 라우트
const conteRoutes = require('./routes/contes'); // 콘티 관리 라우트
const cutRoutes = require('./routes/cuts'); // 컷 관리 라우트
const timelineRoutes = require('./routes/timeline'); // 타임라인 WebSocket 라우트

app.use('/api/auth', authRoutes); // /api/auth/* 경로를 auth 라우터로 연결
app.use('/api/users', userRoutes); // /api/users/* 경로를 user 라우터로 연결
app.use('/api/projects', projectRoutes); // /api/projects/* 경로를 project 라우터로 연결
app.use('/api/projects', conteRoutes); // /api/projects/*/contes/* 경로를 conte 라우터로 연결
app.use('/api/projects', cutRoutes); // /api/projects/*/contes/*/cuts/* 경로를 cut 라우터로 연결
app.use('/api/timeline', timelineRoutes.router); // /api/timeline/* 경로를 timeline 라우터로 연결

/**
 * 씬에서 컷 생성 API
 * POST /api/cuts/generate
 */
app.post('/api/cuts/generate', async (req, res) => {
  try {
    const { sceneData } = req.body

    // 입력 검증
    if (!sceneData || !sceneData.scene) {
      return res.status(400).json({
        success: false,
        message: '씬 데이터가 필요합니다.'
      })
    }

    console.log('🎬 컷 생성 요청:', { scene: sceneData.scene, title: sceneData.title })

    // 씬 정보를 기반으로 컷들 생성 (LLM 사용)
    const cuts = await generateCutsFromScene(sceneData)

    if (cuts.length === 0) {
      return res.status(400).json({
        success: false,
        message: '컷 생성에 실패했습니다.'
      })
    }

    console.log('✅ 컷 생성 완료:', { scene: sceneData.scene, cutCount: cuts.length })

    res.json({
      success: true,
      cuts: cuts,
      sceneId: sceneData.scene,
      totalCuts: cuts.length,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ 컷 생성 오류:', error.message)
    res.status(500).json({
      success: false,
      message: '컷 생성 중 오류가 발생했습니다.',
      error: error.message
    })
  }
})

/**
 * 컷 이미지 생성 API
 * POST /api/cut-image/generate
 */
app.post('/api/cut-image/generate', async (req, res) => {
  try {
    const { cutDescription, shotSize, angleDirection, lightingSetup, style = 'cinematic', size = '1024x1024' } = req.body

    // 입력 검증
    if (!cutDescription || !cutDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: '컷 설명이 필요합니다.'
      })
    }

    console.log('🎬 컷 이미지 생성 요청:', { 
      cutDescription: cutDescription.substring(0, 100) + '...', 
      shotSize, 
      angleDirection,
      lightingSetup 
    })

    // 컷 이미지 생성 프롬프트 구성
    const imagePrompt = `${cutDescription}. ${shotSize} 샷, ${angleDirection} 앵글, ${lightingSetup?.mainLight || '조명'} 조명, ${style} 스타일, 시네마틱한 구도, 고품질 이미지`

    // OpenAI DALL-E 3 API 호출
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: imagePrompt,
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
        timeout: 60000 // 60초 타임아웃
      }
    )

    const imageUrl = response.data.data[0].url
    const tokenCount = response.data.usage?.total_tokens || 0

    console.log('✅ 컷 이미지 생성 완료:', { 
      imageUrl: imageUrl.substring(0, 50) + '...', 
      tokenCount 
    })

    res.json({
      success: true,
      imageUrl: imageUrl,
      prompt: imagePrompt,
      generatedAt: new Date().toISOString(),
      model: 'dall-e-3',
      isFreeTier: false
    })

  } catch (error) {
    console.error('❌ 컷 이미지 생성 오류:', error.message)
    
    if (error.response) {
      const status = error.response.status
      const message = error.response.data?.error?.message || 'OpenAI API 오류'
      
      switch (status) {
        case 400:
          res.status(400).json({
            success: false,
            message: '잘못된 요청입니다. 컷 설명을 다시 확인해주세요.'
          })
          break
        case 401:
          res.status(401).json({
            success: false,
            message: '인증이 필요합니다. 다시 로그인해주세요.'
          })
          break
        case 429:
          res.status(429).json({
            success: false,
            message: 'OpenAI API 사용 한도에 도달했습니다. 잠시 후 다시 시도해주세요.'
          })
          break
        case 500:
          res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          })
          break
        default:
          res.status(500).json({
            success: false,
            message: message
          })
      }
    } else {
      res.status(500).json({
        success: false,
        message: '컷 이미지 생성 중 오류가 발생했습니다.',
        error: error.message
      })
    }
  }
})

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