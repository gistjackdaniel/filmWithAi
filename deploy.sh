#!/bin/bash

# SceneForge AWS 배포 스크립트
# 사용법: ./deploy.sh [production|development]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 환경 설정
ENVIRONMENT=${1:-production}
PROJECT_NAME="sceneforge"
BACKEND_DIR="./backend"
FRONTEND_DIR="."

log_info "🚀 SceneForge 배포 시작 (환경: $ENVIRONMENT)"

# 1. 의존성 확인
log_info "📦 의존성 확인 중..."
if ! command -v node &> /dev/null; then
    log_error "Node.js가 설치되지 않았습니다."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "npm이 설치되지 않았습니다."
    exit 1
fi

# 2. 환경 변수 파일 확인
log_info "🔧 환경 변수 파일 확인 중..."
if [ ! -f "$BACKEND_DIR/env.production.example" ]; then
    log_error "환경 변수 예제 파일이 없습니다: $BACKEND_DIR/env.production.example"
    exit 1
fi

# 3. 백엔드 의존성 설치
log_info "📦 백엔드 의존성 설치 중..."
cd $BACKEND_DIR
npm install --production
cd ..

# 4. 프론트엔드 의존성 설치
log_info "📦 프론트엔드 의존성 설치 중..."
npm install

# 5. 프론트엔드 빌드
log_info "🔨 프론트엔드 빌드 중..."
npm run build

# 6. 로그 디렉토리 생성
log_info "📁 로그 디렉토리 생성 중..."
mkdir -p logs

# 7. PM2 프로세스 재시작
log_info "🔄 PM2 프로세스 재시작 중..."
if pm2 list | grep -q "$PROJECT_NAME-backend"; then
    pm2 restart "$PROJECT_NAME-backend" --env $ENVIRONMENT
else
    pm2 start ecosystem.config.js --env $ENVIRONMENT
fi

# 8. PM2 설정 저장
log_info "💾 PM2 설정 저장 중..."
pm2 save

# 9. 배포 완료 확인
log_info "✅ 배포 완료 확인 중..."
sleep 3

# 10. 서비스 상태 확인
if pm2 list | grep -q "$PROJECT_NAME-backend"; then
    STATUS=$(pm2 list | grep "$PROJECT_NAME-backend" | awk '{print $10}')
    if [ "$STATUS" = "online" ]; then
        log_success "✅ 배포가 성공적으로 완료되었습니다!"
        log_info "🌐 서비스 상태: $STATUS"
        log_info "📊 PM2 상태 확인: pm2 list"
        log_info "📋 로그 확인: pm2 logs $PROJECT_NAME-backend"
    else
        log_error "❌ 서비스가 정상적으로 시작되지 않았습니다. 상태: $STATUS"
        pm2 logs "$PROJECT_NAME-backend" --lines 20
        exit 1
    fi
else
    log_error "❌ PM2 프로세스를 찾을 수 없습니다."
    exit 1
fi

log_success "🎉 SceneForge 배포가 완료되었습니다!" 