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

// MongoDB 모델 import
const User = require('./models/User')
const Project = require('./models/Project')
const Conte = require('./models/Conte')
const Cut = require('./models/Cut')
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
 * 씬의 dialogue를 2분 발화길이로 확장
 */
const expandDialogueTo2Minutes = async (originalDialogue, sceneData) => {
  try {
    if (!originalDialogue || originalDialogue.trim().length === 0) {
      return '이 장면에서 자연스러운 대화가 이어집니다.'
    }

    const prompt = `
다음 씬 정보를 바탕으로 2분 정도의 자연스러운 대화를 생성해주세요.

**씬 정보:**
- 제목: ${sceneData.title || ''}
- 설명: ${sceneData.description || ''}
- 장소: ${sceneData.keywords?.location || ''}
- 등장인물: ${sceneData.keywords?.cast?.join(', ') || ''}
- 분위기: ${sceneData.keywords?.mood || ''}
- 시간대: ${sceneData.keywords?.timeOfDay || ''}

**원본 대사:**
${originalDialogue}

**요구사항:**
1. 원본 대사의 맥락과 분위기를 유지하면서 자연스럽게 확장
2. 2분 정도의 발화길이 (약 120~160단어)
3. 등장인물들의 자연스러운 대화
4. 씬의 분위기와 일치하는 톤앤매너
5. 한국어로 자연스럽게 작성

**응답 형식:**
대사만 반환해주세요. 설명이나 추가 텍스트는 포함하지 마세요.
`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: '당신은 영화 대본 작가입니다. 자연스럽고 감정이 풍부한 대화를 작성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.8
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const expandedDialogue = response.data.choices[0].message.content.trim()
    console.log('✅ 대사 확장 완료:', expandedDialogue.substring(0, 100) + '...')
    return expandedDialogue

  } catch (error) {
    console.error('❌ 대사 확장 실패:', error.message)
    return originalDialogue
  }
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
    
    // 새로운 로직: 씬 지속시간에 따라 3개 컷으로 강제 제한 (max_tokens 제한 고려)
    let numCuts = 3 // 강제로 3개 컷으로 제한
    
    const baseCutDuration = Math.floor(totalSeconds / numCuts) // 컷당 평균 지속시간
    
    // 씬의 dialogue를 2분 발화길이로 확장
    const originalDialogue = sceneData.dialogue || sceneData.description || ''
    const expandedDialogue = await expandDialogueTo2Minutes(originalDialogue, sceneData)
    
    // 씬에서 파싱 가능한 정보들
    const sceneInfo = {
      title: sceneData.title || '',
      description: sceneData.description || '',
      keywords: sceneData.keywords || {},
      weights: sceneData.weights || {},
      timeOfDay: sceneData.keywords?.timeOfDay || '낮',
      location: sceneData.keywords?.location || '',
      characters: sceneData.keywords?.cast?.join(', ') || '',
      mood: sceneData.keywords?.mood || '',
      lighting: sceneData.keywords?.lighting || '자연광',
      weather: sceneData.keywords?.weather || '맑음',
      equipment: sceneData.keywords?.equipment || '',
      dialogue: expandedDialogue,
      narration: sceneData.description || ''
    }
    
    // LLM을 사용하여 컷 생성 프롬프트 작성
    const prompt = `
씬: ${sceneInfo.title} - ${sceneInfo.description}
장소: ${sceneInfo.location}, 시간: ${sceneInfo.timeOfDay}
등장인물: ${sceneInfo.characters}, 분위기: ${sceneInfo.mood}
대사: ${sceneInfo.dialogue}

정확히 3개 컷을 다음 형식으로 생성:
{
  "cuts": [
    {
      "shotNumber": 1,
      "title": "컷 제목",
      "description": "촬영 설명",
      "shootingPlan": {
        "shotSize": "MS",
      "angleDirection": "Eye-level",
      "cameraMovement": "Static",
        "lensSpecs": "50mm"
      },
      "characterMovement": {
        "characters": [{"name": "캐릭터", "action": "행동", "emotion": "감정"}],
        "blocking": "배치 설명"
      },
      "duration": 5
    }
  ]
}
`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
                          content: '당신은 영화 촬영 전문가입니다. 정확히 3개의 컷만 생성하고 유효한 JSON 형식으로만 응답하세요. 간결하게 작성해주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3, // 더 일관된 응답을 위해 낮춤
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // 90초 타임아웃으로 증가
      }
    )

    const content = response.data.choices[0].message.content.trim()
    const tokenCount = response.data.usage.total_tokens

    console.log('✅ LLM API 호출 성공:', { tokenCount, contentLength: content.length })
    
    // JSON 파싱 - 강화된 에러 처리
    let parsedCuts = []
    let cleanContent = content // 변수를 try 블록 밖으로 이동
    
    try {
      console.log('🔍 LLM 원본 응답:', content.substring(0, 300) + '...')
      
      // 마크다운 코드 블록 제거
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '')
      }
      // ``` ... ``` 형태 제거
      else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '')
      }
      
      // JSON 객체 시작과 끝 찾기
      const jsonStart = cleanContent.indexOf('{')
      const jsonEnd = cleanContent.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1)
      }
      
      console.log('🔍 LLM 응답 정리 후:', cleanContent.substring(0, 200) + '...')
      
      // JSON 파싱 시도
      let parsed
      try {
        parsed = JSON.parse(cleanContent)
      } catch (parseError) {
        console.error('❌ JSON 파싱 실패, 재시도 중...')
        
        // 더 강력한 JSON 수정 시도
        let fixedContent = cleanContent
          .replace(/,\s*}/g, '}') // 마지막 쉼표 제거
          .replace(/,\s*]/g, ']') // 배열 마지막 쉼표 제거
          .replace(/undefined/g, '""') // undefined를 빈 문자열로
          .replace(/null/g, '""') // null을 빈 문자열로
          .replace(/NaN/g, '0') // NaN을 0으로
          .replace(/,\s*"([^"]+)":\s*$/gm, '') // 불완전한 속성 제거
          .replace(/,\s*"([^"]+)":\s*"[^"]*$/gm, '') // 불완전한 문자열 값 제거
          .replace(/,\s*"([^"]+)":\s*\{[^}]*$/gm, '') // 불완전한 객체 제거
          .replace(/,\s*"([^"]+)":\s*\[[^\]]*$/gm, '') // 불완전한 배열 제거
        
        // 불완전한 cuts 배열 수정
        if (fixedContent.includes('"cuts": [')) {
          const cutsStart = fixedContent.indexOf('"cuts": [')
          const cutsEnd = fixedContent.lastIndexOf(']')
          if (cutsEnd > cutsStart) {
            const beforeCuts = fixedContent.substring(0, cutsStart)
            const afterCuts = fixedContent.substring(cutsEnd + 1)
            fixedContent = beforeCuts + '"cuts": []' + afterCuts
          }
        }
        
        try {
          parsed = JSON.parse(fixedContent)
        } catch (secondError) {
          console.error('❌ JSON 파싱 재시도 실패:', secondError.message)
          
          // 최후의 수단: 기본 JSON 구조 생성
          console.log('⚠️ 기본 JSON 구조로 대체')
          parsed = {
            cuts: []
          }
        }
      }
      
      // cuts 배열 검증 및 생성
      if (parsed && parsed.cuts && Array.isArray(parsed.cuts) && parsed.cuts.length > 0) {
        console.log('✅ LLM 응답 구조 검증 성공:', parsed.cuts.length, '개 컷')
        
        // 각 컷 데이터 검증 및 정리
        parsedCuts = parsed.cuts.map((cut, index) => {
          // NaN 값들을 적절한 기본값으로 변환하는 함수
          const cleanDuration = (duration) => {
            if (typeof duration === 'string') {
              // "NaN초", "5초" 등의 문자열 처리
              const match = duration.match(/(\d+)초/)
              return match ? parseInt(match[1]) : baseCutDuration
            }
            if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
              return duration
            }
            return baseCutDuration // 기본값
          }

          const cleanNumber = (value) => {
            if (typeof value === 'number' && !isNaN(value) && value >= 0) {
              return value
            }
            return 0
          }

          const cleanString = (value) => {
            return typeof value === 'string' ? value.trim() : ''
          }

          // 각 컷의 지속시간을 씬 전체 지속시간에 맞게 조정
          const cutDuration = cleanDuration(cut.duration || cut.estimatedDuration)
          const startTime = index * baseCutDuration
          const endTime = Math.min((index + 1) * baseCutDuration, totalSeconds)

          // Cut 모델에 맞는 안전한 컷 데이터 생성
          const safeCut = {
            shotNumber: cleanNumber(cut.shotNumber) || (index + 1),
            title: cleanString(cut.title) || `${sceneInfo.title} - ${index + 1}번째 컷`,
            description: cleanString(cut.description) || `${sceneInfo.title} - ${index + 1}번째 컷`,
            shootingPlan: {
              shotSize: cleanString(cut.shootingPlan?.shotSize || cut.shotSize) || 'MS',
              angleDirection: cleanString(cut.shootingPlan?.angleDirection || cut.angleDirection) || 'Eye-level',
              cameraMovement: cleanString(cut.shootingPlan?.cameraMovement || cut.cameraMovement) || 'Static',
              lensSpecs: cleanString(cut.shootingPlan?.lensSpecs || cut.lensSpecs) || '50mm',
              cameraSettings: cut.shootingPlan?.cameraSettings || {
                aperture: 'f/2.8',
                shutterSpeed: '1/60',
                iso: '400'
              },
              composition: cleanString(cut.shootingPlan?.composition || cut.composition) || cleanString(cut.description) || ''
            },
            cutType: cleanString(cut.cutType) || 'MS',
            vfxEffects: cleanString(cut.vfxEffects) || '',
            soundEffects: cleanString(cut.soundEffects) || '',

            composition: cleanString(cut.composition) || cleanString(cut.description) || '',
            dialogue: cleanString(cut.dialogue) || '',
            directorNotes: cleanString(cut.directorNotes) || '',
            dialogue: cleanString(cut.dialogue) || '',
            narration: cleanString(cut.narration) || '',
            characterMovement: cut.characterMovement || {
              characters: [{
                name: sceneInfo.characters || '주인공',
                position: {
                  x: 50,
                  y: 60
                },
                action: '자연스러운 연기',
                emotion: '중립적 표정'
              }],
              blocking: '중앙 정면',
              cameraPosition: {
                x: 50,
                y: 50,
                z: 5
              }
            },
            productionMethod: cleanString(cut.productionMethod) || 'live_action',
            estimatedDuration: cleanNumber(cut.estimatedDuration) || cutDuration,
            shootingConditions: {
              location: cleanString(cut.shootingConditions?.location || sceneInfo.location) || '',
              timeOfDay: cleanString(cut.shootingConditions?.timeOfDay || sceneInfo.timeOfDay) || '오후',
              weather: cleanString(cut.shootingConditions?.weather || cut.weather || sceneInfo.weather) || '맑음',
              lighting: cleanString(cut.shootingConditions?.lighting || cut.lighting || sceneInfo.lighting) || '자연광',
              lightingSetup: cut.shootingConditions?.lightingSetup || cut.lightingSetup || {
                mainLight: sceneInfo.lighting === '자연광' ? '창문' : '메인 라이트',
                fillLight: sceneInfo.lighting === '자연광' ? '반사판' : '필 라이트',
                backLight: sceneInfo.lighting === '자연광' ? '역광' : '백 라이트',
                specialEffects: '',
                intensity: '보통',
                color: '백색광'
              },
              specialRequirements: cut.shootingConditions?.specialRequirements || []
            },
            requiredPersonnel: cut.requiredPersonnel || {
              director: '감독',
              cinematographer: '촬영감독',
              cameraOperator: '카메라맨',
              lightingDirector: '조명감독',
              additionalCrew: []
            },
            requiredEquipment: cut.requiredEquipment || {
              cameras: ['C1'],
              lenses: ['50mm'],
              lighting: [sceneInfo.lighting],
              audio: ['마이크 1개'],
              grip: ['삼각대'],
              special: []
            },
            output: cut.output || {
              aiVideoUrl: null,
              aiVideoPrompt: null,
              aiVideoModel: null,
              rawFootageUrl: null,
              finalCutUrl: null,
              imageUrl: null
            },
            status: cleanString(cut.status) || 'planned',
            order: cleanNumber(cut.order) || (index + 1),
            canEdit: true,
            modifiedBy: 'AI',

          }

          // 추가 안전장치: 모든 숫자 필드 확인
          if (isNaN(safeCut.startTime)) safeCut.startTime = startTime
          if (isNaN(safeCut.endTime)) safeCut.endTime = endTime
          if (isNaN(safeCut.totalDuration)) safeCut.totalDuration = cutDuration
          if (isNaN(safeCut.estimatedDuration)) safeCut.estimatedDuration = cutDuration

          return safeCut
        })
        
        console.log('✅ LLM 응답 파싱 성공:', parsedCuts.length, '개 컷')
      } else {
        console.error('❌ LLM 응답에 cuts 배열이 없거나 비어있음')
        throw new Error('Invalid cuts array')
      }
    } catch (parseError) {
      console.error('❌ LLM 응답 파싱 실패:', parseError.message)
      console.log('원본 응답:', content.substring(0, 500))
      console.log('정리된 응답:', cleanContent.substring(0, 500))
      
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
        
        // 몰입감을 위한 전후 컷 디자인 패턴
        const getCutPattern = (cutNumber, mood, totalCuts) => {
          // 감정에 따른 기본 패턴
          let basePattern = {
            cutType: 'MS',
            shotSize: 'MS',
            lensSpecs: '50mm',
            angleDirection: 'Eye-level',
            cameraMovement: 'Static'
          }
          
          // 첫 번째 컷: Establish Shot (상황 설정)
        if (cutNumber === 1) {
            basePattern = {
              cutType: 'WS',
              shotSize: 'WS',
              lensSpecs: '24mm',
              angleDirection: 'Eye-level',
              cameraMovement: 'Static'
            }
          }
          // 마지막 컷: 전체 분위기 회복
          else if (cutNumber === totalCuts) {
            basePattern = {
              cutType: 'WS',
              shotSize: 'WS',
              lensSpecs: '24mm',
              angleDirection: 'Eye-level',
              cameraMovement: 'Static'
            }
          }
          // 중간 컷들: 감정에 따른 변화
          else {
            // 감정적 장면
            if (mood.includes('감정') || mood.includes('슬픔') || mood.includes('기쁨') || mood.includes('사랑')) {
              if (cutNumber === 2) {
                basePattern = { cutType: 'MS', shotSize: 'MS', lensSpecs: '50mm', angleDirection: 'Eye-level', cameraMovement: 'Static' }
        } else if (cutNumber === 3) {
                basePattern = { cutType: 'CU', shotSize: 'CU', lensSpecs: '85mm', angleDirection: 'Eye-level', cameraMovement: 'Static' }
        } else if (cutNumber === 4) {
                basePattern = { cutType: 'ECU', shotSize: 'ECU', lensSpecs: '100mm', angleDirection: 'Dutch', cameraMovement: 'Static' }
              }
            }
            // 긴장감 있는 장면
            else if (mood.includes('긴장') || mood.includes('두려움') || mood.includes('불안')) {
              if (cutNumber === 2) {
                basePattern = { cutType: 'MS', shotSize: 'MS', lensSpecs: '50mm', angleDirection: 'Dutch', cameraMovement: 'Handheld' }
              } else if (cutNumber === 3) {
                basePattern = { cutType: 'CU', shotSize: 'CU', lensSpecs: '85mm', angleDirection: 'Dutch', cameraMovement: 'Handheld' }
              } else if (cutNumber === 4) {
                basePattern = { cutType: 'ECU', shotSize: 'ECU', lensSpecs: '100mm', angleDirection: 'Dutch', cameraMovement: 'Handheld' }
              }
            }
            // 액션 장면
            else if (mood.includes('액션') || mood.includes('싸움') || mood.includes('추격')) {
              if (cutNumber === 2) {
                basePattern = { cutType: 'MS', shotSize: 'MS', lensSpecs: '50mm', angleDirection: 'Low', cameraMovement: 'Dolly' }
              } else if (cutNumber === 3) {
                basePattern = { cutType: 'CU', shotSize: 'CU', lensSpecs: '85mm', angleDirection: 'Low', cameraMovement: 'Dolly' }
              } else if (cutNumber === 4) {
                basePattern = { cutType: 'ECU', shotSize: 'ECU', lensSpecs: '100mm', angleDirection: 'Low', cameraMovement: 'Dolly' }
              }
            }
            // 웅장한 장면
            else if (mood.includes('웅장') || mood.includes('대규모') || mood.includes('전체')) {
              if (cutNumber === 2) {
                basePattern = { cutType: 'MS', shotSize: 'MS', lensSpecs: '50mm', angleDirection: 'High', cameraMovement: 'Pan' }
              } else if (cutNumber === 3) {
                basePattern = { cutType: 'CU', shotSize: 'CU', lensSpecs: '85mm', angleDirection: 'High', cameraMovement: 'Pan' }
              } else if (cutNumber === 4) {
                basePattern = { cutType: 'ECU', shotSize: 'ECU', lensSpecs: '100mm', angleDirection: 'High', cameraMovement: 'Pan' }
              }
            }
            // 일상적인 장면
            else {
              if (cutNumber === 2) {
                basePattern = { cutType: 'MS', shotSize: 'MS', lensSpecs: '50mm', angleDirection: 'Eye-level', cameraMovement: 'Static' }
              } else if (cutNumber === 3) {
                basePattern = { cutType: 'CU', shotSize: 'CU', lensSpecs: '85mm', angleDirection: 'Eye-level', cameraMovement: 'Static' }
              } else if (cutNumber === 4) {
                basePattern = { cutType: 'ECU', shotSize: 'ECU', lensSpecs: '100mm', angleDirection: 'Eye-level', cameraMovement: 'Static' }
              }
            }
          }
          
          return basePattern
        }
        
        const pattern = getCutPattern(cutNumber, sceneInfo.mood, numCuts)
        cutType = pattern.cutType
        shotSize = pattern.shotSize
        lensSpecs = pattern.lensSpecs
        angleDirection = pattern.angleDirection
        cameraMovement = pattern.cameraMovement
        
        const dialogueParts = sceneInfo.dialogue.split('.').filter(part => part.trim())
        const dialogueIndex = i % dialogueParts.length
        const cutDialogue = dialogueParts[dialogueIndex] || sceneInfo.dialogue
        
        // 몰입감을 위한 description 생성
        const getDescription = (cutNumber, totalCuts, mood, shotSize, angleDirection, cameraMovement) => {
          let description = ''
          
          // 첫 번째 컷: Establish Shot
          if (cutNumber === 1) {
            description = `카메라가 ${sceneInfo.location}의 전체적인 모습을 와이드샷으로 담으며, ${sceneInfo.timeOfDay}의 ${sceneInfo.lighting}이 ${sceneInfo.weather} 속에서 ${sceneInfo.mood}한 분위기를 만들어낸다. ${sceneInfo.characters}이 ${sceneInfo.location}에서 자연스럽게 위치해 있다.`
          }
          // 마지막 컷: 전체 분위기 회복
          else if (cutNumber === totalCuts) {
            description = `카메라가 다시 와이드샷으로 돌아가며, ${sceneInfo.location}의 전체적인 분위기를 담는다. ${sceneInfo.mood}한 분위기가 ${sceneInfo.lighting}과 어우러져 자연스러운 마무리를 만들어낸다.`
          }
          // 중간 컷들: 감정에 따른 변화
          else {
            if (mood.includes('감정') || mood.includes('슬픔') || mood.includes('기쁨') || mood.includes('사랑')) {
              if (cutNumber === 2) {
                description = `카메라가 중간샷으로 전환하며, ${sceneInfo.characters}의 표정과 행동에 집중한다. ${sceneInfo.lighting}이 부드럽게 비추며 감정적 분위기를 조성한다.`
              } else if (cutNumber === 3) {
                description = `카메라가 클로즈업으로 전환하여 ${sceneInfo.characters}의 미묘한 표정 변화를 포착한다. 내적 감정이 표정에 드러나는 순간을 집중적으로 담는다.`
              } else if (cutNumber === 4) {
                description = `카메라가 극도 클로즈업으로 전환하며, ${sceneInfo.characters}의 감정이 절정에 달한 순간을 담는다. Dutch 앵글로 불안감을 조성하며 내적 갈등을 강조한다.`
              }
            } else if (mood.includes('긴장') || mood.includes('두려움') || mood.includes('불안')) {
              if (cutNumber === 2) {
                description = `카메라가 중간샷으로 전환하며, ${sceneInfo.characters}의 긴장된 모습을 담는다. Dutch 앵글로 불안감을 조성하고 Handheld 움직임으로 긴장감을 강화한다.`
              } else if (cutNumber === 3) {
                description = `카메라가 클로즈업으로 전환하여 ${sceneInfo.characters}의 긴장된 표정을 집중적으로 담는다. 두려움이 표정에 드러나는 순간을 포착한다.`
              } else if (cutNumber === 4) {
                description = `카메라가 극도 클로즈업으로 전환하며, ${sceneInfo.characters}의 극도의 긴장감을 담는다. Dutch 앵글로 불안감을 최대한 조성한다.`
              }
            } else if (mood.includes('액션') || mood.includes('싸움') || mood.includes('추격')) {
              if (cutNumber === 2) {
                description = `카메라가 중간샷으로 전환하며, ${sceneInfo.characters}의 동적인 움직임을 담는다. Low 앵글로 웅장함을 표현하고 Dolly 움직임으로 액션을 강화한다.`
              } else if (cutNumber === 3) {
                description = `카메라가 클로즈업으로 전환하여 ${sceneInfo.characters}의 액션의 결정적 순간을 집중적으로 담는다. 동작의 세부사항을 포착한다.`
              } else if (cutNumber === 4) {
                description = `카메라가 극도 클로즈업으로 전환하며, ${sceneInfo.characters}의 액션의 클라이맥스를 담는다. Low 앵글로 웅장함을 최대한 표현한다.`
              }
            } else {
              if (cutNumber === 2) {
                description = `카메라가 중간샷으로 전환하며, ${sceneInfo.characters}의 자연스러운 행동을 담는다. ${sceneInfo.lighting}이 자연스럽게 비추며 일상적인 분위기를 조성한다.`
              } else if (cutNumber === 3) {
                description = `카메라가 클로즈업으로 전환하여 ${sceneInfo.characters}의 표정과 행동을 집중적으로 담는다. 자연스러운 연기와 반응을 포착한다.`
              } else if (cutNumber === 4) {
                description = `카메라가 극도 클로즈업으로 전환하며, ${sceneInfo.characters}의 미묘한 표정 변화를 담는다. 일상적이면서도 의미 있는 순간을 집중한다.`
              }
            }
          }
          
          return description
        }
        
        const description = getDescription(cutNumber, numCuts, sceneInfo.mood, shotSize, angleDirection, cameraMovement)
        
        // Cut 모델에 맞는 기본 컷 생성
        const defaultCut = {
          shotNumber: cutNumber || 1,
          title: `${sceneInfo.title} - ${cutNumber}번째 컷`,
          description: description,
          shootingPlan: {
            shotSize: shotSize,
            angleDirection: angleDirection,
            cameraMovement: cameraMovement,
            lensSpecs: lensSpecs,
            cameraSettings: {
              aperture: 'f/2.8',
              shutterSpeed: '1/60',
              iso: '400'
            },
            composition: description
          },
          cutType: cutType,
          vfxEffects: '',
          soundEffects: '',

          composition: description,
          dialogue: cutDialogue,
          directorNotes: '',
          narration: sceneInfo.narration,
          characterMovement: {
            characters: [{
              name: sceneInfo.characters || '주인공',
              position: {
                x: 50,
                y: 60
              },
              action: '자연스러운 연기',
              emotion: '중립적 표정'
            }],
            blocking: '중앙 정면',
            cameraPosition: {
              x: 50,
              y: 50,
              z: 5
            }
          },
          productionMethod: 'live_action',
          estimatedDuration: duration,
          shootingConditions: {
            location: sceneInfo.location,
            timeOfDay: sceneInfo.timeOfDay,
            weather: sceneInfo.weather,
            lighting: sceneInfo.lighting,
            lightingSetup: {
              mainLight: sceneInfo.lighting === '자연광' ? '창문' : '메인 라이트',
              fillLight: sceneInfo.lighting === '자연광' ? '반사판' : '필 라이트',
              backLight: sceneInfo.lighting === '자연광' ? '역광' : '백 라이트',
              specialEffects: '',
              intensity: '보통',
              color: '백색광'
            },
            specialRequirements: []
          },
          requiredPersonnel: {
            director: '감독',
            cinematographer: '촬영감독',
            cameraOperator: '카메라맨',
            lightingDirector: '조명감독',
            additionalCrew: []
          },
          requiredEquipment: {
            cameras: ['C1'],
            lenses: [lensSpecs],
            lighting: [sceneInfo.lighting],
            audio: ['마이크 1개'],
            grip: ['삼각대'],
            special: []
          },
          output: {
            aiVideoUrl: null,
            aiVideoPrompt: null,
            aiVideoModel: null,
            rawFootageUrl: null,
            finalCutUrl: null,
            imageUrl: null
          },
          status: 'planned',
          order: cutNumber,
          canEdit: true,
          modifiedBy: 'AI',

        }
        
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
          // 개발 환경에서는 임시 이미지 반환
          if (process.env.NODE_ENV === 'development') {
            cutImageUrl = `/uploads/images/dev_cut_placeholder.png`
            console.log(`🥝🥝🥝 컷 ${cutNumber} 이미지 안 만듦 (개발 모드)`)
          } else {
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
          }
        } catch (imageError) {
          console.error(`❌ 컷 ${cutNumber} 이미지 생성 실패:`, imageError.message)
          // 이미지 생성 실패는 치명적이지 않으므로 계속 진행
        }

        // 기본 컷에 추가 정보 포함
        const enhancedDefaultCut = {
          ...defaultCut,
          shootingConditions: {
            ...defaultCut.shootingConditions,
          lightingSetup: {
            mainLight: sceneInfo.lighting === '자연광' ? '창문' : '메인 라이트',
            fillLight: sceneInfo.lighting === '자연광' ? '반사판' : '필 라이트',
            backLight: sceneInfo.lighting === '자연광' ? '역광' : '백 라이트',
            specialEffects: '',
            intensity: '보통',
            color: '백색광'
            }
          },
          characterMovement: {
            ...defaultCut.characterMovement,
          characters: [{
            name: sceneInfo.characters || '주인공',
              position: {
                x: 50,
                y: 60
              },
              action: '자연스러운 연기',
              emotion: '중립적 표정'
            }],
            blocking: characterPositions[positionIndex] || '중앙 정면',
            cameraPosition: {
              x: 50,
              y: 50,
              z: shotSize === 'WS' ? 8 : shotSize === 'CU' ? 2 : 5
            }
          },
          output: {
            ...defaultCut.output,
            imageUrl: cutImageUrl // 컷 이미지 URL 추가
          }
        }
        
        parsedCuts.push(enhancedDefaultCut)
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
const realLocationsRouter = require('./routes/realLocations');
const groupsRouter = require('./routes/groups');
const schedulesRouter = require('./routes/schedules');

