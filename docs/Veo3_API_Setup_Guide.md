# Veo3 API 설정 로직 완전 가이드

## 🎯 개요

Veo3 API는 Google Cloud Vertex AI를 통해 텍스트 프롬프트를 바탕으로 AI 영상을 생성하는 서비스입니다.

## 🔧 설정 단계별 로직

### 1단계: 환경 변수 설정

#### 프론트엔드 (.env 파일)
```env
# Google Cloud Veo3 API 설정
REACT_APP_GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
REACT_APP_GOOGLE_CLOUD_LOCATION=us-central1
REACT_APP_VEO3_API_URL=https://us-central1-aiplatform.googleapis.com
```

#### 백엔드 (backend/.env 파일)
```env
# Google Cloud Veo3 API 설정
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json
```

### 2단계: API 설정 로직 분석

#### 2.1 환경 변수 로드
```javascript
// src/services/veo3Api.js
const VEO3_API_BASE_URL = process.env.REACT_APP_VEO3_API_URL || 'https://us-central1-aiplatform.googleapis.com'
const VEO3_PROJECT_ID = process.env.REACT_APP_GOOGLE_CLOUD_PROJECT_ID
const VEO3_LOCATION = process.env.REACT_APP_GOOGLE_CLOUD_LOCATION || 'us-central1'
```

**설명:**
- `process.env.REACT_APP_*`: React에서 환경 변수 접근
- `|| '기본값'`: 환경 변수가 없을 때 기본값 사용
- `VEO3_PROJECT_ID`: 기본값 없음 (필수 설정)

#### 2.2 API 설정 함수
```javascript
const getVeo3ApiConfig = () => {
  if (!VEO3_PROJECT_ID) {
    throw new Error('Google Cloud Project ID가 설정되지 않았습니다.')
  }

  return {
    projectId: VEO3_PROJECT_ID,
    location: VEO3_LOCATION,
    model: 'projects/google/locations/us-central1/models/veo3'
  }
}
```

**설명:**
- **검증**: 필수 환경 변수 확인
- **반환**: API 호출에 필요한 설정 객체
- **모델 경로**: Google Cloud의 Veo3 모델 경로

### 3단계: 프롬프트 변환 로직

#### 3.1 컷 정보를 프롬프트로 변환
```javascript
const convertCutToVeo3Prompt = (cut) => {
  const {
    title,
    description,
    lighting,
    weather,
    cameraAngle,
    shotType,
    estimatedDuration = 5
  } = cut

  let prompt = ''

  // 기본 장면 설명
  if (description) {
    prompt += description
  } else if (title) {
    prompt += title
  }

  // 촬영 기법 추가
  if (cameraAngle) {
    prompt += `, ${cameraAngle} angle`
  }

  if (shotType) {
    prompt += `, ${shotType} shot`
  }

  // 조명 설정
  if (lighting) {
    prompt += `, ${lighting} lighting`
  }

  // 날씨 설정
  if (weather) {
    prompt += `, ${weather} weather`
  }

  // 영화적 스타일 추가
  prompt += ', cinematic quality, high resolution, smooth motion'

  return {
    prompt,
    duration: Math.min(estimatedDuration, 10) // Veo3는 최대 10초 지원
  }
}
```

**설명:**
- **입력**: 컷 객체 (타임라인에서 드래그한 컷)
- **처리**: 컷 정보를 Veo3가 이해할 수 있는 프롬프트로 변환
- **출력**: 프롬프트 문자열과 영상 길이

#### 3.2 프롬프트 변환 예시
```javascript
// 입력 컷
const cut = {
  description: "탐정이 안개 낀 거리를 걸어가는 장면",
  cameraAngle: "wide shot",
  lighting: "dramatic",
  weather: "foggy",
  shotType: "tracking shot",
  estimatedDuration: 8
}

// 변환된 프롬프트
// "탐정이 안개 낀 거리를 걸어가는 장면, wide shot angle, 
// tracking shot shot, dramatic lighting, foggy weather, 
// cinematic quality, high resolution, smooth motion"
```

### 4단계: API 호출 로직

#### 4.1 Veo3 API 요청
```javascript
export const generateVideoWithVeo3 = async (cut, onProgress) => {
  try {
    const config = getVeo3ApiConfig()
    const { prompt, duration } = convertCutToVeo3Prompt(cut)

    // Veo3 API 요청 데이터
    const requestData = {
      instances: [{
        prompt: prompt,
        video_length: `${duration}s`,
        aspect_ratio: "16:9",
        fps: 24,
        quality: "hd"
      }],
      parameters: {
        temperature: 0.8,
        top_p: 0.9,
        top_k: 40
      }
    }

    // Google Cloud 인증 토큰 가져오기
    const authToken = await getGoogleCloudAuthToken()

    // API 호출
    const response = await fetch(`${VEO3_API_BASE_URL}/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/veo3:predict`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    // 응답 처리
    const data = await response.json()
    
    return {
      id: data.predictions?.[0]?.video_id || Date.now().toString(),
      status: 'completed',
      videoUrl: data.predictions?.[0]?.video_url,
      prompt: prompt,
      duration: duration,
      createdAt: new Date().toISOString(),
      cutId: cut.id,
      model: 'veo3'
    }

  } catch (error) {
    console.error('Veo3 API 오류:', error)
    throw new Error(`AI 영상 생성 실패: ${error.message}`)
  }
}
```

