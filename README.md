# SceneForge - AI 영화 제작 타임라인 툴

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-8.16.3-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/OpenAI-GPT4o-purple?style=for-the-badge&logo=openai" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Google-OAuth2-red?style=for-the-badge&logo=google" alt="Google OAuth" />
</div>

## 📖 프로젝트 개요

SceneForge는 시놉시스를 입력하면 AI가 자동으로 스토리와 콘티를 생성하고, 이를 실사 촬영용과 AI 생성 비디오로 분류하여 타임라인 형태로 시각화하는 웹 애플리케이션입니다.

### 🎯 핵심 가치 제안
⚙️ **자동화**: (시놉시스) → 스토리 → 콘티 자동 생성 
🧠 **분류**: 콘티 → 실사 촬영/AI 생성용 캡션카드 자동 분류 
📊 **시각화**: 직관적인 타임라인 UI  
🤝 **협업**: 사용자별 프로젝트 저장 및 관리 (ver.2에서는 한 프로젝트에 여러 사람 참여 기능 추가 예정)
💨 **스피드**: 각 콘티의 그래프 기반 최적화를 통해 가장 효율적인 촬영 순서 결정
♊️ **동시성**: AI 생성용 캡션카드가 편집되는 동안 실사 촬영 씬 촬영 가능 (ver.2 예정)

### 👥 타겟 사용자
- **주 타겟**: 독립 영화 제작자, 학생 영화 제작팀
- **부 타겟**: 콘텐츠 크리에이터, 영화 기획자

## 🚀 주요 기능

### 1. 사용자 인증
- Google OAuth 2.0 로그인
- 사용자별 프로젝트 데이터 분리
- 로그인 상태 유지

### 2. AI 스토리 생성
- 시놉시스 입력 폼 (최대 1000자)
- OpenAI GPT-4o API 활용한 스토리 자동 생성
- 생성 중 로딩 상태 표시

### 3. AI 콘티 생성
- 스토리 기반 콘티 자동 생성
- 실사 촬영용/AI 생성 비디오 자동 분류
- 12개 구성요소 포함 (대사, 카메라 앵글, 조명 등)

### 4. 캡션 카드 시스템
- **기본 구성요소(12개)**: 상황 설명, 대사, 카메라 앵글, 카메라 워크, 인물 배치, 소품, 날씨, 조명, 시각적 설명, 전환, 렌즈 사양, 시각효과 등
- **확장 필드**: 키워드 노드(등장인물, 로케이션, 날짜, 장비, 시간대, 특별 요구사항 등), 스케줄링 정보(카메라 상세, 필요 인력, 장비 목록, 촬영 설정, 복잡도 등), 그래프 가중치(장소, 장비, 배우, 시간, 복잡도별 우선순위)
- **노드 재정의**: 사용자가 노드 요소들을 자유롭게 수정 가능
- **그래프 관계성**: 같은 유저, 장소, 날짜별 캡션카드 그룹화
- **편집 권한**: 생성형 AI 영상 재생성 및 실사 촬영 콘티 수정

### 5. 타임라인 시각화
- 수평 스크롤 타임라인
- 씬별 카드 형태 표시
- 드래그 앤 드롭으로 순서 변경
- 시간 기반 타임라인 (줌 레벨 지원)
- 실시간 스크롤 네비게이션
- AI 생성 영상과 실사 촬영 콘티 분류 표시
- **AI 생성 영상**: 타임라인에 영상 형태로 표시 (ver.2 예정)
- **실사 촬영 콘티**: 캡션카드 형태로 표시

### 6. 프로젝트 관리
- MongoDB에 사용자별 데이터 저장
- 프로젝트 제목, 시놉시스, 스토리, 콘티 리스트 저장
- 사용자별 프로젝트 목록 표시

### 7. 스케줄링 기능
- 촬영 일정 관리
- 인력 및 장비 요구사항 관리
- 타임라인과 연동된 스케줄 뷰
- 일일 촬영 스케줄 표 자동 생성
- 브레이크다운 표 (촬영 요소 정리) 자동 생성
- **그래프 최적화**: 가중치 기반 최적 촬영 스케줄 계산
- **자동 그룹화**: 같은 장소, 장비, 날짜별 촬영 일정 최적화

## 🛠️ 기술 스택

