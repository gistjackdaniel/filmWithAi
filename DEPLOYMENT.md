# SceneForge 배포 가이드

## 개발 모드 vs 출시 모드

### 현재 상태 (개발 모드)
- ✅ **개발용 이미지 사용**: OpenAI API 비용 절약
- ✅ **개발용 배지 표시**: 이미지에 "🧪 개발용" 배지 표시
- ✅ **개발 모드 안내**: 사용자에게 개발용 이미지 사용 안내
- ✅ **Vite 개발 서버**: 핫 리로드, 실시간 수정

### 출시 시 변경사항 (출시 모드)
- 🚀 **실제 OpenAI API 사용**: 고품질 AI 이미지 생성
- 🚀 **개발용 배지 숨김**: 깔끔한 UI
- 🚀 **개발 모드 안내 제거**: 사용자 경험 개선
- 🚀 **프로덕션 빌드**: 최적화된 정적 파일

## 출시 모드로 전환하는 방법

### 방법 1: 환경 변수로 직접 제어 (권장)
```bash
# .env.production 파일 생성
VITE_APP_MODE=production
VITE_API_BASE_URL=https://api.sceneforge.com/api
```

### 방법 2: 개발용 이미지 비활성화
```bash
# .env.production 파일 생성
VITE_USE_DEV_IMAGES=false
VITE_API_BASE_URL=https://api.sceneforge.com/api
```

### 방법 3: 빌드 시 환경 변수 설정
```bash
# 빌드 시 환경 변수 설정
VITE_APP_MODE=production npm run build
```

## 배포 프로세스

### 1. 프로덕션 빌드
```bash
# 환경 변수 설정 후 빌드
VITE_APP_MODE=production npm run build

# 또는 .env.production 파일 사용
npm run build
```

### 2. 빌드 결과 확인
```bash
# dist 폴더에 정적 파일들이 생성됨
ls -la dist/
```

### 3. 배포
```bash
# Vercel 배포
vercel --prod

# Netlify 배포
netlify deploy --prod

# AWS S3 + CloudFront
aws s3 sync dist/ s3://your-bucket-name
```

## 환경별 설정 파일

### 개발 환경 (.env.development)
```bash
VITE_APP_MODE=development
VITE_USE_DEV_IMAGES=true
VITE_API_BASE_URL=http://localhost:5001/api
```

### 출시 환경 (.env.production)
```bash
VITE_APP_MODE=production
VITE_USE_DEV_IMAGES=false
VITE_API_BASE_URL=https://api.sceneforge.com/api
```

### 로컬 환경 (.env.local)
```bash
# 개발 중 테스트용
VITE_APP_MODE=production
VITE_USE_DEV_IMAGES=false
```

## 모드 전환 확인

### 개발 모드 확인
```javascript
import { getCurrentMode, shouldUseDevImages } from './config/appConfig'

console.log('현재 모드:', getCurrentMode()) // 'development'
console.log('개발용 이미지 사용:', shouldUseDevImages()) // true
```

### 출시 모드 확인
```javascript
import { getCurrentMode, shouldUseDevImages } from './config/appConfig'

console.log('현재 모드:', getCurrentMode()) // 'production'
console.log('개발용 이미지 사용:', shouldUseDevImages()) // false
```

## OpenAI API 설정

### 1. API 키 설정
백엔드 `.env` 파일에 OpenAI API 키 추가:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. API 사용량 모니터링
- OpenAI 대시보드에서 사용량 확인
- 비용 제한 설정
- 사용량 알림 설정

### 3. 이미지 생성 최적화
- 적절한 이미지 크기 설정 (1024x1024)
- 프롬프트 최적화
- 캐싱 전략 수립

## 개발 모드 유지 (권장)

개발 중에는 개발용 이미지를 사용하여 비용을 절약하세요:

```javascript
// src/config/appConfig.js
development: {
  useDevImages: true,           // 개발용 이미지 사용
  showDevBadge: true,          // 개발용 배지 표시
  // ...
}
```

## 비용 절약 팁

1. **개발 중**: 개발용 이미지 사용
2. **테스트 중**: 제한된 API 호출
3. **출시 후**: 사용량 모니터링 및 최적화
4. **캐싱**: 동일한 프롬프트 재사용
5. **압축**: 이미지 품질 최적화

## 모니터링

### 1. API 사용량 추적
- OpenAI 대시보드 모니터링
- 월별 비용 추적
- 사용량 패턴 분석

### 2. 성능 모니터링
- 이미지 생성 시간 측정
- API 응답 시간 추적
- 오류율 모니터링

### 3. 사용자 피드백
- 이미지 품질 피드백 수집
- 사용자 만족도 조사
- 개선점 파악

## 긴급 상황 대응

### API 키 노출 시
1. 즉시 API 키 재발급
2. 환경 변수 업데이트
3. 서버 재시작

### 비용 초과 시
1. 임시로 개발 모드로 전환
2. 사용량 제한 설정
3. 비용 최적화 검토

## Vite 환경 변수 참고사항

### 환경 변수 접두사
- Vite에서는 `VITE_` 접두사가 붙은 환경 변수만 클라이언트에서 접근 가능
- 예: `VITE_API_BASE_URL`, `VITE_APP_MODE`

### 환경별 파일
- `.env.development`: 개발 환경
- `.env.production`: 출시 환경
- `.env.local`: 로컬 환경 (gitignore에 포함)

## 출시 체크리스트

### ✅ 빌드 전 확인사항
- [ ] 환경 변수 설정 완료
- [ ] API 키 설정 완료
- [ ] 개발용 이미지 비활성화
- [ ] 개발용 배지 숨김 설정

### ✅ 빌드 후 확인사항
- [ ] 정적 파일 생성 확인
- [ ] 이미지 생성 테스트
- [ ] API 연결 테스트
- [ ] 성능 최적화 확인

### ✅ 배포 후 확인사항
- [ ] 사이트 접속 확인
- [ ] 이미지 생성 기능 테스트
- [ ] API 사용량 모니터링
- [ ] 오류 로그 확인

## 결론

현재는 개발용 이미지를 사용하여 비용을 절약하고 있습니다. 출시 시에는 환경 변수만 변경하여 실제 OpenAI API를 사용하도록 하면 됩니다. 개발 중에는 계속 개발용 이미지를 사용하여 비용을 관리하세요.

### 핵심 포인트
1. **개발 중**: `VITE_APP_MODE=development` (기본값)
2. **출시 시**: `VITE_APP_MODE=production`
3. **빌드**: `npm run build` (프로덕션 최적화)
4. **배포**: 정적 파일 서빙 (Vite 개발 서버 아님) 