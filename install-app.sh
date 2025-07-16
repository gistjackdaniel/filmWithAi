#!/bin/bash

# SceneForge 애플리케이션 배포 스크립트

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정
PROJECT_DIR="/var/www/sceneforge"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR"

log_info "🚀 SceneForge 애플리케이션 배포 시작..."

# 1. 프로젝트 디렉토리로 이동
log_info "📁 프로젝트 디렉토리 설정 중..."
cd $PROJECT_DIR

# 2. Git 저장소에서 프로젝트 클론 (이미 있는 경우 업데이트)
if [ -d ".git" ]; then
    log_info "📦 Git 저장소 업데이트 중..."
    git pull origin main
else
    log_info "📦 Git 저장소 클론 중..."
    # 실제 Git 저장소 URL로 변경 필요
    # git clone https://github.com/your-username/filmWithAi.git .
fi

# 3. 백엔드 의존성 설치
log_info "📦 백엔드 의존성 설치 중..."
cd $BACKEND_DIR
npm install --production
cd $PROJECT_DIR

# 4. 프론트엔드 의존성 설치
log_info "📦 프론트엔드 의존성 설치 중..."
npm install

# 5. 프론트엔드 빌드
log_info "🔨 프론트엔드 빌드 중..."
npm run build

# 6. 환경 변수 설정 확인
log_info "🔧 환경 변수 설정 확인 중..."
if [ ! -f "$BACKEND_DIR/.env.production" ]; then
    log_warning "⚠️ 환경 변수 파일이 없습니다. 예제 파일을 복사합니다."
    if [ -f "$BACKEND_DIR/env.production.example" ]; then
        cp $BACKEND_DIR/env.production.example $BACKEND_DIR/.env.production
        log_success "✅ 환경 변수 파일 복사 완료"
        log_warning "⚠️ $BACKEND_DIR/.env.production 파일을 편집하여 실제 값으로 설정하세요"
    else
        log_error "❌ 환경 변수 예제 파일을 찾을 수 없습니다"
        exit 1
    fi
fi

# 7. 업로드 디렉토리 생성
log_info "📁 업로드 디렉토리 생성 중..."
mkdir -p $BACKEND_DIR/uploads/images
chmod 755 $BACKEND_DIR/uploads
chmod 755 $BACKEND_DIR/uploads/images

# 8. PM2로 백엔드 서버 시작
log_info "🔄 PM2로 백엔드 서버 시작 중..."
cd $PROJECT_DIR

# 기존 프로세스가 있다면 중지
if pm2 list | grep -q "sceneforge-backend"; then
    pm2 stop sceneforge-backend
    pm2 delete sceneforge-backend
fi

# 새 프로세스 시작
pm2 start ecosystem.config.js --env production

# PM2 설정 저장
pm2 save

# PM2 자동 시작 설정
pm2 startup

# 9. 서비스 상태 확인
log_info "🔍 서비스 상태 확인 중..."
sleep 5

if pm2 list | grep -q "sceneforge-backend"; then
    STATUS=$(pm2 list | grep "sceneforge-backend" | awk '{print $10}')
    if [ "$STATUS" = "online" ]; then
        log_success "✅ 백엔드 서버가 성공적으로 시작되었습니다!"
    else
        log_error "❌ 백엔드 서버 시작 실패. 상태: $STATUS"
        pm2 logs sceneforge-backend --lines 20
        exit 1
    fi
else
    log_error "❌ PM2 프로세스를 찾을 수 없습니다"
    exit 1
fi

# 10. API 연결 테스트
log_info "🌐 API 연결 테스트 중..."
sleep 3

if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    log_success "✅ API 연결 성공"
else
    log_warning "⚠️ API 연결 실패 (서버가 아직 시작되지 않았을 수 있습니다)"
fi

# 11. 빌드 결과 확인
log_info "📊 빌드 결과 확인 중..."
if [ -d "$PROJECT_DIR/dist" ]; then
    BUILD_SIZE=$(du -sh $PROJECT_DIR/dist | cut -f1)
    log_success "✅ 프론트엔드 빌드 완료 (크기: $BUILD_SIZE)"
else
    log_error "❌ 프론트엔드 빌드 실패"
    exit 1
fi

log_success "🎉 SceneForge 애플리케이션 배포가 완료되었습니다!"
log_info "📋 배포 정보:"
log_info "   백엔드 포트: 5001"
log_info "   프론트엔드: $PROJECT_DIR/dist"
log_info "   로그 확인: pm2 logs sceneforge-backend"
log_info "   상태 확인: pm2 list" 