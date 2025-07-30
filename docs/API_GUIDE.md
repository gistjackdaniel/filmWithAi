# SceneForge API 사용법 가이드

## 📋 개요

SceneForge는 영화 제작을 위한 종합 관리 시스템입니다. 이 문서는 SceneForge API의 사용법을 설명합니다.

## 🔗 기본 정보

- **Base URL**: `http://localhost:5001/api`
- **Swagger 문서**: `http://localhost:5001/docs`
- **인증 방식**: Bearer Token (JWT)

## 🔐 인증

### 1. Google OAuth 로그인

```http
POST /api/auth/login
Content-Type: application/json

{
  "access_token": "google_oauth_access_token"
}
```

**응답 예시:**
```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "user": {
    "profileId": "user_id",
    "email": "user@example.com",
    "name": "사용자 이름"
  }
}
```

### 2. 토큰 갱신

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "jwt_refresh_token"
}
```

## 📁 프로젝트 관리

### 프로젝트 생성

```http
POST /api/project
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "프로젝트 제목",
  "description": "프로젝트 설명",
  "genre": "액션",
  "targetLength": 120
}
```

### 프로젝트 목록 조회

```http
GET /api/project
Authorization: Bearer {access_token}
```

### 프로젝트 상세 조회

```http
GET /api/project/{projectId}
Authorization: Bearer {access_token}
```

### 프로젝트 수정

```http
PATCH /api/project/{projectId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "수정된 제목",
  "description": "수정된 설명"
}
```

### 프로젝트 삭제

```http
DELETE /api/project/{projectId}
Authorization: Bearer {access_token}
```

## 🎬 씬 관리

### 씬 생성

```http
POST /api/project/{projectId}/scene
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "씬 제목",
  "description": "씬 설명",
  "location": "실내",
  "timeOfDay": "낮",
  "estimatedDuration": 5
}
```

### 씬 목록 조회

```http
GET /api/project/{projectId}/scene
Authorization: Bearer {access_token}
```

### 씬 상세 조회

```http
GET /api/project/{projectId}/scene/{sceneId}
Authorization: Bearer {access_token}
```

### 씬 수정

```http
PUT /api/project/{projectId}/scene/{sceneId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "수정된 씬 제목",
  "description": "수정된 씬 설명"
}
```

### 씬 삭제

```http
DELETE /api/project/{projectId}/scene/{sceneId}
Authorization: Bearer {access_token}
```

## 🎞️ 컷 관리

### 컷 생성

```http
POST /api/project/{projectId}/scene/{sceneId}/cut
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "컷 제목",
  "description": "컷 설명",
  "shotType": "클로즈업",
  "cameraAngle": "정면",
  "estimatedDuration": 3
}
```

### 컷 목록 조회

```http
GET /api/project/{projectId}/scene/{sceneId}/cut
Authorization: Bearer {access_token}
```

### 컷 상세 조회

```http
GET /api/project/{projectId}/scene/{sceneId}/cut/{cutId}
Authorization: Bearer {access_token}
```

### 컷 수정

```http
PUT /api/project/{projectId}/scene/{sceneId}/cut/{cutId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "수정된 컷 제목",
  "description": "수정된 컷 설명"
}
```

### 컷 삭제

```http
DELETE /api/project/{projectId}/scene/{sceneId}/cut/{cutId}
Authorization: Bearer {access_token}
```

### AI 컷 이미지 생성

```http
POST /api/project/{projectId}/scene/{sceneId}/cut/{cutId}/generate-image
Authorization: Bearer {access_token}
```

### 이미지 업로드

```http
POST /api/project/{projectId}/scene/{sceneId}/cut/{cutId}/upload-image
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [이미지 파일]
```

## 📅 스케줄링

### 스케줄러 생성

```http
POST /api/project/{projectId}/scheduler
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "스케줄러 제목",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

### 스케줄러 목록 조회

```http
GET /api/project/{projectId}/scheduler
Authorization: Bearer {access_token}
```

### 스케줄러 상세 조회

```http
GET /api/project/{projectId}/scheduler/{schedulerId}
Authorization: Bearer {access_token}
```

### 스케줄러 수정

```http
PUT /api/project/{projectId}/scheduler/{schedulerId}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "title": "수정된 스케줄러 제목",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 스케줄러 삭제

```http
DELETE /api/project/{projectId}/scheduler/{schedulerId}
Authorization: Bearer {access_token}
```

## 👤 프로필 관리

### 프로필 조회

```http
GET /api/profile
Authorization: Bearer {access_token}
```

### 즐겨찾기 추가

```http
POST /api/profile/project/{projectId}/favorite
Authorization: Bearer {access_token}
```

### 즐겨찾기 삭제

```http
DELETE /api/profile/project/{projectId}/favorite
Authorization: Bearer {access_token}
```

## 🚨 에러 코드

### 일반적인 HTTP 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

### 에러 응답 형식

```json
{
  "error": "에러 타입",
  "message": "에러 메시지",
  "statusCode": 400
}
```

## 📝 사용 예시

### 1. 프로젝트 생성 및 씬 추가

```javascript
// 1. 로그인
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: 'google_token' })
});
const { access_token } = await loginResponse.json();

// 2. 프로젝트 생성
const projectResponse = await fetch('/api/project', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '새 영화',
    description: '액션 영화',
    genre: '액션',
    targetLength: 120
  })
});
const project = await projectResponse.json();

// 3. 씬 생성
const sceneResponse = await fetch(`/api/project/${project._id}/scene`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '첫 번째 씬',
    description: '주인공 등장',
    location: '실내',
    timeOfDay: '낮',
    estimatedDuration: 5
  })
});
const scene = await sceneResponse.json();
```

### 2. 컷 생성 및 이미지 생성

```javascript
// 1. 컷 생성
const cutResponse = await fetch(`/api/project/${projectId}/scene/${sceneId}/cut`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '클로즈업',
    description: '주인공 얼굴 클로즈업',
    shotType: '클로즈업',
    cameraAngle: '정면',
    estimatedDuration: 3
  })
});
const cut = await cutResponse.json();

// 2. AI 이미지 생성
const imageResponse = await fetch(`/api/project/${projectId}/scene/${sceneId}/cut/${cut._id}/generate-image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const imageUrl = await imageResponse.text();
```

## 🔧 개발 환경 설정

### 환경 변수

```bash
# .env 파일
PORT=5001
MONGODB_URI=mongodb://localhost:27017/sceneforge
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3002
```

### 서버 실행

```bash
# 백엔드 서버
cd sceneforge-nestjs
npm run start:dev

# 프론트엔드 서버
cd frontend
npm run dev
```

## 📚 추가 리소스

- [Swagger 문서](http://localhost:5001/docs)
- [프론트엔드 애플리케이션](http://localhost:3002)
- [GitHub 저장소](https://github.com/gistjackdaniel/filmWithAi) 