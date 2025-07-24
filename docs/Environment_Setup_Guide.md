# 환경 변수 설정 가이드

## 📁 파일 구조

```
filmWithAi/
├── .env                    # 프론트엔드 환경 변수
├── env.example            # 프론트엔드 환경 변수 예시
├── backend/
│   ├── .env              # 백엔드 환경 변수
│   └── env.example       # 백엔드 환경 변수 예시
```

## 🔧 설정 방법

### 1. 프론트엔드 환경 변수 설정

#### 루트 디렉토리에서:
```bash
# 프론트엔드 환경 변수 파일 생성
cp env.example .env
```

#### 프론트엔드 환경 변수 (.env):
```env
# ========================================
# 프론트엔드 환경 변수 (.env)
# ========================================

# Google Cloud Veo3 API 설정 (필수)
REACT_APP_GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
REACT_APP_GOOGLE_CLOUD_LOCATION=us-central1
REACT_APP_VEO3_API_URL=https://us-central1-aiplatform.googleapis.com

# 백엔드 API 설정
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_FRONTEND_URL=http://localhost:3002

# Google OAuth 설정
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# 파일 업로드 설정
REACT_APP_MAX_FILE_SIZE=104857600
REACT_APP_ALLOWED_VIDEO_FORMATS=video/mp4,video/avi,video/mov,video/wmv
```

### 2. 백엔드 환경 변수 설정

#### backend 디렉토리에서:
```bash
cd backend
cp env.example .env
```

#### 백엔드 환경 변수 (backend/.env):
```env
# ========================================
# 백엔드 환경 변수 (backend/.env)
# ========================================

# 서버 설정
PORT=3001
NODE_ENV=development

# Google Cloud Veo3 API 설정
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

## 🔑 환경 변수 설명

### 프론트엔드 환경 변수 (REACT_APP_ 접두사)

| 변수명 | 설명 | 예시 | 필수 여부 |
|--------|------|------|-----------|
| `REACT_APP_GOOGLE_CLOUD_PROJECT_ID` | Google Cloud 프로젝트 ID | `filmwithai-123456` | ✅ 필수 |
| `REACT_APP_GOOGLE_CLOUD_LOCATION` | Google Cloud 지역 | `us-central1` | ✅ 필수 |
| `REACT_APP_VEO3_API_URL` | Veo3 API 엔드포인트 | `https://us-central1-aiplatform.googleapis.com` | ✅ 필수 |
| `REACT_APP_BACKEND_URL` | 백엔드 서버 URL | `http://localhost:3001` | ✅ 필수 |
| `REACT_APP_FRONTEND_URL` | 프론트엔드 서버 URL | `http://localhost:3002` | ✅ 필수 |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `123456789-abc.apps.googleusercontent.com` | ✅ 필수 |
| `REACT_APP_MAX_FILE_SIZE` | 최대 파일 크기 (바이트) | `104857600` (100MB) | ❌ 선택 |
| `REACT_APP_ALLOWED_VIDEO_FORMATS` | 허용된 비디오 형식 | `video/mp4,video/avi,video/mov,video/wmv` | ❌ 선택 |

### 백엔드 환경 변수

| 변수명 | 설명 | 예시 | 필수 여부 |
|--------|------|------|-----------|
| `PORT` | 서버 포트 | `3001` | ❌ 선택 |
| `NODE_ENV` | Node.js 환경 | `development` | ❌ 선택 |
| `GOOGLE_CLOUD_PROJECT_ID` | Google Cloud 프로젝트 ID | `filmwithai-123456` | ✅ 필수 |
| `GOOGLE_CLOUD_LOCATION` | Google Cloud 지역 | `us-central1` | ✅ 필수 |
| `GOOGLE_CLOUD_KEY_FILE` | 서비스 계정 키 파일 경로 | `./google-cloud-key.json` | ✅ 필수 |
| `MONGODB_URI` | MongoDB 연결 문자열 | `mongodb://localhost:27017/filmWithAi` | ✅ 필수 |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `123456789-abc.apps.googleusercontent.com` | ✅ 필수 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 시크릿 | `GOCSPX-abc123` | ✅ 필수 |
| `JWT_SECRET` | JWT 토큰 시크릿 키 | `your-secret-key-here` | ✅ 필수 |
| `MAX_FILE_SIZE` | 최대 파일 크기 (바이트) | `104857600` (100MB) | ❌ 선택 |
| `UPLOAD_PATH` | 파일 업로드 경로 | `./uploads` | ❌ 선택 |
| `CORS_ORIGIN` | CORS 허용 오리진 | `http://localhost:3002` | ❌ 선택 |
| `RATE_LIMIT_WINDOW_MS` | Rate Limit 윈도우 (밀리초) | `900000` (15분) | ❌ 선택 |
| `RATE_LIMIT_MAX_REQUESTS` | Rate Limit 최대 요청 수 | `100` | ❌ 선택 |

