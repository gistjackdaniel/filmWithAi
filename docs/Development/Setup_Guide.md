# SceneForge 개발 환경 설정 가이드

## 개요
이 문서는 SceneForge 프로젝트의 개발 환경을 설정하는 방법을 안내합니다.

## 1. 필수 요구사항

### 1.1 시스템 요구사항
- **Node.js**: 18.0.0 이상
- **npm**: 9.0.0 이상
- **Git**: 2.30.0 이상
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+

### 1.2 권장 사양
- **RAM**: 8GB 이상
- **저장공간**: 10GB 이상
- **CPU**: 4코어 이상

## 2. 개발 환경 설정

### 2.1 Node.js 설치
```bash
# macOS (Homebrew 사용)
brew install node

# Windows (Chocolatey 사용)
choco install nodejs

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 버전 확인
node --version
npm --version
```

### 2.2 Git 설치 및 설정
```bash
# Git 설치 (macOS)
brew install git

# Git 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2.3 코드 에디터 설정
**VS Code 권장 확장 프로그램**:
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer
- Material Icon Theme

## 3. 프로젝트 설정

### 3.1 프로젝트 클론
```bash
# 저장소 클론
git clone <repository-url>
cd filmWithAi

# 의존성 설치
npm install
```

### 3.2 환경 변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**필수 환경 변수**:
```env
# 프론트엔드 환경 변수
VITE_API_BASE_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# 백엔드 환경 변수 (별도 서버)
MONGODB_URI=mongodb://localhost:27017/sceneforge
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3.3 데이터베이스 설정

#### MongoDB 설치
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community

# MongoDB 시작
brew services start mongodb-community

# MongoDB 연결 확인
mongosh
```

#### MongoDB Compass 설치 (GUI 도구)
```bash
# macOS
brew install --cask mongodb-compass

# 또는 공식 웹사이트에서 다운로드
# https://www.mongodb.com/try/download/compass
```

## 4. 개발 서버 실행

### 4.1 프론트엔드 개발 서버
```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 확인
# http://localhost:5173
```

### 4.2 백엔드 개발 서버 (별도 터미널)
```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# API 서버 확인
# http://localhost:3001/api
```

### 4.3 동시 실행
```bash
# 루트 디렉토리에서
npm run dev:all
```

## 5. API 키 설정

### 5.1 Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성
3. OAuth 2.0 클라이언트 ID 생성
4. 승인된 리디렉션 URI 추가:
   - `http://localhost:5173`
   - `http://localhost:5173/auth/callback`

### 5.2 OpenAI API 키 설정
1. [OpenAI Platform](https://platform.openai.com/) 접속
2. API 키 생성
3. 환경 변수에 추가

## 6. 개발 도구 설정

### 6.1 ESLint 설정
```bash
# ESLint 설치
npm install -D eslint

# ESLint 설정 파일 생성
npx eslint --init
```

### 6.2 Prettier 설정
```bash
# Prettier 설치
npm install -D prettier

# Prettier 설정 파일 생성
echo {} > .prettierrc
```

### 6.3 Git Hooks 설정
```bash
# Husky 설치
npm install -D husky lint-staged

# Git hooks 설정
npx husky install
npx husky add .husky/pre-commit "npm run lint-staged"
```

## 7. 테스트 환경 설정

### 7.1 단위 테스트
```bash
# Jest 설치
npm install -D jest @testing-library/react @testing-library/jest-dom

# 테스트 실행
npm test
```

### 7.2 E2E 테스트
```bash
# Playwright 설치
npm install -D @playwright/test

# Playwright 브라우저 설치
npx playwright install

# E2E 테스트 실행
npm run test:e2e
```

## 8. 빌드 및 배포

### 8.1 개발 빌드
```bash
# 프론트엔드 빌드
npm run build

# 빌드 결과 확인
npm run preview
```

### 8.2 프로덕션 빌드
```bash
# 프로덕션 빌드
npm run build:prod

# 빌드 파일 확인
ls dist/
```

## 9. 디버깅 설정

### 9.1 VS Code 디버깅
`.vscode/launch.json` 파일 생성:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 9.2 React Developer Tools
```bash
# Chrome 확장 프로그램 설치
# https://chrome.google.com/webstore/detail/react-developer-tools
```

## 10. 일반적인 문제 해결

### 10.1 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :5173
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### 10.2 의존성 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 10.3 캐시 문제
```bash
# 브라우저 캐시 삭제
# Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# Vite 캐시 삭제
rm -rf node_modules/.vite
```

## 11. 개발 워크플로우

### 11.1 새로운 기능 개발
```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 개발 작업
# ...

# 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 푸시
git push origin feature/new-feature
```

### 11.2 코드 리뷰
```bash
# Pull Request 생성
# GitHub에서 PR 생성

# 코드 리뷰 후 머지
git checkout main
git pull origin main
```

## 12. 성능 최적화

### 12.1 번들 분석
```bash
# 번들 분석 도구 설치
npm install -D vite-bundle-analyzer

# 번들 분석 실행
npm run analyze
```

### 12.2 성능 모니터링
```bash
# Lighthouse CI 설치
npm install -D @lhci/cli

# 성능 테스트 실행
npm run lighthouse
```

---

**문서 버전**: 1.0  
**작성일**: 2024년  
**작성자**: SceneForge 개발팀 