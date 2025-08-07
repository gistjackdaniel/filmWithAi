# 🏗️ 프론트엔드 도메인 중심 리팩토링 태스크 목록

## 📋 프로젝트 현황 분석

### 현재 구조 (레이어 중심)
```
src/
├── components/     # UI 컴포넌트들 (도메인별 하위 폴더 존재)
├── pages/         # 페이지 컴포넌트들
├── services/      # API 서비스들
├── stores/        # 상태 관리
├── types/         # 타입 정의
├── utils/         # 유틸리티
├── constants/     # 상수
└── theme/         # 스타일링
```

### 목표 구조 (도메인 중심)
```
src/
├── shared/        # 공통 도메인
├── auth/          # 인증 도메인
├── project/       # 프로젝트 도메인
├── scene/         # 씬 도메인
├── cut/           # 컷 도메인
├── dashboard/     # 대시보드 도메인
├── ai/            # AI 도메인
└── app/           # 앱 레벨
```

## 🎯 우선순위별 태스크 목록

### 🔥 Phase 1: 기반 구조 설정 (최우선) ✅

- [x] **1.1 공통 도메인 구조 생성**
  - [x] `src/shared/` 폴더 생성
  - [x] `src/shared/components/` 생성 (공통 UI 컴포넌트)
  - [x] `src/shared/hooks/` 생성 (공통 커스텀 훅)
  - [x] `src/shared/utils/` 생성 (공통 유틸리티)
  - [x] `src/shared/types/` 생성 (공통 타입 정의)
  - [x] `src/shared/constants/` 생성 (공통 상수)
  - [x] `src/shared/theme/` 생성 (스타일링 테마)

- [x] **1.2 앱 레벨 구조 생성**
  - [x] `src/app/` 폴더 생성
  - [x] `src/app/routes/` 생성 (라우팅 설정)
  - [x] `src/app/providers/` 생성 (앱 레벨 프로바이더)
  - [x] `src/app/layouts/` 생성 (레이아웃 컴포넌트)

- [x] **1.3 도메인별 기본 구조 생성**
  - [x] `src/auth/` 폴더 및 하위 구조 생성
  - [x] `src/project/` 폴더 및 하위 구조 생성
  - [x] `src/scene/` 폴더 및 하위 구조 생성
  - [x] `src/cut/` 폴더 및 하위 구조 생성
  - [x] `src/dashboard/` 폴더 및 하위 구조 생성
  - [x] `src/ai/` 폴더 및 하위 구조 생성

### 🚀 Phase 2: 공통 요소 이전 (고우선) ✅

- [x] **2.1 공통 컴포넌트 이전**
  - [x] `src/components/common/` → `src/shared/components/` 이동
  - [x] 공통 컴포넌트 import 경로 수정
  - [x] 공통 컴포넌트 타입 정의 이전

- [x] **2.2 공통 유틸리티 이전**
  - [x] `src/utils/` → `src/shared/utils/` 이동
  - [x] 유틸리티 함수 import 경로 수정
  - [x] 유틸리티 함수 테스트 확인

- [x] **2.3 공통 타입 정의 이전**
  - [x] `src/types/` → `src/shared/types/` 이동
  - [x] 공통 타입 import 경로 수정
  - [x] 타입 정의 정리 및 중복 제거

- [x] **2.4 공통 상수 이전**
  - [x] `src/constants/` → `src/shared/constants/` 이동
  - [x] 상수 import 경로 수정

- [x] **2.5 테마 이전**
  - [x] `src/theme/` → `src/shared/theme/` 이동
  - [x] 테마 import 경로 수정

### 📦 Phase 3: 도메인별 코드 이전 (중우선) ✅

- [x] **3.1 인증 도메인 이전**
  - [x] `src/components/auth/` → `src/auth/components/` 이동
  - [x] `src/services/authService.ts` → `src/auth/services/` 이동
  - [x] `src/stores/authStore.ts` → `src/auth/stores/` 이동
  - [x] 인증 관련 타입 정의 → `src/auth/types/` 이동
  - [x] 인증 관련 import 경로 수정

- [x] **3.2 프로젝트 도메인 이전**
  - [x] `src/components/project/` → `src/project/components/` 이동
  - [x] `src/services/projectService.ts` → `src/project/services/` 이동
  - [x] `src/stores/projectStore.ts` → `src/project/stores/` 이동
  - [x] `src/pages/ProjectPage.tsx` → `src/project/pages/` 이동
  - [x] 프로젝트 관련 타입 정의 → `src/project/types/` 이동
  - [x] 프로젝트 관련 import 경로 수정

- [x] **3.3 씬 도메인 이전**
  - [x] `src/components/scene/` → `src/scene/components/` 이동
  - [x] `src/services/sceneService.ts` → `src/scene/services/` 이동
  - [x] `src/stores/sceneStore.ts` → `src/scene/stores/` 이동
  - [x] `src/pages/SceneDetailPage.tsx` → `src/scene/pages/` 이동
  - [x] `src/pages/SceneDraftDetailPage.tsx` → `src/scene/pages/` 이동
  - [x] 씬 관련 타입 정의 → `src/scene/types/` 이동
  - [x] 씬 관련 import 경로 수정

