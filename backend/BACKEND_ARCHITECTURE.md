# SceneForge 백엔드 아키텍처

## 개요

SceneForge 백엔드는 Node.js, Express, MongoDB를 기반으로 한 RESTful API 서버입니다. AI 스토리 생성, 콘티 관리, 타임라인 시각화, 스케줄링 기능을 제공합니다.

## 기술 스택

- **런타임**: Node.js
- **웹 프레임워크**: Express.js
- **데이터베이스**: MongoDB (Mongoose ODM)
- **인증**: Google OAuth 2.0
- **AI 서비스**: OpenAI GPT-4o API
- **이미지 생성**: OpenAI DALL-E API
- **실시간 통신**: WebSocket (Socket.io)
- **보안**: Helmet, CORS, Rate Limiting

## 서버 구조

```
backend/
├── server.js              # 메인 서버 파일
├── config/
│   └── security.js        # 보안 설정
├── middleware/
│   └── security.js        # 보안 미들웨어
├── models/                # MongoDB 스키마
│   ├── User.js           # 사용자 모델
│   ├── Project.js        # 프로젝트 모델
│   └── Conte.js          # 콘티(캡션 카드) 모델
├── routes/                # API 라우터
│   ├── auth.js           # 인증 라우터
│   ├── users.js          # 사용자 관리
│   ├── projects.js       # 프로젝트 관리
│   ├── contes.js         # 콘티 관리
│   └── timeline.js       # 타임라인 WebSocket
├── services/              # 비즈니스 로직
│   ├── realtimeService.js # 실시간 서비스
│   ├── analyticsService.js # 분석 서비스
│   ├── monitoringService.js # 모니터링
│   └── imageService.js    # 이미지 처리
└── uploads/              # 업로드된 이미지
    └── images/
```

## API 엔드포인트

### 인증 (`/api/auth`)
- `POST /login` - Google OAuth 로그인
- `POST /logout` - 로그아웃
- `GET /profile` - 사용자 프로필 조회

### 사용자 관리 (`/api/users`)
- `GET /` - 사용자 목록
- `GET /:id` - 사용자 상세 정보
- `PUT /:id` - 사용자 정보 수정
- `DELETE /:id` - 사용자 삭제

### 프로젝트 관리 (`/api/projects`)
- `GET /` - 프로젝트 목록
- `POST /` - 프로젝트 생성
- `GET /:id` - 프로젝트 상세 정보
- `PUT /:id` - 프로젝트 수정
- `DELETE /:id` - 프로젝트 삭제

### 콘티 관리 (`/api/projects/:projectId/contes`)
- `GET /` - 콘티 목록
- `POST /` - 콘티 생성
- `GET /:id` - 콘티 상세 정보
- `PUT /:id` - 콘티 수정
- `DELETE /:id` - 콘티 삭제
- `POST /generate` - AI 콘티 생성
- `POST /generate-images` - 이미지 생성

### 타임라인 (`/api/timeline`)
- WebSocket 연결 - 실시간 타임라인 업데이트

### AI 스토리 생성 (`/api/story/generate`)
- `POST /` - AI 스토리 생성

## 데이터베이스 스키마

### User (사용자)
```javascript
{
  googleId: String,        // Google OAuth ID
  email: String,           // 이메일
  name: String,            // 이름
  picture: String,         // 프로필 이미지
  isActive: Boolean,       // 활성 상태
  lastLoginAt: Date,       // 마지막 로그인
  createdAt: Date,         // 생성일
  updatedAt: Date          // 수정일
}
```

### Project (프로젝트)
```javascript
{
  userId: ObjectId,        // 사용자 참조
  projectTitle: String,    // 프로젝트 제목
  synopsis: String,        // 시놉시스
  story: String,           // AI 생성 스토리
  status: String,          // 상태 (draft, story_ready, conte_ready, production_ready)
  settings: {              // 프로젝트 설정
    genre: String,
    maxScenes: Number,
    estimatedDuration: String
  },
  tags: [String],          // 태그
  isPublic: Boolean,       // 공개 여부
  isFavorite: Boolean,     // 즐겨찾기
  isDeleted: Boolean,      // 삭제 여부
  lastViewedAt: Date,      // 마지막 조회
  createdAt: Date,         // 생성일
  updatedAt: Date          // 수정일
}
```

