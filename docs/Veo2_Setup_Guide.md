# Google Cloud Veo2 API 설정 가이드

## 개요
Veo2는 Google Cloud의 AI 비디오 생성 모델입니다. 이 가이드는 Veo2 API를 프로젝트에 설정하는 방법을 설명합니다.

## 1. Google Cloud 프로젝트 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID를 메모해두세요 (예: `my-video-project`)

### 1.2 API 활성화
다음 API들을 활성화해야 합니다:
- **Vertex AI API**
- **Cloud Storage API** (비디오 저장용)

```bash
# gcloud CLI 사용
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage.googleapis.com
```

## 2. 서비스 계정 설정

### 2.1 서비스 계정 생성
1. Google Cloud Console에서 "IAM 및 관리" > "서비스 계정"으로 이동
2. "서비스 계정 만들기" 클릭
3. 이름: `veo2-video-generator`
4. 설명: `Veo2 비디오 생성을 위한 서비스 계정`

### 2.2 권한 부여
다음 역할들을 추가하세요:
- **Vertex AI 사용자** (`roles/aiplatform.user`)
- **Storage 관리자** (`roles/storage.admin`) - 비디오 저장용

### 2.3 키 파일 다운로드
1. 서비스 계정 생성 후 "키 만들기" > "JSON" 선택
2. 키 파일을 `backend/google-cloud-key.json`으로 저장
3. **⚠️ 보안**: 키 파일을 Git에 커밋하지 마세요!

## 3. 환경 변수 설정

### 3.1 프론트엔드 환경 변수 (.env)
```env
# Google Cloud Veo2 API 설정 (필수)
REACT_APP_GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
REACT_APP_GOOGLE_CLOUD_LOCATION=us-central1
REACT_APP_VEO2_API_URL=https://us-central1-aiplatform.googleapis.com

# 백엔드 API 설정
REACT_APP_BACKEND_URL=http://localhost:5001
REACT_APP_FRONTEND_URL=http://localhost:3002

# Google OAuth 설정
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# 파일 업로드 설정
REACT_APP_MAX_FILE_SIZE=104857600
REACT_APP_ALLOWED_VIDEO_FORMATS=video/mp4,video/avi,video/mov,video/wmv
```

### 3.2 백엔드 환경 변수 (backend/.env)
```env
# 서버 설정
PORT=5001
NODE_ENV=development

# Google Cloud Veo2 API 설정
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json

# 데이터베이스 설정
MONGODB_URI=mongodb://localhost:27017/filmWithAi

# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here

# 파일 업로드 설정
MAX_FILE_SIZE=104857600
UPLOAD_PATH=./uploads

# 보안 설정
CORS_ORIGIN=http://localhost:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 4. Veo2 API 사용법

### 4.1 기본 요청 구조
```javascript
// Veo2 API 요청 예제
const requestData = {
  instances: [
    {
      prompt: "영화적인 장면: 밤하늘의 별들이 반짝이는 로맨틱한 분위기"
    }
  ],
  parameters: {
    durationSeconds: 8,
    sampleCount: 1,
    aspectRatio: "16:9",
    personGeneration: "allow_adult",
    enhancePrompt: true
  }
}
```

### 4.2 지원되는 파라미터
- **durationSeconds**: 5-8초 (기본값: 8)
- **sampleCount**: 1-4개 비디오 생성
- **aspectRatio**: "16:9" (가로) 또는 "9:16" (세로)
- **personGeneration**: "allow_adult" (기본값) 또는 "disallow"
- **enhancePrompt**: true/false (프롬프트 자동 개선)

### 4.3 프롬프트 작성 팁
- 구체적이고 상세한 설명 사용
- 촬영 기법, 조명, 분위기 포함
- 영화적 품질 강조
- 예시: "밝은 네온사인이 있는 분주한 미래지향적인 도쿄 도시의 밤 거리가 비치는 물웅덩이를 극단적으로 클로즈업하고 얕은 피사계 심도와 렌즈 플레어를 적용해 줘"

## 5. 비용 및 제한사항

### 5.1 비용
- Veo2는 사용량 기반 과금
- 비디오 길이와 생성 개수에 따라 비용 계산
- Google Cloud 콘솔에서 사용량 모니터링 가능

### 5.2 제한사항
- 최대 비디오 길이: 8초
- 최대 생성 개수: 요청당 4개
- 지원 지역: us-central1
- 이미지 입력: 1280x720 또는 720x1280 권장

## 6. 문제 해결

### 6.1 일반적인 오류
- **401 Unauthorized**: 서비스 계정 키 파일 확인
- **403 Forbidden**: API 활성화 및 권한 확인
- **400 Bad Request**: 요청 파라미터 형식 확인

### 6.2 디버깅
```bash
# API 활성화 상태 확인
gcloud services list --enabled --filter="name:aiplatform"

# 서비스 계정 권한 확인
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

## 7. 보안 고려사항

### 7.1 키 파일 보안
- 서비스 계정 키를 Git에 커밋하지 마세요
- 프로덕션에서는 환경 변수나 Secret Manager 사용
- 정기적으로 키 로테이션 수행

### 7.2 API 사용량 제한
- Rate limiting 설정으로 API 남용 방지
- 사용량 모니터링 및 알림 설정

## 8. 추가 리소스

- [Veo2 공식 문서](https://cloud.google.com/vertex-ai/docs/generative-ai/video/veo)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vertex AI API 참조](https://cloud.google.com/vertex-ai/docs/reference/rest) 