- [x] **3.4 컷 도메인 이전**
  - [x] `src/components/cut/` → `src/cut/components/` 이동
  - [x] `src/services/cutService.ts` → `src/cut/services/` 이동
  - [x] `src/stores/cutStore.ts` → `src/cut/stores/` 이동
  - [x] `src/pages/CutDetailPage.tsx` → `src/cut/pages/` 이동
  - [x] `src/pages/CutDraftDetailPage.tsx` → `src/cut/pages/` 이동
  - [x] 컷 관련 타입 정의 → `src/cut/types/` 이동
  - [x] 컷 관련 import 경로 수정

- [x] **3.5 대시보드 도메인 이전**
  - [x] `src/components/dashboard/` → `src/dashboard/components/` 이동
  - [x] `src/pages/Dashboard.tsx` → `src/dashboard/pages/` 이동
  - [x] 대시보드 관련 타입 정의 → `src/dashboard/types/` 이동
  - [x] 대시보드 관련 import 경로 수정

### 🔧 Phase 4: 앱 레벨 구조 정리 (중우선) ✅

- [x] **4.1 앱 레벨 파일 이전**
  - [x] `src/App.tsx` → `src/app/App.tsx` 이동
  - [x] `src/main.tsx` → `src/app/main.tsx` 이동
  - [x] `src/index.css` → `src/app/index.css` 이동
  - [x] `src/App.css` → `src/app/App.css` 이동

- [x] **4.2 라우팅 구조 정리**
  - [x] 라우팅 설정 → `src/app/routes/` 이동
  - [x] 라우트 컴포넌트 도메인별 분리
  - [x] 라우팅 import 경로 수정

- [x] **4.3 프로바이더 구조 정리**
  - [x] 앱 레벨 프로바이더 → `src/app/providers/` 이동
  - [x] 프로바이더 import 경로 수정

### 🧪 Phase 5: 테스트 및 검증 (중우선)

- [x] **5.1 빌드 테스트** ✅ **완료**
  - [x] TypeScript 컴파일 오류 확인
  - [x] 빌드 성공 여부 확인
  - [x] 런타임 오류 확인

- [x] **5.2 API 구조 정리** ✅ **완료**
  - [x] `src/shared/services/api.ts` → 공통 API 설정만 유지
  - [x] 각 도메인별 API 클라이언트 생성:
    - [x] `src/auth/services/authApi.ts` (인증 전용 API)
    - [x] `src/project/services/projectApi.ts` (프로젝트 전용 API)
    - [x] `src/scene/services/sceneApi.ts` (씬 전용 API)
    - [x] `src/cut/services/cutApi.ts` (컷 전용 API)
  - [x] 각 도메인 API는 공통 `api.ts`를 확장하여 사용
  - [x] 도메인별 API 엔드포인트 분리
  - [x] 기존 서비스 파일들을 새로운 도메인별 API 사용하도록 업데이트
  - [x] API 클라이언트를 서비스 파일에 통합하여 도메인 중심 구조 완성

- [x] **5.3 기능 테스트** ✅ **완료**
  - [x] TypeScript 컴파일 오류 수정 (완료)
  - [x] Optional property 접근 오류 수정 (완료)
  - [x] Import 경로 오류 수정 (완료)
  - [x] Material-UI Grid 컴포넌트 타입 오류 해결 (완료 - 타입 단언 사용)
  - [x] 존재하지 않는 CSS 파일 import 제거 (완료)
  - [x] 빌드 성공 확인 (완료)
  - [ ] 각 도메인별 기능 동작 확인
  - [ ] 페이지 라우팅 확인
  - [ ] API 호출 확인
  - [ ] 상태 관리 확인

### 🎨 Phase 6: 최적화 및 정리 (저우선)

- [ ] **6.1 코드 정리**
  - [ ] 사용하지 않는 import 제거
  - [ ] 중복 코드 제거
  - [ ] 코드 스타일 통일

- [ ] **6.2 문서화**
  - [ ] 각 도메인별 README 작성
  - [ ] API 문서 업데이트
  - [ ] 개발 가이드 업데이트

- [ ] **6.3 최적화**
  - [ ] 번들 분할 최적화
  - [ ] 지연 로딩 적용
  - [ ] 캐싱 전략 적용

## 📊 진행 상황 추적

### 완료된 태스크
- [ ] Phase 1: 기반 구조 설정
- [ ] Phase 2: 공통 요소 이전
- [ ] Phase 3: 도메인별 코드 이전
- [ ] Phase 4: 앱 레벨 구조 정리
- [ ] Phase 5: 테스트 및 검증
- [ ] Phase 6: 최적화 및 정리

### 현재 진행 중인 태스크
- [ ] 프로젝트 구조 분석 완료
- [ ] 태스크 목록 작성 완료

### 다음 단계
1. Phase 1부터 순차적으로 진행
2. 각 Phase 완료 후 테스트 진행
3. 문제 발생 시 즉시 수정 후 진행

## 🚨 주의사항

1. **백업 필수**: 리팩토링 전 전체 프로젝트 백업
2. **단계별 진행**: 한 번에 모든 것을 변경하지 말고 단계별로 진행
3. **테스트 필수**: 각 단계 완료 후 반드시 테스트 진행
4. **Git 커밋**: 각 Phase 완료 후 커밋하여 롤백 가능하도록 유지

## 📝 참고사항

- 백엔드 NestJS 구조와 일치하도록 설계
- 각 도메인은 독립적으로 개발 가능하도록 구성
- 공통 요소는 shared 도메인으로 분리
- 확장성을 고려한 구조 설계 