### Frontend
- **React 18.2.0** - 사용자 인터페이스
- **Vite** - 빌드 도구 및 개발 서버
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **Zustand** - 상태 관리
- **React Router DOM** - 클라이언트 사이드 라우팅
- **@dnd-kit** - 드래그 앤 드롭 기능
- **Axios** - HTTP 클라이언트
- **React Hook Form** - 폼 관리
- **React Hot Toast** - 알림 시스템

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **MongoDB** - 데이터베이스
- **Mongoose** - ODM (Object Document Mapper)
- **Socket.io** - 실시간 통신
- **JWT** - 인증 토큰
- **Helmet** - 보안 미들웨어
- **CORS** - 크로스 오리진 리소스 공유

### AI & 외부 서비스
- **OpenAI GPT-4o** - 스토리 및 콘티 생성
- **Google OAuth 2.0** - 사용자 인증
- **MongoDB Atlas** - 클라우드 데이터베이스

### 개발 도구
- **ESLint** - 코드 품질 관리
- **Nodemon** - 개발 서버 자동 재시작
- **Dotenv** - 환경 변수 관리

## 📁 프로젝트 구조

```
filmWithAi/
├── 📁 src/                          # 프론트엔드 소스 코드
│   ├── 📁 components/               # React 컴포넌트
│   │   ├── 📁 StoryGeneration/     # 스토리 생성 관련 컴포넌트
│   │   ├── 📁 timeline/            # 타임라인 관련 컴포넌트
│   │   │   ├── 📁 atoms/           # 기본 UI 컴포넌트
│   │   │   │   ├── SceneCard.jsx   # 캡션 카드 컴포넌트
│   │   │   │   ├── TimelineScroll.jsx # 타임라인 스크롤
│   │   │   │   ├── TimeRuler.jsx   # 시간 눈금
│   │   │   │   └── TimeDisplay.jsx # 시간 정보 표시
│   │   │   ├── 📁 molecules/       # 복합 UI 컴포넌트
│   │   │   │   ├── TimelineFilters.jsx # 타임라인 필터
│   │   │   │   ├── TimelineNavigation.jsx # 타임라인 네비게이션
│   │   │   │   └── ZoomControls.jsx # 줌 컨트롤
│   │   │   └── 📁 organisms/       # 완전한 기능 컴포넌트
│   │   │       └── TimelineViewer.jsx # 타임라인 뷰어
│   │   └── 📁 ...                  # 기타 공통 컴포넌트
│   ├── 📁 pages/                   # 페이지 컴포넌트
│   ├── 📁 stores/                  # Zustand 상태 관리
│   ├── 📁 services/                # API 서비스
│   ├── 📁 utils/                   # 유틸리티 함수
│   │   └── timelineUtils.js        # 타임라인 유틸리티
│   ├── 📁 types/                   # TypeScript 타입 정의
│   │   └── timeline.js             # 타임라인 타입 정의
│   ├── 📁 theme/                   # 디자인 시스템
│   ├── vite.config.js              # Vite 설정
│   ├── tsconfig.json               # TypeScript 설정
│   ├── .eslintrc.js                # ESLint 설정
│   └── index.html                  # HTML 엔트리 포인트
├── 📁 backend/                      # 백엔드 소스 코드
│   ├── 📁 models/                  # MongoDB 스키마
│   │   ├── User.js                 # 사용자 스키마
│   │   ├── Project.js              # 프로젝트 스키마
│   │   └── Conte.js                # 캡션 카드 스키마
│   ├── 📁 routes/                  # API 라우트
│   │   ├── auth.js                 # 인증 라우트
│   │   ├── projects.js             # 프로젝트 라우트
│   │   ├── contes.js               # 콘티 라우트
│   │   └── timeline.js             # 타임라인 라우트
│   ├── 📁 middleware/              # Express 미들웨어
│   ├── 📁 services/                # 비즈니스 로직
│   │   ├── analyticsService.js     # 분석 서비스
│   │   ├── imageService.js         # 이미지 서비스
│   │   ├── monitoringService.js    # 모니터링 서비스
│   │   └── realtimeService.js     # 실시간 서비스
│   ├── 📁 config/                  # 설정 파일
│   ├── 📁 uploads/                 # 업로드된 파일
│   ├── 📁 scripts/                 # 유틸리티 스크립트
│   ├── env.example                 # 환경 변수 예시
│   └── server.js                   # Express 서버
├── 📁 docs/                        # 프로젝트 문서
│   ├── 📁 PRD/                     # 제품 요구사항 문서
│   ├── 📁 API/                     # API 문서
│   ├── 📁 UI/                      # UI/UX 문서
│   └── 📁 Development/             # 개발 가이드
├── package.json                     # 프로젝트 전체 설정
├── package-lock.json               # 의존성 잠금 파일
├── .gitignore                      # Git 무시 파일
└── README.md                       # 프로젝트 문서
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: `#3498DB` - 밝고 현대적인 블루
- **Accent**: `#D4AF37` - 고급스러운 골드 (CTA용)
- **Background**: `#1B1B1E` - 영상과 콘티가 돋보이는 무채색 톤
- **Secondary BG**: `#2F2F37` - 카드, 패널용 중간톤 회색
- **Text Primary**: `#F5F5F5` - 부드러운 흰색
- **Text Secondary**: `#A0A3B1` - 부제목, 설명 텍스트

