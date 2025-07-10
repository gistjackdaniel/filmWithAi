# SceneForge API 명세서

## 개요
이 문서는 SceneForge 백엔드 API의 엔드포인트와 데이터 구조를 정의합니다.

## 1. 기본 정보

### 1.1 API 기본 정보
- **Base URL**: `http://localhost:3001/api` (개발 환경)
- **Content-Type**: `application/json`
- **인증 방식**: JWT Bearer Token
- **응답 형식**: JSON

### 1.2 공통 응답 형식
```json
{
  "success": true,
  "data": {},
  "message": "성공적으로 처리되었습니다.",
  "error": null
}
```

### 1.3 에러 응답 형식
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "error": {
    "code": "ERROR_CODE",
    "details": "상세 에러 정보"
  }
}
```

## 2. 인증 API

### 2.1 Google OAuth 로그인
**POST** `/auth/google`

**요청 본문**:
```json
{
  "credential": "google_oauth_credential_token",
  "clientId": "google_client_id"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "googleId": "google_user_id",
      "email": "user@example.com",
      "name": "사용자 이름",
      "profileImage": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_string"
  },
  "message": "로그인 성공"
}
```

### 2.2 토큰 검증
**GET** `/auth/verify`

**헤더**:
```
Authorization: Bearer jwt_token
```

**응답**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "사용자 이름"
    }
  },
  "message": "토큰이 유효합니다"
}
```

### 2.3 로그아웃
**POST** `/auth/logout`

**헤더**:
```
Authorization: Bearer jwt_token
```

**응답**:
```json
{
  "success": true,
  "data": null,
  "message": "로그아웃 성공"
}
```

## 3. 프로젝트 API

### 3.1 프로젝트 목록 조회
**GET** `/projects`

**헤더**:
```
Authorization: Bearer jwt_token
```

**응답**:
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "project_id",
        "projectTitle": "영화 제목",
        "synopsis": "시놉시스 내용",
        "story": "스토리 내용",
        "conteList": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "프로젝트 목록 조회 성공"
}
```

### 3.2 프로젝트 생성
**POST** `/projects`

**헤더**:
```
Authorization: Bearer jwt_token
```

**요청 본문**:
```json
{
  "projectTitle": "영화 제목",
  "synopsis": "시놉시스 내용"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "project_id",
      "projectTitle": "영화 제목",
      "synopsis": "시놉시스 내용",
      "story": "",
      "conteList": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "프로젝트 생성 성공"
}
```

### 3.3 프로젝트 조회
**GET** `/projects/:projectId`

**헤더**:
```
Authorization: Bearer jwt_token
```

**응답**:
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "project_id",
      "projectTitle": "영화 제목",
      "synopsis": "시놉시스 내용",
      "story": "스토리 내용",
      "conteList": [
        {
          "scene": 1,
          "description": "씬 설명",
          "type": "generated_video",
          "details": "상세 정보"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "프로젝트 조회 성공"
}
```

### 3.4 프로젝트 업데이트
**PUT** `/projects/:projectId`

**헤더**:
```
Authorization: Bearer jwt_token
```

**요청 본문**:
```json
{
  "projectTitle": "수정된 영화 제목",
  "synopsis": "수정된 시놉시스",
  "story": "수정된 스토리",
  "conteList": [
    {
      "scene": 1,
      "description": "씬 설명",
      "type": "generated_video",
      "details": "상세 정보"
    }
  ]
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "project_id",
      "projectTitle": "수정된 영화 제목",
      "synopsis": "수정된 시놉시스",
      "story": "수정된 스토리",
      "conteList": [...],
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "프로젝트 업데이트 성공"
}
```

### 3.5 프로젝트 삭제
**DELETE** `/projects/:projectId`

**헤더**:
```
Authorization: Bearer jwt_token
```

**응답**:
```json
{
  "success": true,
  "data": null,
  "message": "프로젝트 삭제 성공"
}
```

## 4. AI 생성 API

