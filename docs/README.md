# SceneForge 문서

이 폴더는 SceneForge 프로젝트의 모든 문서를 포함합니다.

## 📁 문서 구조

```
docs/
├── README.md                           # 이 파일 - 문서 개요
├── PRD/                               # 제품 요구사항 문서
│   ├── SceneForge_PRD.txt            # 메인 PRD 문서
│   └── User_Authentication_Flow.md    # 인증 플로우 설계
├── API/                               # API 문서
│   └── API_Specification.md           # API 명세서
├── UI/                                # UI/UX 문서
│   └── Wireframes.md                  # UI 와이어프레임
├── Development/                       # 개발 가이드
│   ├── Setup_Guide.md                 # 개발 환경 설정 가이드
│   └── External_Documentation.md      # 외부 공식 문서 링크
└── Notes/                             # 개발 노트
    └── Quick_Reference.txt            # 빠른 참조 노트
```

## 📋 문서 목록

### 제품 문서
- **PRD**: 제품 요구사항 및 기능 명세
- **인증 플로우**: 사용자 로그인 프로세스 설계

### 기술 문서
- **API 명세**: 백엔드 API 엔드포인트 문서
- **아키텍처**: 시스템 구조 및 설계 문서

### 개발 가이드
- **설정 가이드**: 개발 환경 설정 방법
- **외부 문서**: React, Next.js, Tailwind CSS 등 공식 문서 링크
- **빠른 참조**: 자주 사용하는 코드 스니펫과 명령어

## 🔗 외부 공식 문서 링크

### 주요 기술 스택
- **[React 공식 문서](https://react.dev/)** - React 개발 참고
- **[Next.js 공식 문서](https://nextjs.org/docs)** - Next.js 기능 및 API
- **[Tailwind CSS 공식 문서](https://tailwindcss.com/docs)** - 스타일링 가이드

### 상세 문서
- **React**: 컴포넌트, 훅, 상태 관리
- **Next.js**: 라우팅, 데이터 페칭, 최적화
- **Tailwind CSS**: 유틸리티 클래스, 반응형 디자인
- **개발 도구**: Vite, Zustand, Material-UI
- **데이터베이스**: MongoDB, Mongoose
- **API 서비스**: OpenAI, Google OAuth
- **테스트**: Jest, React Testing Library, Playwright

자세한 링크 목록은 [External_Documentation.md](./Development/External_Documentation.md)를 참조하세요.

## 🔄 문서 업데이트

새로운 문서를 추가할 때는:
1. 적절한 폴더에 배치
2. 이 README.md 파일 업데이트
3. 문서 버전 관리

## 📝 빠른 참조

### 자주 사용하는 명령어
```bash
# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 테스트
npm test
```

### 주요 파일 위치
- **프론트엔드**: `src/` 폴더
- **백엔드**: `backend/` 폴더
- **설정 파일**: 루트 디렉토리
- **문서**: `docs/` 폴더

---

**마지막 업데이트**: 2024년
**문서 관리자**: SceneForge 개발팀 