### 타이포그래피
- **기본 폰트**: Inter (Google Fonts)
- **제목**: 24px, Bold (700)
- **부제목**: 20px, Medium (500)
- **본문**: 16px, Regular (400)
- **버튼**: 14px, Medium (500)
- **캡션**: 12px, Regular (400)

## 🚀 시작하기

### 필수 요구사항
- Node.js 16.0.0 이상
- MongoDB 데이터베이스
- OpenAI API 키
- Google OAuth 클라이언트 ID

### 환경 설정

1. **저장소 클론**
```bash
git clone <repository-url>
cd filmWithAi
```

2. **환경 변수 설정**
```bash
# 백엔드 디렉토리에 .env 파일 생성
cp backend/env.example backend/.env
```

3. **의존성 설치**
```bash
# 모든 의존성 한 번에 설치
npm run install:all

# 또는 개별 설치
npm run frontend:install    # 프론트엔드 의존성
npm run backend:install     # 백엔드 의존성
```

4. **환경 변수 구성**
```env
# 프론트엔드 (.env)
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# 백엔드 (.env)
PORT=5001
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
```

### 개발 서버 실행

1. **모든 서버 한 번에 시작**
```bash
npm run dev:all
```

2. **개별 서버 시작**
```bash
# 백엔드 서버만
npm run backend:dev

# 프론트엔드 서버만
npm run dev
```

3. **브라우저에서 접속**
- 프론트엔드: http://localhost:3002
- 백엔드 API: http://localhost:5001

## 📊 데이터베이스 스키마

### User Schema
```javascript
{
  _id: ObjectId,
  googleId: String,
  email: String,
  name: String,
  picture: String,
  createdAt: Date
}
```

### Project Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  projectTitle: String,
  synopsis: String,
  story: String,
  status: String, // draft, story_ready, conte_ready, production_ready
  settings: {
    genre: String,
    maxScenes: Number,
    estimatedDuration: String
  },
  tags: [String],
  isPublic: Boolean,
  isFavorite: Boolean,
  isDeleted: Boolean,
  lastViewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Conte Schema (캡션 카드)
