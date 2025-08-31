## Veo3 I2V 기반 V2/V3 트랙 비디오 생성 구현 Task List

참고 문서: [Veo 3 Fast Image-to-Video API](https://fal.ai/models/fal-ai/veo3/fast/image-to-video/api)

### P0 — 기본 동작(필수)
- [x] 백엔드 환경 변수 설정: `.env`에 `FAL_KEY` 추가 (운영/개발 모두)
- [x] 프록시 엔드포인트 구현: `POST /api/project/:projectId/video/generate` (키 노출 방지, 서버 측에서 fal 호출)
- [x] 컷 이미지 절대 URL 구성: `cut.imageUrl`이 절대경로가 아니면 `FRONTEND_URL + imageUrl`로 변환
- [x] fal 큐 API 호출 로직: 요청 제출 → 상태 폴링 → 결과에서 `video.url` 획득 (타임아웃/에러 처리)
- [x] 비디오 도큐먼트 저장: `projectId, sceneId, sourceCutId, title, description, duration(기본 8), type=ai_generated, videoUrl, track(V2|V3)`
- [x] 프론트 DnD 연동(V1→V2): `TimelineEditor`에서 컷 드래그 시 `timelineClipService.generateFromCut` 호출하도록 연결
- [x] 프론트 DnD 연동(V1→V3): 동일 로직으로 `track: 'V3'` 생성 지원
- [x] 생성 결과를 V2/V3 트랙에 즉시 반영(상단 플레이어에서도 재생)

### P1 — 사용자 경험/프롬프트 품질 개선
- [x] 프롬프트 빌더: 컷의 메타데이터를 그대로 사용하여 다음 항목을 포함
  - [x] Character consistency: `subjectMovement` 기반 캐릭터 정체성 유지 지시
  - [x] Dialogs: 대사/내레이션을 포함하고 자막 미표기, 자연 립싱크 지시
  - [x] Audio control: `generate_audio`에 따라 앰비언트 사운드/무음 지시, `soundEffects` 반영
  - [x] Lighting control: `specialRequirements.specialLighting` 활성 플래그 반영
  - [x] Camera motion / Style / Director notes: `cameraSetup.cameraMovement`, `shotSize`, `lensSpecs`, `directorNotes`
- [x] 카메라/액션 키워드 사전 정의: 움직임(Action), 스타일(Style), 카메라 모션(Camera motion), 분위기(Ambiance) 포함 가이드 (상수 추가)
- [x] 이미지 해상도 검증/경고: 720p 미만 이미지는 경고(문서 상 720p 권장, 16:9 비율 미스 시 크롭됨) — 서버에서 절대 URL 구성 및 문서 기준 반영, 프론트 표시 문구 추가
- [x] 진행 상태 UI: “생성 중” 문구(에디터 V2 레인 플레이스홀더), 완료 후 트랙 반영
- [x] 재시도/에러 표시(1차): 실패 토스트(스낵바) 및 “생성 중” 상태 관리

### P2 — 안정성/운영
- [x] 서버 타임아웃/폴링 간격/최대 대기시간 설정(예: 5분 제한)
- [x] 속도 제한 및 큐 보호: 동시 생성 작업 수 제한(프로젝트 단위) — `FAL_MAX_CONCURRENT_PER_PROJECT`
- [x] 오류 매핑: fal 오류코드 → 사용자 친화 메시지로 변환
- [x] 로깅/관측(서버): 요청/응답 메타만 기록(민감정보/키 제외, 디버그 로그 과다 삽입 금지)
- [x] 결과 URL 미러링(옵션): `video.url`을 사내 스토리지(S3/로컬)로 미러링하는 백그라운드 경로 (환경변수 `USE_MIRROR`로 on/off)

### P3 — 데이터 모델/스토리지
- [x] `Video` 모델 검토: `track(V2|V3)`, `sourceCutId`, `videoUrl`, `order` 기본값/인덱스 점검 (인덱스 추가)
- [x] 트랙 합산 길이/플레이헤드 동기화: V2 길이 계산과 플레이어 우선순위(비디오 우선, 없으면 V1 이미지) 확인 (V2 기준 완료)
- [x] 정리 작업: 삭제/교체 시 참조 무결성 확보(`sourceCutId`, 파일 정리)

### P4 — 테스트
- [x] 단위 테스트: 서비스 프롬프트 생성, fal 호출 래퍼 모킹, 결과 파싱
- [x] 통합 테스트: `POST /video/generate` 엔드투엔드(모킹 서버)
- [x] e2e(UI): V1→V2/V3 드래그로 생성 → 타임라인 반영/플레이어 재생 검증

### P5 — 배포/문서화
- [x] `ecosystem.config.js`/배포 스크립트에 `FAL_KEY` 주입
- [x] README/운영 위키: 크레딧 정책, 해상도/비율 제약, 실패 케이스 안내
- [x] 권한/요금 보호: 생성 기능 노출 범위(권한 레벨), 호출 횟수 제한

---

## 세부 구현 체크리스트(파일/코드 단위)

### 백엔드(`sceneforge-nestjs`)
- [x] `src/config/validation.schema.ts`: `FAL_KEY` 스키마 추가/검증
- [x] `src/video/dto/request.dto.ts`: `GenerateVideoFromCutRequestDto` 정의(`sourceCutId`, `track`, 옵션 필드)
- [x] `src/video/video.controller.ts`: `POST /api/project/:projectId/video/generate` 추가
- [x] `src/video/video.service.ts`:
  - [x] 컷 조회(`sourceCutId` 유효성, `imageUrl` 필수) 및 절대 URL 생성
  - [x] fal 큐 API 요청 제출/상태 폴링/결과 파싱
  - [x] 프롬프트 빌더(라이팅/오디오/대사/캐릭터 일관성) 적용
  - [x] 결과 URL 미러링(옵션) 적용
  - [x] 로깅/관측 메타데이터 기록 (민감정보 제외)
  - [x] 참조 무결성 정리 (중복 생성 방지, 파일 정리)
  - [x] `Video` 도큐먼트 생성/반환
- [x] `src/video/video.module.ts`: `ConfigModule` 및 `Cut` 모델 주입

### 프런트엔드(`sceneforge-frontend`)
- [x] `src/timeline/services/timelineClipService.ts`: `generateFromCut` 추가
- [x] `src/timeline/components/editor/TimelineEditor.tsx`:
  - [x] V1→V2 드롭 시 `generateFromCut` 호출로 변경
  - [x] (UI) 생성 중 표시 문구 추가 + 에러 스낵바
  - [x] 생성 결과의 `videoUrl/duration` 반영
- [x] `src/timeline/components/PlayerWithTimeline.tsx`: 비디오 우선 재생 동작 확인
- [ ] (옵션) 툴바 버튼: 선택 컷 기준 “V2로 생성”/“V3로 생성” 액션 추가

### 프롬프트 설계(예시)
- [ ] Action: 컷의 핵심 동작을 1~2문장(예: “주인공이 카메라를 향해 걸어온다”) 
- [ ] Style: 필름 룩/현실감/색감
- [ ] Camera motion: `cameraSetup.cameraMovement` 반영(예: “slow push-in”)
- [ ] Ambiance: 분위기/조명/시간대
- [ ] 총 길이 8초 기준, 자연스러운 동작/전환

### 수용 기준(Acceptance Criteria)
- [x] V1 컷을 V2/V3로 드래그 시, 1회 드롭 → 1개 비디오 생성/타임라인 반영
- [x] 실패 시 사용자에게 원인 메시지 노출, 재시도 가능
- [x] 생성된 비디오는 상단 플레이어에서 재생 가능
- [x] 키(`FAL_KEY`)가 프론트로 노출되지 않음(모든 호출은 백엔드 프록시 경유)


