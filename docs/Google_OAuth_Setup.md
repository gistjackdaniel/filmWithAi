# Google OAuth 설정 가이드

## 🚨 문제 해결: "액세스 차단됨: 승인 오류"

이 오류는 Google OAuth 설정이 올바르지 않을 때 발생합니다. 다음 단계를 따라 설정해주세요.

---

## 📋 1단계: Google Cloud Console 설정

### 1.1 Google Cloud Console 접속
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. Google 계정으로 로그인

### 1.2 프로젝트 생성/선택
1. 상단의 프로젝트 선택 드롭다운 클릭
2. "새 프로젝트" 클릭 (또는 기존 프로젝트 선택)
3. 프로젝트 이름 입력 (예: "SceneForge")
4. "만들기" 클릭

### 1.3 OAuth 동의 화면 설정
1. 왼쪽 메뉴에서 "API 및 서비스" > "OAuth 동의 화면" 클릭
2. 사용자 유형 선택:
   - **외부**: 모든 Google 사용자가 앱에 접근 가능
   - **내부**: 조직 내 사용자만 접근 가능 (Google Workspace 필요)
3. 앱 정보 입력:
   - **앱 이름**: SceneForge
   - **사용자 지원 이메일**: 본인 이메일
   - **개발자 연락처 정보**: 본인 이메일
4. "저장 후 계속" 클릭

### 1.4 사용자 범위 설정
1. "범위" 섹션에서 "범위 추가 또는 삭제" 클릭
2. 다음 범위 추가:
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. "업데이트" 클릭

### 1.5 테스트 사용자 추가 (외부 앱인 경우)
1. "테스트 사용자" 섹션에서 "테스트 사용자 추가" 클릭
2. 본인 Google 이메일 주소 추가
3. "저장 후 계속" 클릭

---

## 🔑 2단계: OAuth 클라이언트 ID 생성

### 2.1 사용자 인증 정보 생성
1. 왼쪽 메뉴에서 "API 및 서비스" > "사용자 인증 정보" 클릭
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 클릭

### 2.2 애플리케이션 유형 선택
1. "애플리케이션 유형"에서 **"웹 애플리케이션"** 선택
2. 이름 입력: "SceneForge Web Client"

### 2.3 승인된 리디렉션 URI 추가
다음 URI들을 추가하세요:

**개발 환경:**
```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
http://127.0.0.1:3000
```

**프로덕션 환경 (배포 시):**
```
https://your-domain.com
https://www.your-domain.com
```

### 2.4 클라이언트 ID 복사
1. "만들기" 클릭
2. 생성된 클라이언트 ID를 복사 (예: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

---

## ⚙️ 3단계: 환경변수 설정

### 3.1 .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Google OAuth 설정
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here

# API 서버 URL (개발 환경)
VITE_API_URL=http://localhost:3000

# 개발 모드
NODE_ENV=development
```

### 3.2 클라이언트 ID 설정
`your_actual_client_id_here` 부분을 2단계에서 복사한 실제 클라이언트 ID로 교체:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## 🔄 4단계: 개발 서버 재시작

### 4.1 서버 재시작
환경변수를 적용하기 위해 개발 서버를 재시작하세요:

```bash
# 현재 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

### 4.2 브라우저 캐시 삭제
1. 브라우저에서 `Ctrl+Shift+R` (하드 리프레시)
2. 또는 개발자 도구 > Application > Storage > Clear storage

---

## ✅ 5단계: 테스트

### 5.1 로그인 테스트
1. 앱에서 "Google로 로그인" 버튼 클릭
2. Google 로그인 팝업이 나타나는지 확인
3. 로그인 성공 시 대시보드로 이동하는지 확인

### 5.2 오류 확인
만약 여전히 오류가 발생한다면:
1. 브라우저 개발자 도구 (F12) 열기
2. Console 탭에서 오류 메시지 확인
3. Network 탭에서 OAuth 요청 상태 확인

---

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. "액세스 차단됨: 승인 오류"
- **원인**: 클라이언트 ID가 잘못되었거나 리디렉션 URI가 설정되지 않음
- **해결**: 2단계의 리디렉션 URI 설정 확인

#### 2. "popup_closed_by_user"
- **원인**: 팝업이 차단되었거나 사용자가 닫음
- **해결**: 브라우저 팝업 차단 해제

#### 3. "access_denied"
- **원인**: 사용자가 로그인을 취소함
- **해결**: 정상적인 동작, 재시도하면 됨

#### 4. "invalid_client"
- **원인**: 클라이언트 ID가 잘못됨
- **해결**: .env 파일의 클라이언트 ID 확인

### 디버깅 팁

1. **개발자 도구 확인**
   - Console에서 오류 메시지 확인
   - Network 탭에서 OAuth 요청 확인

2. **환경변수 확인**
   ```javascript
   console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
   ```

3. **Google Cloud Console 확인**
   - 사용자 인증 정보에서 클라이언트 ID 확인
   - OAuth 동의 화면 설정 확인

---

## 📞 추가 지원

문제가 지속되면 다음을 확인해주세요:

1. **Google Cloud Console 설정** 재확인
2. **환경변수** 올바르게 설정되었는지 확인
3. **브라우저 캐시** 삭제 후 재시도
4. **개발 서버** 재시작

---

**참고**: 이 설정은 개발 환경용입니다. 프로덕션 배포 시에는 추가적인 보안 설정이 필요할 수 있습니다. 