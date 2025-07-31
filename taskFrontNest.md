# 🚀 Frontend → NestJS Backend Migration Task List

## 📋 개요
- **현재 상태**: `@/stores`, `@/services`, `@/types`는 NestJS 백엔드에 맞게 수정 완료
- **목표**: `@/pages`와 `@/components`를 NestJS 백엔드 API 구조에 맞게 수정
- **핵심 플로우**: 시놉시스 → 스토리 → 씬 → 컷 → 스케줄링

---

## 🎯 우선순위 1: 핵심 페이지 구조 재정의

### 1.1 프로젝트 CRUD 페이지 수정
- [x] **`SynoStoryProjectGenerationPage.jsx`** 수정
  - [x] NestJS 프로젝트 API 엔드포인트 연결 (`/project`)
  - [x] 프로젝트 생성/수정/조회 로직 업데이트
  - [x] 시놉시스와 스토리 통합 저장 로직 구현
  - [x] 상태 관리 플로우: `draft` → `synopsis_ready` → `story_ready`

### 1.2 스토리 기반 씬 CRUD 페이지 생성
- [x] **`SceneGenerationPage.jsx`** 구현 (현재 빈 파일)
  - [x] 스토리 기반 씬 생성 로직 구현
  - [x] 씬 CRUD 기능 (`/scene` API)
  - [x] 씬 목록 표시 및 편집 기능
  - [x] 씬별 상세 정보 관리

### 1.3 씬 기반 컷 CRUD 페이지 수정
- [x] **`ProjectPage.jsx`** 듀얼 타임라인 탭 수정
  - [x] 컷 CRUD 기능 (`/cut` API)
  - [x] 듀얼 타임라인 뷰어 업데이트
  - [x] 컷 편집 모달 수정
  - [x] 컷 이미지 생성 및 관리

---

## 🎯 우선순위 2: 스케줄링 시스템 통합

### 2.1 AllSchedulePage 수정
- [x] **`AllSchedulePage.jsx`** NestJS 연동
  - [x] `schedulerService.js` 알고리즘 통합
  - [x] 씬 기반 스케줄 생성 로직
  - [x] 스케줄 CRUD 기능 (`/scheduler` API)
  - [x] 최적화된 스케줄링 알고리즘 적용

### 2.2 DailyBreakdownPage 수정
- [x] **`DailyBreakdownPage.jsx`** 일일 스케줄 기반 수정
  - [x] AllSchedulePage의 일일 스케줄 데이터 활용
  - [x] 일일 브레이크다운 생성 로직
  - [x] 상세 스케줄 정보 표시
  - [x] PDF/CSV 내보내기 기능

---

## 🎯 우선순위 3: 통합 프로젝트 페이지 구현

### 3.1 ProjectPage 구조 재정의
- [x] **`ProjectPage.jsx`** 탭 구조 구현
  - [x] 프로젝트 정보 탭 (명+시놉시스+스토리 조회)
  - [x] 씬 CRUD 탭 (씬 목록 및 편집)
  - [x] 듀얼 타임라인 탭 (컷 CRUD)
  - [x] AllSchedulePage 탭 (스케줄링)
  - [x] DailyBreakdownPage 탭 (일일 브레이크다운)

### 3.2 프로젝트 정보 통합 관리
- [x] 프로젝트 메타데이터 표시
- [x] 시놉시스와 스토리 조회 기능
- [x] 프로젝트 상태 관리
- [x] 프로젝트 설정 및 편집

---

## 🎯 우선순위 4: 컴포넌트 수정

### 4.1 공통 컴포넌트 수정
- [x] **`@/components/common`** 수정
  - [x] CommonHeader NestJS API 연동
  - [x] ProtectedRoute 인증 로직 업데이트
  - [x] 에러 핸들링 컴포넌트 수정

### 4.2 프로젝트 컴포넌트 수정
- [x] **`@/components/project`** 수정
  - [x] ProjectCreationModal NestJS API 연동
  - [x] StoryGenerationPanel API 엔드포인트 수정
  - [x] ProjectDetailView 데이터 구조 업데이트
  - [x] SynopsisInputForm 저장 로직 수정

### 4.3 씬 컴포넌트 수정
- [x] **`@/components/scene`** 수정
  - [x] SceneEditModal NestJS API 연동
  - [x] SceneDetailModal 데이터 구조 업데이트
  - [x] 씬 생성 및 편집 로직 수정

### 4.4 컷 컴포넌트 수정
- [x] **`@/components/cut`** 수정
  - [x] CutEditModal NestJS API 연동
  - [x] 컷 생성 및 편집 로직 수정
  - [x] 컷 이미지 관리 기능 업데이트

### 4.5 타임라인 컴포넌트 수정
- [x] **`@/components/timeline`** 수정
  - [x] 듀얼 타임라인 뷰어 NestJS 연동
  - [x] 타임라인 필터링 로직 수정
  - [x] 타임라인 네비게이션 업데이트

---

## 🎯 우선순위 5: 기타 페이지 수정

### 5.1 대시보드 수정
- [x] **`Dashboard.jsx`** 수정
  - [x] 프로젝트 목록 NestJS API 연동
  - [x] 최근 프로젝트 표시 로직 수정
  - [x] 프로젝트 생성 플로우 업데이트