app.use('/api/auth', authRoutes); // /api/auth/* 경로를 auth 라우터로 연결
app.use('/api/users', userRoutes); // /api/users/* 경로를 user 라우터로 연결
app.use('/api/projects', projectRoutes); // /api/projects/* 경로를 project 라우터로 연결
app.use('/api/projects', conteRoutes); // /api/projects/*/contes/* 경로를 conte 라우터로 연결
app.use('/api/projects', cutRoutes); // /api/projects/*/contes/*/cuts/* 경로를 cut 라우터로 연결
app.use('/api/timeline', timelineRoutes.router); // /api/timeline/* 경로를 timeline 라우터로 연결
app.use('/api/projects', realLocationsRouter);
app.use('/api/projects', groupsRouter);
app.use('/api/projects', schedulesRouter);

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

    // 컷들을 MongoDB에 저장
    const savedCuts = []
    for (const cut of cuts) {
      try {
        // projectId 확인 및 설정
        const projectId = sceneData.projectId || req.params.projectId || req.body.projectId
        if (!projectId) {
          console.error('❌ projectId가 누락되었습니다:', { sceneData, reqParams: req.params, reqBody: req.body })
          throw new Error('projectId가 필요합니다.')
        }
        
        // 중복 컷 확인 (shotNumber와 conteId로 확인)
        const existingCut = await Cut.findOne({ 
          conteId: sceneData.conteId || sceneData.id || sceneData._id,
          shotNumber: cut.cutNumber 
        })
        
        if (existingCut) {
          console.log('⚠️ 중복 컷 발견, 건너뜀:', { 
            cutId: existingCut._id, 
            cutIdField: existingCut.cutId,
            scene: sceneData.scene,
            shotNumber: cut.cutNumber 
          })
          savedCuts.push(existingCut)
          continue
        }
        
        // conteId 값 확인 및 로깅
        const conteId = sceneData.conteId || sceneData.id || sceneData._id
        console.log('🔍 컷 저장 전 conteId 확인:', {
          sceneData: {
            conteId: sceneData.conteId,
            id: sceneData.id,
            _id: sceneData._id
          },
          finalConteId: conteId,
          scene: sceneData.scene,
          cutNumber: cut.cutNumber
        })
        
        // Cut 모델의 필수 필드들을 올바르게 매핑
        const cutDoc = new Cut({
          conteId: conteId, // 씬 ID를 conteId로 사용
          projectId: projectId,
          // cutId는 MongoDB에서 자동 생성됨
          shotNumber: cut.shotNumber || cut.cutNumber || 1,
          title: cut.description || cut.title,
          description: cut.description,
          shootingPlan: {
            shotSize: cut.shotSize,
            angleDirection: cut.angleDirection,
            cameraMovement: cut.cameraMovement,
            lensSpecs: cut.lensSpecs,
            cameraSettings: {
              aperture: 'f/2.8',
              shutterSpeed: '1/60',
              iso: '800'
            },
            composition: cut.description
          },
          cutType: cut.cutType,
          dialogue: cut.dialogue || '',
          narration: cut.narration || '',
                      characterMovement: cut.characterMovement || {
            characters: cut.characters || [],
              blocking: '배치 설명',
            cameraPosition: { x: 50, y: 50, z: 0 }
          },
          productionMethod: 'live_action',
          estimatedDuration: typeof cut.duration === 'string' ? parseInt(cut.duration) : (cut.duration || cut.estimatedDuration || 5),
          // VFX/CG 관련 필드들 - LLM 응답에서 가져오기
          vfxEffects: cut.visualEffects || cut.vfxEffects || '',
          soundEffects: cut.soundEffects || '',
          
          composition: cut.composition || cut.description || '',
          dialogue: cut.dialogue || '',
          directorNotes: cut.directorNotes || '',
          shootingConditions: {
            location: sceneData.keywords?.location || '',
            timeOfDay: sceneData.keywords?.timeOfDay === '낮' ? '오후' : (sceneData.keywords?.timeOfDay || '오후'),
            weather: cut.weather || '맑음',
            lighting: cut.lighting || '자연광',
            specialRequirements: []
          },
          requiredPersonnel: {
            director: cut.requiredPersonnel?.director || '감독',
            cinematographer: cut.requiredPersonnel?.cinematographer || '촬영감독',
            cameraOperator: cut.requiredPersonnel?.cameraOperator || '카메라맨',
            lightingDirector: cut.requiredPersonnel?.lightingDirector || '조명감독',
            additionalCrew: cut.requiredPersonnel?.additionalCrew || []
          },
          requiredEquipment: {
            cameras: cut.requiredEquipment?.cameras || [cut.equipment?.camera || 'C1'],
            lenses: cut.requiredEquipment?.lenses || [cut.lensSpecs || '50mm'],
            lighting: cut.requiredEquipment?.lighting || [cut.lighting || '자연광'],
            audio: cut.requiredEquipment?.audio || ['마이크 1개'],
            grip: cut.requiredEquipment?.grip || ['삼각대'],
            special: cut.requiredEquipment?.special || []
          },
          order: cut.cutNumber,
          status: 'planned',
          // 개발용 임시 이미지 URL 추가
          output: {
            imageUrl: '/uploads/images/dev_placeholder.png'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        const savedCut = await cutDoc.save()
        savedCuts.push(savedCut)
        console.log('✅ 컷 저장 완료:', { cutId: savedCut._id, scene: sceneData.scene })
      } catch (saveError) {
        console.error('❌ 컷 저장 오류:', saveError.message)
        // 저장 실패해도 계속 진행
        savedCuts.push(cut)
      }
    }

    console.log('✅ 컷 생성 및 저장 완료:', { scene: sceneData.scene, cutCount: savedCuts.length })

    res.json({
      success: true,
      cuts: savedCuts,
      sceneId: sceneData.scene,
      totalCuts: savedCuts.length,
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

    // 개발 환경에서는 임시 이미지 반환
    if (process.env.NODE_ENV === 'development') {
      const imageUrl = `/uploads/images/dev_cut_placeholder.png`
      console.log('🥝🥝🥝 컷 이미지 안 만듦 (개발 모드)')
      return res.json({
        success: true,
        imageUrl: imageUrl,
        prompt: '[개발용 임시 컷 이미지]',
        generatedAt: new Date().toISOString(),
        model: 'dev-placeholder',
        isFreeTier: true
      })
    }

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
        max_tokens: 4000,
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