### 4.1 스토리 생성
**POST** `/ai/generate-story`

**헤더**:
```
Authorization: Bearer jwt_token
```

**요청 본문**:
```json
{
  "synopsis": "시놉시스 내용",
  "projectId": "project_id"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "story": "AI가 생성한 스토리 내용...",
    "projectId": "project_id"
  },
  "message": "스토리 생성 성공"
}
```

### 4.2 콘티 생성
**POST** `/ai/generate-conte`

**헤더**:
```
Authorization: Bearer jwt_token
```

**요청 본문**:
```json
{
  "story": "스토리 내용",
  "projectId": "project_id"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "conteList": [
      {
        "scene": 1,
        "description": "씬 1 설명",
        "type": "generated_video",
        "details": "AI 생성 비디오 상세 정보"
      },
      {
        "scene": 2,
        "description": "씬 2 설명",
        "type": "live_action",
        "details": "실사 촬영 정보 (장소, 장비 등)"
      }
    ],
    "projectId": "project_id"
  },
  "message": "콘티 생성 성공"
}
```

## 5. 에러 코드

### 5.1 인증 관련 에러
- `AUTH_REQUIRED`: 인증이 필요합니다
- `INVALID_TOKEN`: 유효하지 않은 토큰입니다
- `TOKEN_EXPIRED`: 토큰이 만료되었습니다
- `GOOGLE_AUTH_FAILED`: Google 인증에 실패했습니다

### 5.2 프로젝트 관련 에러
- `PROJECT_NOT_FOUND`: 프로젝트를 찾을 수 없습니다
- `PROJECT_ACCESS_DENIED`: 프로젝트 접근 권한이 없습니다
- `INVALID_PROJECT_DATA`: 유효하지 않은 프로젝트 데이터입니다

### 5.3 AI 생성 관련 에러
- `AI_GENERATION_FAILED`: AI 생성에 실패했습니다
- `OPENAI_API_ERROR`: OpenAI API 오류가 발생했습니다
- `GENERATION_TIMEOUT`: AI 생성 시간이 초과되었습니다

### 5.4 일반 에러
- `VALIDATION_ERROR`: 입력 데이터 검증에 실패했습니다
- `INTERNAL_SERVER_ERROR`: 서버 내부 오류가 발생했습니다
- `NETWORK_ERROR`: 네트워크 오류가 발생했습니다

## 6. 데이터 모델

### 6.1 User 모델
```javascript
{
  _id: ObjectId,
  googleId: String,
  email: String,
  name: String,
  profileImage: String,
  createdAt: Date,
  lastLoginAt: Date
}
```

### 6.2 Project 모델
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  projectTitle: String,
  synopsis: String,
  story: String,
  conteList: [{
    scene: Number,
    description: String,
    type: String, // "generated_video" or "live_action"
    details: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 7. API 사용 예시

### 7.1 전체 플로우 예시
```javascript
// 1. Google OAuth 로그인
const loginResponse = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credential, clientId })
});

// 2. 프로젝트 생성
const projectResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ projectTitle, synopsis })
});

// 3. AI 스토리 생성
const storyResponse = await fetch('/api/ai/generate-story', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ synopsis, projectId })
});

// 4. AI 콘티 생성
const conteResponse = await fetch('/api/ai/generate-conte', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ story, projectId })
});
```

## 8. 보안 고려사항

### 8.1 인증 및 권한
- 모든 API 요청에 JWT 토큰 필요
- 사용자별 데이터 접근 제한
- 프로젝트 소유자만 수정/삭제 가능

### 8.2 데이터 검증
- 입력 데이터 유효성 검사
- XSS 및 SQL Injection 방지
- 파일 업로드 보안 검사

### 8.3 API 제한
- Rate Limiting 적용
- 요청 크기 제한
- 타임아웃 설정

---

**문서 버전**: 1.0  
**작성일**: 2024년  
**작성자**: SceneForge 개발팀 