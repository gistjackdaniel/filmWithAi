# Veo3 API 실제 구현 가이드

## 🎯 Google Cloud에서 제공한 실제 Veo3 API 스펙

Google Cloud에서 제공한 Veo3 API는 **Long Running Operation** 방식으로 작동합니다.

## 🔧 실제 API 호출 방법

### 1. API 엔드포인트
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/veo-3.0-fast-generate-preview:predictLongRunning
```

### 2. 요청 데이터 구조
```json
{
  "endpoint": "projects/filmwithai/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-preview",
  "instances": [
    {
      "prompt": "A cinematic scene of a detective walking through a foggy street at night"
    }
  ],
  "parameters": {
    "aspectRatio": "16:9",
    "sampleCount": 1,
    "durationSeconds": "8",
    "personGeneration": "allow_all",
    "addWatermark": false,
    "includeRaiReason": false,
    "generateAudio": true,
    "resolution": "720p"
  }
}
```

### 3. 응답 구조
```json
{
  "name": "projects/filmwithai/locations/us-central1/operations/1234567890123456789"
}
```

### 4. 결과 조회
```
POST https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/veo-3.0-fast-generate-preview:fetchPredictOperation
```

```json
{
  "operationName": "projects/filmwithai/locations/us-central1/operations/1234567890123456789"
}
```

## 🚀 구현된 기능들

### 1. Long Running Operation 처리
```javascript
// 1단계: Operation 시작
const response = await fetch(`${apiBaseUrl}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predictLongRunning`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})

// 2단계: Operation ID 추출
const operationId = data.name

// 3단계: 결과 대기
const result = await waitForVeo3Operation(operationId, authToken, config, onProgress)
```

### 2. 상태 폴링
```javascript
const waitForVeo3Operation = async (operationId, authToken, config, onProgress) => {
  const maxAttempts = 60 // 최대 5분 대기
  let attempts = 0

  while (attempts < maxAttempts) {
    // Operation 상태 확인
    const statusResponse = await fetch(`${apiBaseUrl}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName: operationId
      })
    })

    const statusData = await statusResponse.json()
    
    if (statusData.done) {
      // Operation 완료
      return extractVideoUrlFromResponse(statusData)
    }

    // 5초 대기 후 재시도
    await new Promise(resolve => setTimeout(resolve, 5000))
    attempts++
  }
}
```

### 3. 비디오 URL 추출
```javascript
const extractVideoUrlFromResponse = (response) => {
  try {
    // 1. URL 형태의 응답
    if (response.result && response.result.predictions && response.result.predictions[0]) {
      return response.result.predictions[0].video_url
    }
    
    // 2. Base64 인코딩된 비디오 데이터
    if (response.result && response.result.predictions && response.result.predictions[0] && response.result.predictions[0].video) {
      const videoData = response.result.predictions[0].video
      const blob = new Blob([Buffer.from(videoData, 'base64')], { type: 'video/mp4' })
      return URL.createObjectURL(blob)
    }

    throw new Error('비디오 URL을 찾을 수 없습니다.')
  } catch (error) {
    throw new Error('생성된 영상을 처리할 수 없습니다.')
  }
}
```

## 📋 API 파라미터 설명

### 필수 파라미터
| 파라미터 | 타입 | 설명 | 예시 |
|----------|------|------|------|
| `endpoint` | string | 모델 엔드포인트 | `projects/filmwithai/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-preview` |
| `instances[].prompt` | string | 영상 생성 프롬프트 | `"A cinematic scene of a detective walking through a foggy street"` |

### 선택 파라미터
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `aspectRatio` | string | `"16:9"` | 영상 비율 (16:9, 9:16, 1:1) |
| `sampleCount` | number | `1` | 생성할 영상 개수 |
| `durationSeconds` | string | `"8"` | 영상 길이 (초) |
| `personGeneration` | string | `"allow_all"` | 인물 생성 정책 |
| `addWatermark` | boolean | `false` | 워터마크 추가 여부 |
| `includeRaiReason` | boolean | `false` | RAI 이유 포함 여부 |
| `generateAudio` | boolean | `true` | 오디오 생성 여부 |
| `resolution` | string | `"720p"` | 해상도 (720p, 1080p) |

## 🔄 전체 플로우

### 1. 사용자 액션
```
V1 타임라인에서 컷을 V2로 드래그
```

### 2. 프롬프트 변환
```
컷 정보 → Veo3 프롬프트 변환
예: "탐정이 안개 낀 거리를 걸어가는 장면, wide shot angle, dramatic lighting"
```

### 3. Long Running Operation 시작
```
POST /predictLongRunning
→ Operation ID 반환
```

### 4. 상태 폴링
```
5초마다 /fetchPredictOperation 호출
→ 완료될 때까지 대기
```

### 5. 결과 처리
```
완료된 Operation에서 비디오 URL 추출
→ 타임라인에 영상 추가
```

## 🛠️ 테스트 방법

### 1. Google Cloud CLI 사용
```bash
# 1. 인증
gcloud auth login

# 2. 프로젝트 설정
gcloud config set project filmwithai

# 3. 요청 파일 생성
cat << EOF > request.json
{
  "endpoint": "projects/filmwithai/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-preview",
  "instances": [
    {
      "prompt": "A cinematic scene of a detective walking through a foggy street at night"
    }
  ],
  "parameters": {
    "aspectRatio": "16:9",
    "sampleCount": 1,
    "durationSeconds": "8",
    "personGeneration": "allow_all",
    "addWatermark": false,
    "includeRaiReason": false,
    "generateAudio": true,
    "resolution": "720p"
  }
}
EOF

# 4. API 호출
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/filmwithai/locations/us-central1/publishers/google/models/veo-3.0-fast-generate-preview:predictLongRunning" \
  -d '@request.json'
```

### 2. FilmWithAI에서 테스트
```
1. 프론트엔드 서버 실행: npm run dev
2. 백엔드 서버 실행: cd backend && npm start
3. 브라우저에서 http://localhost:3002 접속
4. V1 타임라인에서 컷을 V2로 드래그
5. AI 영상 생성 진행률 확인
```

## 🚨 주의사항

### 1. 인증
- Google Cloud 서비스 계정 키 필요
- 백엔드에서 토큰 관리 (보안상 클라이언트에서 직접 접근 금지)

### 2. 비용
- Veo3 API는 유료 서비스
- 사용량에 따라 비용 발생
- 무료 할당량 확인 필요

### 3. 제한사항
- 현재 us-central1 지역에서만 사용 가능
- 베타 서비스이므로 API 스펙 변경 가능
- 최대 10초 영상 생성

### 4. 에러 처리
```javascript
try {
  const result = await generateVideoWithVeo3(cut, onProgress)
  console.log('영상 생성 완료:', result)
} catch (error) {
  console.error('영상 생성 실패:', error.message)
  // 사용자에게 에러 메시지 표시
}
```

---

**참고**: 이 구현은 Google Cloud에서 제공한 실제 Veo3 API 스펙을 기반으로 합니다. API가 업데이트되면 코드도 함께 수정해야 할 수 있습니다. 