# Google Cloud Veo3 API 설정 가이드

이 문서는 FilmWithAI 프로젝트에서 Google Cloud Veo3 API를 사용하기 위한 설정 방법을 설명합니다.

## 🎯 개요

Veo3는 Google Cloud의 최신 텍스트-투-비디오 생성 모델로, Sora보다 더 접근하기 쉬운 대안입니다.

### 주요 특징
- **최대 10초 영상 생성**
- **HD 품질 지원**
- **다양한 비율 지원** (16:9, 9:16, 1:1)
- **24fps, 30fps 지원**

## 🚀 설정 단계

### 1. Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID를 기록 (예: `my-film-project-123`)

### 2. Vertex AI API 활성화

1. Google Cloud Console에서 **API 및 서비스** > **라이브러리**로 이동
2. **Vertex AI API** 검색 후 활성화
3. **AI Platform API**도 함께 활성화

### 3. 서비스 계정 생성

1. **IAM 및 관리** > **서비스 계정**으로 이동
2. **서비스 계정 만들기** 클릭
3. 서비스 계정 이름 입력 (예: `veo3-api-service`)
4. **키 만들기** > **JSON** 선택하여 키 파일 다운로드

### 4. 권한 설정

서비스 계정에 다음 권한을 부여:
- `Vertex AI User`
- `Vertex AI Service Agent`
- `Service Account Token Creator`

### 5. 환경 변수 설정

#### 프론트엔드 (.env)
```bash
# Google Cloud Veo3 API 설정
REACT_APP_GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
REACT_APP_GOOGLE_CLOUD_LOCATION=us-central1
REACT_APP_VEO3_API_URL=https://us-central1-aiplatform.googleapis.com
```

#### 백엔드 (.env)
```bash
# Google Cloud 서비스 계정 키 파일 경로
GOOGLE_CLOUD_KEY_FILE=./google-cloud-key.json
```

### 6. 서비스 계정 키 파일 배치

1. 다운로드한 JSON 키 파일을 `backend/` 디렉토리에 `google-cloud-key.json`으로 저장
2. 파일 권한 설정: `chmod 600 google-cloud-key.json`

## 🔧 백엔드 설정

### 1. 의존성 설치

```bash
cd backend
npm install google-auth-library
```

### 2. 서버 재시작

```bash
npm start
```

## 🧪 테스트

### 1. API 연결 테스트

```bash
# 백엔드에서 토큰 생성 테스트
curl http://localhost:3001/api/auth/google-cloud-token
```

### 2. Veo3 API 테스트

프론트엔드에서 V1 타임라인의 컷을 V2로 드래그하여 AI 영상 생성 테스트

## 🔒 보안 고려사항

### 1. 키 파일 보안
- 서비스 계정 키 파일을 Git에 커밋하지 않음
- `.gitignore`에 `google-cloud-key.json` 추가
- 프로덕션에서는 환경 변수로 키 관리

### 2. API 사용량 모니터링
- Google Cloud Console에서 API 사용량 모니터링
- 비용 알림 설정
- 사용량 제한 설정

## 📊 비용 정보

### Veo3 API 가격 (2024년 기준)
- **SD 품질**: $0.10/초
- **HD 품질**: $0.20/초
- **최대 길이**: 10초

### 예상 비용
- 10초 HD 영상 1개: $2.00
- 100개 영상 생성: $200.00

## 🛠️ 문제 해결

### 일반적인 오류

#### 1. "Project ID not found"
```bash
# 해결 방법
# Google Cloud Console에서 프로젝트 ID 확인
# 환경 변수 REACT_APP_GOOGLE_CLOUD_PROJECT_ID 설정 확인
```

#### 2. "Authentication failed"
```bash
# 해결 방법
# 서비스 계정 키 파일 경로 확인
# 키 파일 권한 확인 (600)
# Vertex AI API 활성화 확인
```

#### 3. "API not enabled"
```bash
# 해결 방법
# Google Cloud Console에서 Vertex AI API 활성화
# AI Platform API 활성화
```

### 디버깅 팁

1. **백엔드 로그 확인**
```bash
cd backend
npm run dev
# 로그에서 인증 오류 확인
```

2. **브라우저 개발자 도구**
- Network 탭에서 API 요청 확인
- Console 탭에서 JavaScript 오류 확인

3. **Google Cloud Console**
- API 및 서비스 > 대시보드에서 사용량 확인
- 로그에서 API 호출 기록 확인

## 📚 추가 리소스

- [Veo3 공식 문서](https://cloud.google.com/vertex-ai/docs/generative-ai/video/veo3)
- [Google Cloud Vertex AI](https://cloud.google.com/vertex-ai)
- [Google Cloud 인증 가이드](https://cloud.google.com/docs/authentication)

## 🤝 지원

문제가 발생하면 다음을 확인하세요:
1. 이 가이드의 모든 단계를 완료했는지 확인
2. Google Cloud Console에서 API 활성화 상태 확인
3. 환경 변수 설정 확인
4. 서비스 계정 권한 확인

---

**참고**: Veo3 API는 베타 버전이므로 API 스펙이 변경될 수 있습니다. 최신 문서를 참조하세요. 