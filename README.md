# SceneForge - AI 영화 제작 타임라인 툴

AI가 자동으로 스토리와 콘티를 생성하고, 이를 실사 촬영용과 AI 생성 비디오로 분류하여 타임라인 형태로 시각화하는 웹 애플리케이션입니다.

## 🚀 주요 기능

- **Google OAuth 2.0 로그인**: 안전한 사용자 인증
- **AI 스토리 생성**: 시놉시스 기반 자동 스토리 생성
- **AI 콘티 생성**: 스토리 기반 자동 콘티 생성 및 분류
- **타임라인 시각화**: 직관적인 타임라인 UI
- **프로젝트 관리**: 사용자별 프로젝트 저장 및 관리

## 🛠️ 기술 스택

### Frontend
- **React.js** (Vite 기반)
- **Material-UI** (UI 라이브러리)
- **Zustand** (상태 관리)
- **React Router** (라우팅)
- **Axios** (HTTP 클라이언트)

### Backend (예정)
- **Node.js** (Express)
- **MongoDB** (데이터베이스)
- **OpenAI GPT-3.5 Turbo** (AI API)
- **Google OAuth 2.0** (인증)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 📁 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── SplashScreen.jsx
│   └── ProtectedRoute.jsx
├── pages/              # 페이지 컴포넌트
│   ├── LoginPage.jsx
│   ├── Dashboard.jsx
│   └── ProjectPage.jsx
├── stores/             # Zustand 상태 관리
│   └── authStore.js
├── services/           # API 서비스
│   └── api.js
├── theme/              # Material-UI 테마
│   └── theme.js
├── App.jsx             # 메인 앱 컴포넌트
├── main.jsx           # 앱 진입점
└── index.css          # 전역 스타일
```

## 🔧 개발 가이드

### 컴포넌트 추가
새로운 컴포넌트는 `src/components/` 디렉토리에 추가하세요.

### 페이지 추가
새로운 페이지는 `src/pages/` 디렉토리에 추가하고 `App.jsx`에 라우트를 추가하세요.

### API 호출
`src/services/api.js`를 통해 백엔드 API와 통신하세요.

## 🎯 개발 일정

- **Day 1**: 기술 세팅, API 스펙 정의
- **Day 2**: Google OAuth, DB 연결
- **Day 3**: 시놉시스 → AI 스토리 생성
- **Day 4**: 스토리 → AI 콘티 생성
- **Day 5**: 타임라인 UI 개발
- **Day 6**: 데이터 저장/조회, UI 개선
- **Day 7**: 통합 테스트, 발표 준비

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. 이 저장소를 포크하세요
2. 새로운 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