**설명:**
- **1단계**: API 설정 가져오기
- **2단계**: 컷을 프롬프트로 변환
- **3단계**: Veo3 API 요청 데이터 구성
- **4단계**: Google Cloud 인증 토큰 가져오기
- **5단계**: API 호출
- **6단계**: 응답 처리 및 결과 반환

### 5단계: 인증 로직

#### 5.1 Google Cloud 인증
```javascript
const getGoogleCloudAuthToken = async () => {
  try {
    // 백엔드 API를 통해 토큰 가져오기
    const response = await fetch('/api/auth/google-cloud-token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Google Cloud 인증 토큰을 가져올 수 없습니다.')
    }

    const data = await response.json()
    return data.token

  } catch (error) {
    console.error('Google Cloud 인증 오류:', error)
    throw new Error('Google Cloud 인증에 실패했습니다.')
  }
}
```

**설명:**
- **보안**: 클라이언트에서 직접 키 파일 접근 금지
- **백엔드**: 서비스 계정 키를 백엔드에서 관리
- **토큰**: 백엔드 API를 통해 인증 토큰 가져오기

### 6단계: 백엔드 인증 처리

#### 6.1 백엔드 인증 API
```javascript
// backend/routes/auth.js
router.get('/google-cloud-token', async (req, res) => {
  try {
    const { GoogleAuth } = require('google-auth-library')
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_CLOUD_KEY_FILE || './google-cloud-key.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })

    const client = await auth.getClient()
    const token = await client.getAccessToken()

    res.json({
      success: true,
      token: token.token,
      expiresAt: token.expiry_date
    })

  } catch (error) {
    console.error('Google Cloud 인증 오류:', error)
    res.status(500).json({
      success: false,
      error: 'Google Cloud 인증에 실패했습니다.',
      details: error.message
    })
  }
})
```

**설명:**
- **서비스 계정**: Google Cloud 서비스 계정 키 파일 사용
- **스코프**: Cloud Platform 전체 접근 권한
- **토큰**: 액세스 토큰과 만료 시간 반환

## 🔄 전체 플로우

### 1. 사용자 액션
```
V1 타임라인에서 컷을 V2로 드래그
```

### 2. 프론트엔드 처리
```
컷 정보 → 프롬프트 변환 → Veo3 API 호출
```

### 3. 백엔드 인증
```
서비스 계정 키 → Google Cloud 인증 → 토큰 반환
```

### 4. Veo3 API 호출
```
인증 토큰 + 프롬프트 → Veo3 모델 → AI 영상 생성
```

### 5. 결과 처리
```
생성된 영상 URL → 타임라인에 추가 → 사용자에게 표시
```

## 🛠️ 설정 확인 방법

### 1. 환경 변수 확인
```bash
# 프론트엔드
echo $REACT_APP_GOOGLE_CLOUD_PROJECT_ID
echo $REACT_APP_GOOGLE_CLOUD_LOCATION
echo $REACT_APP_VEO3_API_URL

# 백엔드
echo $GOOGLE_CLOUD_PROJECT_ID
echo $GOOGLE_CLOUD_LOCATION
echo $GOOGLE_CLOUD_KEY_FILE
```

### 2. Google Cloud 설정 확인
```bash
# 프로젝트 ID 확인
gcloud config get-value project

# API 활성화 확인
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"

# 서비스 계정 키 파일 확인
ls -la backend/google-cloud-key.json
```

### 3. 테스트
```javascript
// 브라우저 콘솔에서
console.log(process.env.REACT_APP_GOOGLE_CLOUD_PROJECT_ID)
console.log(process.env.REACT_APP_GOOGLE_CLOUD_LOCATION)
console.log(process.env.REACT_APP_VEO3_API_URL)
```

## 🚨 일반적인 오류

### 1. "Project ID not found"
```bash
# 해결: Google Cloud Console에서 프로젝트 ID 확인
```

### 2. "Authentication failed"
```bash
# 해결: 서비스 계정 키 파일 경로 및 권한 확인
chmod 600 backend/google-cloud-key.json
```

### 3. "API not enabled"
```bash
# 해결: Google Cloud Console에서 Vertex AI API 활성화
```

### 4. "Environment variable not found"
```bash
# 해결: .env 파일 확인 및 서버 재시작
npm run dev  # 프론트엔드
npm start    # 백엔드
```

---

**핵심**: Veo3 API는 Google Cloud Vertex AI를 통해 작동하며, 프론트엔드에서 백엔드로 인증을 요청하고, 백엔드에서 Google Cloud 서비스 계정을 사용하여 Veo3 API를 호출하는 구조입니다. 