```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  scene: Number,
  title: String,
  
  // 12개 구성요소
  description: String,        // 인물들이 처한 상황에 대한 대략적인 설명
  dialogue: String,          // 해당 장면을 대표하는 대사
  cameraAngle: String,       // 카메라/그림 앵글과 구도를 설명하는 배치도
  cameraWork: String,        // 카메라 워크 및 그림의 장면 전환을 설명하는 화살표들
  characterLayout: String,   // 인물 배치도와 인물의 동선을 설명하는 화살표
  props: String,            // 소품 배치
  weather: String,          // 날씨와 지형
  lighting: String,         // 조명
  visualDescription: String, // 각 장면과 시퀸스를 직관적으로 이해시킬 대표적인 그림 설명
  transition: String,       // 장면, 시퀀스의 전환점
  lensSpecs: String,        // 렌즈 길이, 요구되는 카메라의 특성 등 촬영 방식
  visualEffects: String,    // 사용할 그래픽 툴, 넣어야하는 시각효과
  
  // 콘티 타입
  type: String,             // "generated_video" or "live_action"
  estimatedDuration: String,
  
  // AI 생성 이미지
  imageUrl: String,
  imagePrompt: String,
  imageGeneratedAt: Date,
  imageModel: String,
  
  // 키워드 노드 (그래프 구조)
  keywords: {
    userInfo: String,       // 사용자 정보
    location: String,       // 로케이션
    date: String,          // 날짜
    characters: [String],   // 등장인물
    equipment: [String],    // 장비
    props: [String],       // 소품
    lighting: [String],    // 조명
    weather: [String],     // 날씨
    camera: [String],      // 카메라 정보
    effects: [String]      // 시각효과
  },
  
  // 가중치 (그래프 최적화용)
  weights: {
    locationWeight: Number,    // 장소 가중치
    dateWeight: Number,        // 날짜 가중치
    equipmentWeight: Number,   // 장비 가중치
    personnelWeight: Number,   // 인력 가중치
    timeWeight: Number,        // 시간 가중치
    priorityWeight: Number     // 우선순위 가중치
  },
  
  // 스케줄링 정보
  requiredPersonnel: String,   // 필요 인력
  requiredEquipment: String,   // 필요 장비
  camera: String,             // 카메라 정보
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 주요 API 엔드포인트

### 인증
- `POST /api/auth/google` - Google OAuth 로그인
- `GET /api/auth/verify` - 토큰 검증

### 프로젝트
- `GET /api/projects` - 사용자 프로젝트 목록
- `POST /api/projects` - 새 프로젝트 생성
- `GET /api/projects/:id` - 프로젝트 상세 정보
- `PUT /api/projects/:id` - 프로젝트 수정
- `DELETE /api/projects/:id` - 프로젝트 삭제

### 콘티
- `GET /api/projects/:id/contes` - 프로젝트 콘티 목록
- `POST /api/projects/:id/contes` - 새 콘티 생성
- `PUT /api/projects/:id/contes/:conteId` - 콘티 수정
- `DELETE /api/projects/:id/contes/:conteId` - 콘티 삭제

### AI 생성
- `POST /api/story/generate` - AI 스토리 생성
- `POST /api/conte/generate` - AI 콘티 생성
- `POST /api/image/generate` - AI 이미지 생성

### 캡션 카드 관리
- `GET /api/projects/:id/contes/:conteId/keywords` - 키워드 노드 조회
- `PUT /api/projects/:id/contes/:conteId/keywords` - 키워드 노드 수정
- `GET /api/projects/:id/contes/:conteId/weights` - 가중치 조회
- `PUT /api/projects/:id/contes/:conteId/weights` - 가중치 수정

### 스케줄링
- `POST /api/projects/:id/schedule/optimize` - 그래프 최적화 기반 스케줄 생성
- `GET /api/projects/:id/schedule/daily` - 일일 촬영 스케줄 조회
- `GET /api/projects/:id/schedule/breakdown` - 브레이크다운 표 조회
- `GET /api/projects/:id/schedule/graph` - 그래프 관계성 조회

## 🎯 사용자 플로우

1. **로그인**: Google OAuth로 로그인
2. **시놉시스 입력**: 영화 시놉시스 입력
3. **스토리 생성**: AI가 시놉시스 기반 스토리 생성
4. **콘티 생성**: AI가 스토리 기반 콘티 생성 및 분류
5. **캡션 카드 편집**: 12개 구성요소와 키워드 노드 수정
6. **타임라인 확인**: 분류된 콘티를 타임라인에서 확인
   - AI 생성 영상: 타임라인에 영상 형태로 표시
   - 실사 촬영 콘티: 캡션카드 형태로 표시
7. **그래프 최적화**: 가중치 기반 촬영 스케줄 자동 생성
8. **스케줄 확인**: 일일 촬영 스케줄 및 브레이크다운 표 확인
9. **프로젝트 저장**: 자동 저장 또는 수동 저장

## 🔒 보안 기능

- **Helmet.js**: 보안 헤더 설정
- **Rate Limiting**: API 요청 제한
- **CORS**: 크로스 오리진 리소스 공유 설정
- **SQL Injection Protection**: SQL 인젝션 방지
- **JWT 토큰**: 안전한 인증
- **환경 변수**: 민감한 정보 보호

## 📈 성능 최적화

- **가상 스크롤링**: 대용량 타임라인 데이터 처리
- **이미지 최적화**: 업로드된 이미지 압축 및 리사이징
- **캐싱**: API 응답 캐싱
- **지연 로딩**: 컴포넌트 지연 로딩
- **메모이제이션**: React 컴포넌트 최적화
- **그래프 최적화**: 가중치 기반 스케줄링 알고리즘
- **노드 관계성 캐싱**: 키워드 노드 간 관계성 미리 계산

## 🧪 테스트

```bash
# 프론트엔드 테스트
npm test

# 백엔드 테스트
cd backend
npm test
```

## 📝 개발 가이드

### 코드 스타일
- ESLint 규칙 준수
- Prettier 포맷팅
- 컴포넌트별 파일 분리
- TypeScript 타입 정의

### 커밋 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 🤝 커밋하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처
ryujuhyeongg@gmail.com (류주형)
프로젝트 관련 문의사항이 있으시면 이슈를 생성해 주세요.

---

**SceneForge Team** - AI 영화 제작의 미래를 만들어갑니다 🎬 
