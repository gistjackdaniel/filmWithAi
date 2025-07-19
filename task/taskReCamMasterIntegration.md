# SceneForge ReCamMaster 통합 태스크 목록

## 📋 프로젝트 정보
- **목표**: ReCamMaster 카메라 컨트롤 기능을 SceneForge AI 비디오 생성에 통합
- **기간**: 4주 (Week 13-16)
- **우선순위**: P0(최우선) > P1(고우선) > P2(중우선) > P3(저우선)
- **참고**: [ReCamMaster GitHub](https://github.com/KwaiVGI/ReCamMaster)

---

## 🎯 현재 상태 분석

### ✅ SceneForge 현재 기능
- [x] AI 콘티 생성 (12개 요소)
- [x] 타임라인 시각화
- [x] 실사/AI 분류 시스템
- [x] 기본 AI 비디오 생성

### 🔍 ReCamMaster 핵심 기능
- [x] 카메라 궤적 제어 (Pan/Tilt, Translation, Arc, Random)
- [x] 카메라 파라미터 제어 (Focal, Aperture, Speed)
- [x] 다중 카메라 시퀀스 생성
- [x] 단일 비디오 기반 새로운 카메라 앵글 생성

---

## 🚀 P0 - 최우선 태스크 (Week 13-14)

### 2.3.1 ReCamMaster 백엔드 통합

#### P0.1 ReCamMaster 서비스 설정
- [ ] **ReCamMaster 환경 설정**
  - [ ] `backend/services/recammasterService.js` 생성
  - [ ] Python 환경 설정 (requirements.txt)
  - [ ] GPU 클러스터 연동 설정
  - [ ] 모델 체크포인트 다운로드

- [ ] **API 엔드포인트 구현**
  - [ ] `POST /api/recammaster/generate` - 카메라 제어 비디오 생성
  - [ ] `POST /api/recammaster/trajectory` - 카메라 궤적 생성
  - [ ] `GET /api/recammaster/status` - 생성 상태 확인
  - [ ] `DELETE /api/recammaster/cancel` - 생성 취소

#### P0.2 카메라 궤적 시스템
- [ ] **카메라 궤적 타입 구현**
  - [ ] Pan & Tilt 궤적 생성
  - [ ] Basic Translation 궤적 생성
  - [ ] Arc Trajectory 궤적 생성
  - [ ] Random Trajectories 궤적 생성
  - [ ] Static Camera 설정

- [ ] **카메라 파라미터 시스템**
  - [ ] Focal Length 설정 (18mm, 24mm, 35mm, 50mm)
  - [ ] Aperture 설정 (10.0, 5.0, 2.4)
  - [ ] Movement Speed 설정 (일정/가변)
  - [ ] Camera Starting Position 설정

#### P0.3 비디오 업로드 및 처리
- [ ] **비디오 업로드 시스템**
  - [ ] `backend/routes/recammaster.js` 생성
  - [ ] 비디오 파일 업로드 처리
  - [ ] 비디오 형식 검증 (MP4, AVI, MOV)
  - [ ] 비디오 압축 및 최적화

- [ ] **비디오 전처리**
  - [ ] 해상도 조정 (1280x1280)
  - [ ] 프레임 레이트 조정 (15FPS)
  - [ ] 비디오 품질 최적화
  - [ ] 메타데이터 추출

### 2.3.2 프론트엔드 카메라 컨트롤 UI

#### P0.4 카메라 컨트롤 컴포넌트
- [ ] **CameraControlPanel 생성**
  - [ ] `src/components/StoryGeneration/CameraControlPanel.jsx` 생성
  - [ ] 카메라 궤적 타입 선택 UI
  - [ ] 카메라 파라미터 조정 UI
  - [ ] 실시간 미리보기

- [ ] **카메라 궤적 시각화**
  - [ ] `src/components/StoryGeneration/CameraTrajectoryVisualizer.jsx` 생성
  - [ ] 3D 카메라 궤적 표시
  - [ ] 카메라 위치 및 방향 표시
  - [ ] 궤적 편집 기능

#### P0.5 비디오 업로드 인터페이스
- [ ] **VideoUploader 컴포넌트**
  - [ ] `src/components/StoryGeneration/VideoUploader.jsx` 생성
  - [ ] 드래그 앤 드롭 업로드
  - [ ] 업로드 진행률 표시
  - [ ] 비디오 미리보기

- [ ] **비디오 검증 시스템**
  - [ ] 파일 형식 검증
  - [ ] 파일 크기 제한
  - [ ] 비디오 품질 검사
  - [ ] 에러 처리 및 피드백

#### P0.6 생성 상태 관리
- [ ] **ReCamMaster 스토어**
  - [ ] `src/stores/recammasterStore.js` 생성
  - [ ] 생성 상태 관리
  - [ ] 카메라 설정 저장
  - [ ] 생성 히스토리 관리

- [ ] **실시간 상태 업데이트**
  - [ ] WebSocket을 통한 실시간 상태
  - [ ] 생성 진행률 표시
  - [ ] 에러 상태 처리
  - [ ] 생성 완료 알림

---

## 🔶 P1 - 고우선 태스크 (Week 15)

### 2.3.3 고급 카메라 컨트롤

#### P1.1 다중 카메라 시퀀스
- [ ] **다중 카메라 설정**
  - [ ] 10개 카메라 동시 설정
  - [ ] 카메라별 궤적 설정
  - [ ] 카메라 간 동기화
  - [ ] 시퀀스 순서 관리

- [ ] **시퀀스 미리보기**
  - [ ] 다중 카메라 미리보기
  - [ ] 시퀀스 타임라인 표시
  - [ ] 카메라 전환 효과
  - [ ] 시퀀스 편집 기능

#### P1.2 고급 궤적 편집
- [ ] **궤적 편집기**
  - [ ] `src/components/StoryGeneration/TrajectoryEditor.jsx` 생성
  - [ ] 키프레임 기반 편집
  - [ ] 부드러운 곡선 보간
  - [ ] 궤적 복사/붙여넣기

- [ ] **궤적 템플릿**
  - [ ] 미리 정의된 궤적 템플릿
  - [ ] 장르별 궤적 패턴
  - [ ] 사용자 정의 템플릿 저장
  - [ ] 템플릿 공유 기능

#### P1.3 AI 자동 궤적 생성
- [ ] **AI 궤적 제안**
  - [ ] 콘티 내용 기반 궤적 제안
  - [ ] 감정에 따른 궤적 선택
  - [ ] 스토리 흐름에 맞는 궤적
  - [ ] 자동 궤적 최적화

- [ ] **스마트 카메라 설정**
  - [ ] 장면에 맞는 카메라 파라미터 자동 설정
  - [ ] 조명 조건에 따른 설정
  - [ ] 액션 장면 최적화
  - [ ] 정적 장면 최적화

### 2.3.4 콘티 연동 시스템

#### P1.4 콘티-카메라 연동
- [ ] **콘티 기반 카메라 설정**
  - [ ] 콘티 요소별 카메라 설정 매핑
  - [ ] 카메라 앵글 자동 제안
  - [ ] 촬영 정보 연동
  - [ ] 예산 고려 카메라 설정

- [ ] **스마트 분류 시스템**
  - [ ] AI 생성 vs 실사 촬영 자동 분류
  - [ ] 카메라 복잡도에 따른 분류
  - [ ] 예산에 따른 카메라 선택
  - [ ] 시간에 따른 카메라 우선순위

#### P1.5 타임라인 통합
- [ ] **카메라 정보 타임라인 표시**
  - [ ] 씬별 카메라 설정 표시
  - [ ] 카메라 궤적 미리보기
  - [ ] 카메라 전환 지점 표시
  - [ ] 카메라 메타데이터 표시

- [ ] **타임라인 편집 연동**
  - [ ] 타임라인에서 카메라 설정 편집
  - [ ] 드래그 앤 드롭 카메라 순서 변경
  - [ ] 카메라 설정 복사/붙여넣기
  - [ ] 카메라 설정 일괄 편집

---

## 🔶 P2 - 중우선 태스크 (Week 16)

### 2.3.5 성능 최적화

#### P2.1 GPU 클러스터 최적화
- [ ] **GPU 리소스 관리**
  - [ ] GPU 사용량 모니터링
  - [ ] 작업 큐 최적화
  - [ ] 병렬 처리 구현
  - [ ] 메모리 사용량 최적화

- [ ] **캐싱 시스템**
  - [ ] 생성된 비디오 캐싱
  - [ ] 카메라 설정 캐싱
  - [ ] 궤적 계산 캐싱
  - [ ] CDN 연동

#### P2.2 사용자 경험 최적화
- [ ] **실시간 미리보기**
  - [ ] 저해상도 실시간 미리보기
  - [ ] 카메라 궤적 실시간 시각화
  - [ ] 설정 변경 즉시 반영
  - [ ] 부드러운 애니메이션

- [ ] **에러 처리 및 복구**
  - [ ] 생성 실패 시 자동 재시도
  - [ ] 부분 실패 시 복구 메커니즘
  - [ ] 사용자 친화적 에러 메시지
  - [ ] 문제 해결 가이드

### 2.3.6 고급 기능

#### P2.3 배치 처리
- [ ] **다중 비디오 처리**
  - [ ] 여러 비디오 동시 처리
  - [ ] 배치 작업 관리
  - [ ] 우선순위 설정
  - [ ] 작업 일정 관리

- [ ] **템플릿 시스템**
  - [ ] 카메라 설정 템플릿
  - [ ] 궤적 패턴 템플릿
  - [ ] 프로젝트별 템플릿
  - [ ] 팀 공유 템플릿

#### P2.4 분석 및 통계
- [ ] **사용 패턴 분석**
  - [ ] 카메라 설정 사용 통계
  - [ ] 궤적 패턴 분석
  - [ ] 생성 시간 통계
  - [ ] 사용자 선호도 분석

- [ ] **품질 평가**
  - [ ] 생성된 비디오 품질 평가
  - [ ] 카메라 궤적 품질 검사
  - [ ] 자동 품질 개선 제안
  - [ ] 품질 피드백 시스템

---

## 🔶 P3 - 저우선 태스크 (향후 확장)

### 2.3.7 고급 AI 기능

#### P3.1 AI 카메라 감독
- [ ] **AI 카메라 감독 시스템**
  - [ ] 스토리 기반 자동 카메라 설정
  - [ ] 감정 분석 기반 카메라 선택
  - [ ] 액션 장면 자동 카메라 워크
  - [ ] 대화 장면 자동 카메라 설정

#### P3.2 고급 렌더링
- [ ] **고품질 렌더링**
  - [ ] 4K 해상도 지원
  - [ ] HDR 렌더링
  - [ ] 고프레임레이트 지원
  - [ ] 다양한 포맷 지원

### 2.3.8 협업 기능

#### P3.3 실시간 협업
- [ ] **실시간 카메라 편집**
  - [ ] 다중 사용자 카메라 편집
  - [ ] 실시간 카메라 설정 동기화
  - [ ] 카메라 편집 히스토리
  - [ ] 실시간 피드백

#### P3.4 워크플로우 통합
- [ ] **프리미어 프로 연동**
  - [ ] 카메라 설정 XML 내보내기
  - [ ] 프리미어 프로 카메라 데이터 연동
  - [ ] 실시간 프리미어 프로 동기화
  - [ ] 카메라 설정 자동 적용

---

## 🛠️ 기술적 구현 세부사항

### ReCamMaster 통합 아키텍처
```javascript
// 백엔드 구조
backend/
├── services/
│   ├── recammasterService.js      // ReCamMaster API 연동
│   ├── cameraTrajectoryService.js // 카메라 궤적 생성
│   └── videoProcessingService.js  // 비디오 전처리
├── routes/
│   └── recammaster.js            // ReCamMaster API 엔드포인트
└── models/
    └── CameraSettings.js         // 카메라 설정 모델

// 프론트엔드 구조
src/
├── components/StoryGeneration/
│   ├── CameraControlPanel.jsx    // 카메라 컨트롤 UI
│   ├── CameraTrajectoryVisualizer.jsx // 궤적 시각화
│   ├── VideoUploader.jsx         // 비디오 업로드
│   └── TrajectoryEditor.jsx      // 궤적 편집기
├── stores/
│   └── recammasterStore.js       // ReCamMaster 상태 관리
└── services/
    └── recammasterApi.js         // ReCamMaster API 클라이언트
```

### 카메라 궤적 타입 정의
```javascript
// 카메라 궤적 타입
const TRAJECTORY_TYPES = {
  PAN_TILT: 'pan_tilt',           // 팬/틸트
  TRANSLATION: 'translation',      // 이동
  ARC: 'arc',                     // 호 궤적
  RANDOM: 'random',               // 랜덤 궤적
  STATIC: 'static'                // 고정 카메라
}

// 카메라 파라미터
const CAMERA_PARAMS = {
  focalLengths: [18, 24, 35, 50], // mm
  apertures: [10.0, 5.0, 2.4],    // f-stop
  speeds: ['constant', 'variable']  // 속도 타입
}
```

### API 엔드포인트 설계
```javascript
// ReCamMaster API 엔드포인트
POST /api/recammaster/generate     // 비디오 생성
POST /api/recammaster/trajectory   // 궤적 생성
GET  /api/recammaster/status       // 상태 확인
DELETE /api/recammaster/cancel     // 생성 취소
POST /api/recammaster/upload       // 비디오 업로드
GET  /api/recammaster/templates    // 템플릿 조회
```

---

## 📊 진행 상황 추적

### 현재 진행률
- **P0**: 0% (0/15 태스크 완료)
- **P1**: 0% (0/12 태스크 완료)
- **P2**: 0% (0/8 태스크 완료)
- **P3**: 0% (0/6 태스크 완료)

### 마일스톤
- **Week 14**: ReCamMaster 기본 통합 완성
- **Week 15**: 고급 카메라 컨트롤 완성
- **Week 16**: 성능 최적화 및 고급 기능 완성

---

## 🎯 성공 지표

### 기술적 지표
- 비디오 생성 시간: 5분 이내 (81프레임)
- 카메라 궤적 계산: 1초 이내
- 실시간 미리보기: 100ms 이내
- GPU 사용률: 80% 이하

### 사용자 경험 지표
- 카메라 설정 편집 시간: 30초 이내
- 궤적 시각화 로딩: 2초 이내
- 사용자 만족도: 4.5/5.0 이상
- 기능 완성도: 90% 이상

---

**마지막 업데이트**: 2024년 12월 19일  
**예상 완료일**: 2025년 1월 16일 (4주)  
**담당자**: 개발팀  
**참고**: [ReCamMaster GitHub](https://github.com/KwaiVGI/ReCamMaster) 