### 5.2 인증 페이지 수정
- [x] **`LoginPage.jsx`** 수정
  - [x] NestJS 인증 API 연동 (`/auth`)
  - [x] OAuth 로그인 로직 수정
  - [x] 사용자 프로필 관리 업데이트

### 5.3 기타 페이지 정리
- [x] **`DirectStoryPage.jsx`** 수정 (NestJS 백엔드 연동 완료)
  - [x] Conte 관련 로직 제거
  - [x] 시놉시스 → 스토리 → 씬 → 컷 플로우로 변경
  - [x] NestJS 프로젝트 API 연동
  - [x] 프로젝트 저장 기능 구현
  - [x] 스토어 연동 (projectStore, storyStore)
- [ ] **`ConteGenerationPage.jsx`** 삭제 (conte 로직 제거됨)
- [ ] 사용하지 않는 페이지 정리

---

## 🎯 우선순위 6: API 서비스 수정

### 6.1 API 서비스 업데이트
- [x] **`projectApi.js`** 최종 검증
- [x] **`sceneApi.js`** NestJS 엔드포인트 확인
- [x] **`cutApi.js`** API 구조 검증
- [x] **`authApi.js`** 인증 로직 확인
- [x] **`profileApi.js`** 사용자 정보 API 확인

### 6.2 스케줄링 서비스 통합
- [x] **`schedulerService.js`** NestJS 연동
- [x] 스케줄 생성 API 엔드포인트 연결
- [x] 브레이크다운 생성 로직 수정

---

## 🎯 우선순위 7: 타입 정의 검증

### 7.1 타입 정의 확인
- [x] **`@/types/project.js`** NestJS 스키마와 일치 확인
- [x] **`@/types/scene.js`** 씬 데이터 구조 검증
- [x] **`@/types/cut.js`** 컷 데이터 구조 검증
- [x] **`@/types/auth.js`** 인증 타입 확인
- [x] **`@/types/schedule.js`** 스케줄 타입 검증

---

## 🎯 우선순위 8: 테스트 및 검증

### 8.1 기능 테스트
- [ ] 프로젝트 생성 → 시놉시스 → 스토리 플로우 테스트
- [ ] 씬 생성 및 편집 기능 테스트
- [ ] 컷 생성 및 타임라인 기능 테스트
- [ ] 스케줄링 알고리즘 테스트
- [ ] 인증 및 권한 관리 테스트

### 8.2 API 연동 테스트
- [ ] 모든 API 엔드포인트 연결 확인
- [ ] 에러 핸들링 테스트
- [ ] 데이터 동기화 테스트
- [ ] 성능 최적화 확인

---

## 📊 진행 상황 추적

### 완료된 작업 ✅
- [x] `@/stores` NestJS 백엔드에 맞게 수정
- [x] `@/services` API 서비스 수정
- [x] `@/types` 타입 정의 업데이트
- [x] `SynoStoryProjectGenerationPage.jsx` storyStore 의존성 제거 및 projectStore 통합
- [x] `ProjectPage.jsx` 듀얼 타임라인 탭 수정 (컷 CRUD)
- [x] `AllSchedulePage.jsx` NestJS 연동 및 스케줄링 시스템 통합
- [x] `DailyBreakdownPage.jsx` 일일 스케줄 기반 수정 및 PDF/CSV 내보내기 기능 추가
- [x] `ProjectPage.jsx` 탭 구조 구현 (프로젝트 정보, 씬 CRUD, 듀얼 타임라인, 스케줄링, 브레이크다운)
- [x] 모든 컴포넌트 NestJS API 연동 완료
- [x] 모든 API 서비스 NestJS 백엔드 연동 완료
- [x] 모든 타입 정의 NestJS 스키마와 일치 확인 완료
- [x] `DirectStoryPage.jsx` NestJS 백엔드 연동 완료 (Conte 로직 제거, 시놉시스→스토리→씬→컷 플로우 적용)

### 진행 중인 작업 🔄
- [ ] 우선순위 8 테스트 및 검증

### 대기 중인 작업 ⏳
- [ ] 나머지 테스트 및 검증 작업

---

## 🚨 주의사항

1. **API 엔드포인트 확인**: NestJS 백엔드의 실제 엔드포인트와 일치하는지 확인
2. **데이터 구조 검증**: 백엔드 스키마와 프론트엔드 타입이 일치하는지 확인
3. **에러 핸들링**: API 호출 실패 시 적절한 에러 처리 구현
4. **상태 관리**: Zustand 스토어와 API 응답 간의 동기화 확인
5. **사용자 경험**: 로딩 상태, 에러 메시지, 성공 피드백 제공

---

## 📝 참고사항

- **핵심 플로우**: 시놉시스 → 스토리 → 씬 → 컷 → 스케줄링
- **백엔드**: `@/backendwithnest` (NestJS)
- **프론트엔드**: React + Zustand + Material-UI
- **API 통신**: Axios 기반 RESTful API
- **상태 관리**: Zustand 스토어 (authStore, projectStore, sceneStore, cutStore, timelineStore)

---

**마지막 업데이트**: 2024년 현재  
**담당자**: 개발팀  
**우선순위**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 