## 🎯 Veo3 API 설정 상세 설명

### 필수 환경 변수

#### 1. `REACT_APP_GOOGLE_CLOUD_PROJECT_ID`
- **설명**: Google Cloud 프로젝트의 고유 ID
- **확인 방법**: Google Cloud Console → 프로젝트 정보
- **예시**: `filmwithai-123456`

#### 2. `REACT_APP_GOOGLE_CLOUD_LOCATION`
- **설명**: Veo3 API가 사용할 Google Cloud 지역
- **현재 지원**: `us-central1`만 지원
- **예시**: `us-central1`

#### 3. `REACT_APP_VEO3_API_URL`
- **설명**: Veo3 API의 기본 URL
- **고정값**: `https://us-central1-aiplatform.googleapis.com`
- **변경 불가**: Google Cloud에서 제공하는 고정 URL

### 설정 확인 방법

```bash
# 1. Google Cloud 프로젝트 ID 확인
gcloud config get-value project

# 2. Veo3 API 활성화 확인
gcloud services list --enabled --filter="name:aiplatform.googleapis.com"

# 3. 환경 변수 로드 확인
echo $REACT_APP_GOOGLE_CLOUD_PROJECT_ID
echo $REACT_APP_GOOGLE_CLOUD_LOCATION
echo $REACT_APP_VEO3_API_URL
```

## 🚀 설정 완료 확인

### 1. 프론트엔드 확인
```bash
# 루트 디렉토리에서
npm run dev
# http://localhost:3002 접속 확인
```

### 2. 백엔드 확인
```bash
# backend 디렉토리에서
npm start
# http://localhost:3001 접속 확인
```

### 3. 환경 변수 로드 확인
```javascript
// 프론트엔드에서
console.log(process.env.REACT_APP_GOOGLE_CLOUD_PROJECT_ID)
console.log(process.env.REACT_APP_GOOGLE_CLOUD_LOCATION)
console.log(process.env.REACT_APP_VEO3_API_URL)

// 백엔드에서
console.log(process.env.GOOGLE_CLOUD_PROJECT_ID)
console.log(process.env.GOOGLE_CLOUD_LOCATION)
```

## 🔒 보안 주의사항

### 1. 민감한 정보 보호
- `.env` 파일을 Git에 커밋하지 않음
- `.gitignore`에 `.env` 추가
- 프로덕션에서는 환경 변수로 관리

### 2. 키 파일 보안
```bash
# Google Cloud 서비스 계정 키 파일 권한 설정
chmod 600 backend/google-cloud-key.json
```

### 3. 환경별 설정
- **개발**: `NODE_ENV=development`
- **테스트**: `NODE_ENV=test`
- **프로덕션**: `NODE_ENV=production`

## 🛠️ 문제 해결

### 1. "REACT_APP_ 접두사 누락"
```bash
# 프론트엔드 환경 변수는 반드시 REACT_APP_ 접두사 필요
REACT_APP_GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

### 2. "환경 변수 로드 안됨"
```bash
# 서버 재시작
npm run dev  # 프론트엔드
npm start    # 백엔드
```

### 3. "Google Cloud 인증 실패"
```bash
# 서비스 계정 키 파일 경로 확인
ls -la backend/google-cloud-key.json
```

### 4. "Veo3 API 설정 오류"
```bash
# 필수 환경 변수 확인
echo $REACT_APP_GOOGLE_CLOUD_PROJECT_ID
echo $REACT_APP_GOOGLE_CLOUD_LOCATION
echo $REACT_APP_VEO3_API_URL

# 모든 값이 설정되어 있는지 확인
```

---

**참고**: 환경 변수는 애플리케이션 시작 시 로드되므로, 변경 후 반드시 서버를 재시작해야 합니다. 