### Conte (콘티/캡션 카드)
```javascript
{
  projectId: ObjectId,     // 프로젝트 참조
  scene: Number,           // 씬 번호
  title: String,           // 씬 제목
  
  // 12개 구성요소
  description: String,     // 설명
  dialogue: String,        // 대사
  cameraAngle: String,     // 카메라 앵글
  cameraWork: String,      // 카메라 워크
  characterLayout: String, // 캐릭터 레이아웃
  props: String,           // 소품
  weather: String,         // 날씨
  lighting: String,        // 조명
  visualDescription: String, // 시각적 설명
  transition: String,      // 전환
  lensSpecs: String,       // 렌즈 사양
  visualEffects: String,   // 시각 효과
  
  // 콘티 타입
  type: String,            // generated_video | live_action
  
  // 이미지 관련
  imageUrl: String,        // 이미지 URL
  imagePrompt: String,     // 이미지 생성 프롬프트
  imageGeneratedAt: Date,  // 이미지 생성 시간
  imageModel: String,      // 이미지 생성 모델
  isFreeTier: Boolean,     // 무료 티어 여부
  
  // 키워드 노드 (그래프 구조)
  keywords: {
    userInfo: String,      // 사용자 정보
    location: String,      // 장소
    date: String,          // 날짜
    equipment: String,     // 장비
    cast: [String],        // 배우
    props: [String],       // 소품
    lighting: String,      // 조명
    weather: String,       // 날씨
    timeOfDay: String,     // 시간대
    specialRequirements: [String] // 특별 요구사항
  },
  
  // 스케줄링 정보
  scheduling: {
    camera: {              // 카메라 정보
      model: String,
      lens: String,
      settings: String,
      movement: String
    },
    crew: {                // 인력 정보
      director: String,
      cinematographer: String,
      cameraOperator: String,
      lightingDirector: String,
      makeupArtist: String,
      costumeDesigner: String,
      soundEngineer: String,
      artDirector: String,
      additionalCrew: [String]
    },
    equipment: {           // 장비 정보
      cameras: [String],
      lenses: [String],
      lighting: [String],
      audio: [String],
      grip: [String],
      special: [String]
    },
    shooting: {            // 촬영 설정
      setupTime: Number,
      breakdownTime: Number,
      complexity: String,
      specialNeeds: [String]
    }
  },
  
  // 가중치 (최적화용)
  weights: {
    locationPriority: Number,
    equipmentPriority: Number,
    castPriority: Number,
    timePriority: Number,
    complexity: Number
  },
  
  // 권한 및 상태
  canEdit: Boolean,        // 편집 권한
  order: Number,           // 순서
  status: String,          // 상태 (draft, reviewed, approved, completed)
  lastModified: Date,      // 마지막 수정
  modifiedBy: String,      // 수정자
  createdAt: Date,         // 생성일
  updatedAt: Date          // 수정일
}
```

## 데이터베이스 관계 다이어그램

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      User       │    │     Project     │    │      Conte      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ _id             │    │ _id             │    │ _id             │
│ googleId        │    │ userId          │◄───┤ projectId       │
│ email           │    │ projectTitle    │    │ scene           │
│ name            │    │ synopsis        │    │ title           │
│ picture         │    │ story           │    │ description     │
│ isActive        │    │ status          │    │ dialogue        │
│ lastLoginAt     │    │ settings        │    │ cameraAngle     │
│ createdAt       │    │ tags            │    │ cameraWork      │
│ updatedAt       │    │ isPublic        │    │ characterLayout │
└─────────────────┘    │ isFavorite      │    │ props           │
                       │ isDeleted       │    │ weather         │
                       │ lastViewedAt    │    │ lighting        │
                       │ createdAt       │    │ visualDescription│
                       │ updatedAt       │    │ transition      │
                       └─────────────────┘    │ lensSpecs       │
                                              │ visualEffects   │
                                              │ type            │
                                              │ imageUrl        │
                                              │ imagePrompt     │
                                              │ keywords        │
                                              │ scheduling      │
                                              │ weights         │
                                              │ canEdit         │
                                              │ order           │
                                              │ status          │
                                              │ lastModified    │
                                              │ modifiedBy      │
                                              │ createdAt       │
                                              │ updatedAt       │
                                              └─────────────────┘
```

## 보안 기능

### 미들웨어
- **Helmet**: 보안 헤더 설정
- **CORS**: 크로스 오리진 리소스 공유
- **Rate Limiting**: 요청 제한
- **SQL Injection Protection**: SQL 인젝션 방지
- **Request Logging**: 요청 로깅

### 인증
- Google OAuth 2.0 기반 인증
- JWT 토큰 관리
- 세션 기반 인증

## 성능 최적화

### 데이터베이스
- 인덱스 최적화
- 가상 필드 활용
- 쿼리 최적화

### 캐싱
- 메모리 캐싱
- 정적 파일 캐싱

### 모니터링
- 실시간 성능 모니터링
- 에러 로깅
- 사용자 활동 분석

## 배포 환경

- **포트**: 5001 (기본)
- **환경 변수**: `.env` 파일 관리
- **정적 파일**: `/uploads` 디렉토리
- **로그**: 실시간 로그 스트리밍

## 개발 가이드

### 서버 시작
```bash
cd backend
npm install
npm start
```

### 환경 변수 설정
```bash
# .env 파일
MONGODB_URI=mongodb://localhost:27017/sceneforge_db
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
```

### API 테스트
```bash
# 스토리 생성 테스트
curl -X POST http://localhost:5001/api/story/generate \
  -H "Content-Type: application/json" \
  -d '{"synopsis": "테스트 시놉시스", "genre": "액션"}'
``` 