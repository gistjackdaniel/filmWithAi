#!/bin/bash

# SceneForge 서버 기본 환경 설정 스크립트

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

log_info "🚀 SceneForge 서버 기본 환경 설정 시작..."

# 1. 시스템 업데이트
log_info "📦 시스템 업데이트 중..."
sudo apt update && sudo apt upgrade -y
log_success "✅ 시스템 업데이트 완료"

# 2. Node.js 18.x 설치
log_info "📦 Node.js 18.x 설치 중..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "✅ Node.js 설치 완료"
else
    NODE_VERSION=$(node --version)
    log_success "✅ Node.js가 이미 설치되어 있습니다: $NODE_VERSION"
fi

# 3. MongoDB 설치
log_info "📦 MongoDB 설치 중..."
if ! command -v mongod &> /dev/null; then
    # MongoDB GPG 키 추가
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    
    # MongoDB 저장소 추가
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # 패키지 업데이트 및 MongoDB 설치
    sudo apt update
    sudo apt install -y mongodb-org
    
    # MongoDB 서비스 시작 및 자동 시작 설정
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    log_success "✅ MongoDB 설치 완료"
else
    log_success "✅ MongoDB가 이미 설치되어 있습니다"
fi

# 4. Nginx 설치
log_info "📦 Nginx 설치 중..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_success "✅ Nginx 설치 완료"
else
    log_success "✅ Nginx가 이미 설치되어 있습니다"
fi

# 5. PM2 설치
log_info "📦 PM2 설치 중..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    log_success "✅ PM2 설치 완료"
else
    log_success "✅ PM2가 이미 설치되어 있습니다"
fi

# 6. 필수 도구 설치
log_info "📦 필수 도구 설치 중..."
sudo apt install -y curl wget git unzip build-essential

# 7. 프로젝트 디렉토리 생성
log_info "📁 프로젝트 디렉토리 설정 중..."
sudo mkdir -p /var/www/sceneforge
sudo chown $USER:$USER /var/www/sceneforge
log_success "✅ 프로젝트 디렉토리 설정 완료"

# 8. 방화벽 설정
log_info "🔒 방화벽 설정 중..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5001  # 백엔드 포트
sudo ufw --force enable
log_success "✅ 방화벽 설정 완료"

# 9. 로그 디렉토리 생성
log_info "📁 로그 디렉토리 생성 중..."
mkdir -p /var/www/sceneforge/logs
mkdir -p /var/www/sceneforge/backups
log_success "✅ 로그 디렉토리 생성 완료"

# 10. 환경 변수 파일 복사
log_info "🔧 환경 변수 파일 설정 중..."
if [ -f "backend/env.production.example" ]; then
    cp backend/env.production.example backend/.env.production
    log_success "✅ 환경 변수 파일 복사 완료"
    log_warning "⚠️ backend/.env.production 파일을 편집하여 실제 값으로 설정하세요"
else
    log_error "❌ 환경 변수 예제 파일을 찾을 수 없습니다"
fi

# 11. 서비스 상태 확인
log_info "🔍 서비스 상태 확인 중..."

# Node.js 버전 확인
NODE_VERSION=$(node --version)
log_info "   Node.js: $NODE_VERSION"

# npm 버전 확인
NPM_VERSION=$(npm --version)
log_info "   npm: $NPM_VERSION"

# MongoDB 상태 확인
if systemctl is-active --quiet mongod; then
    log_success "   MongoDB: 실행 중"
else
    log_error "   MongoDB: 중지됨"
fi

# Nginx 상태 확인
if systemctl is-active --quiet nginx; then
    log_success "   Nginx: 실행 중"
else
    log_error "   Nginx: 중지됨"
fi

# PM2 상태 확인
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    log_info "   PM2: $PM2_VERSION"
else
    log_error "   PM2: 설치되지 않음"
fi

log_success "🎉 SceneForge 서버 기본 환경 설정이 완료되었습니다!"
log_info "📋 다음 단계:"
log_info "   1. backend/.env.production 파일 편집"
log_info "   2. MongoDB 설정: ./backend/setup-mongodb.sh"
log_info "   3. 프로젝트 배포: ./deploy.sh" 