#!/bin/bash

# SceneForge 전체 배포 마스터 스크립트

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

log_info "🚀 SceneForge 전체 배포 시작..."

# 1. 서버 기본 환경 설정
log_info "📋 1단계: 서버 기본 환경 설정"
if [ -f "./setup-server.sh" ]; then
    ./setup-server.sh
    if [ $? -eq 0 ]; then
        log_success "✅ 서버 기본 환경 설정 완료"
    else
        log_error "❌ 서버 기본 환경 설정 실패"
        exit 1
    fi
else
    log_error "❌ setup-server.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 2. MongoDB 설정
log_info "📋 2단계: MongoDB 설정"
if [ -f "./backend/setup-mongodb.sh" ]; then
    ./backend/setup-mongodb.sh
    if [ $? -eq 0 ]; then
        log_success "✅ MongoDB 설정 완료"
    else
        log_error "❌ MongoDB 설정 실패"
        exit 1
    fi
else
    log_error "❌ setup-mongodb.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 3. 애플리케이션 배포
log_info "📋 3단계: 애플리케이션 배포"
if [ -f "./install-app.sh" ]; then
    ./install-app.sh
    if [ $? -eq 0 ]; then
        log_success "✅ 애플리케이션 배포 완료"
    else
        log_error "❌ 애플리케이션 배포 실패"
        exit 1
    fi
else
    log_error "❌ install-app.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 4. 웹 서버 설정
log_info "📋 4단계: 웹 서버 설정"
if [ -f "./setup-nginx.sh" ]; then
    ./setup-nginx.sh
    if [ $? -eq 0 ]; then
        log_success "✅ 웹 서버 설정 완료"
    else
        log_error "❌ 웹 서버 설정 실패"
        exit 1
    fi
else
    log_error "❌ setup-nginx.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 5. 모니터링 설정
log_info "📋 5단계: 모니터링 설정"
if [ -f "./setup-monitoring.sh" ]; then
    ./setup-monitoring.sh
    if [ $? -eq 0 ]; then
        log_success "✅ 모니터링 설정 완료"
    else
        log_error "❌ 모니터링 설정 실패"
        exit 1
    fi
else
    log_error "❌ setup-monitoring.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 6. 보안 강화
log_info "📋 6단계: 보안 강화"
if [ -f "./setup-security.sh" ]; then
    ./setup-security.sh
    if [ $? -eq 0 ]; then
        log_success "✅ 보안 강화 완료"
    else
        log_error "❌ 보안 강화 실패"
        exit 1
    fi
else
    log_error "❌ setup-security.sh 파일을 찾을 수 없습니다"
    exit 1
fi

# 7. 성능 최적화 (선택사항)
log_info "📋 7단계: 성능 최적화 (선택사항)"
read -p "성능 최적화를 진행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "./setup-optimization.sh" ]; then
        ./setup-optimization.sh
        if [ $? -eq 0 ]; then
            log_success "✅ 성능 최적화 완료"
        else
            log_error "❌ 성능 최적화 실패"
        fi
    else
        log_error "❌ setup-optimization.sh 파일을 찾을 수 없습니다"
    fi
else
    log_info "⏭️ 성능 최적화를 건너뜁니다"
fi

# 8. 최종 상태 확인
log_info "📋 8단계: 최종 상태 확인"

# 서비스 상태 확인
echo ""
echo "=== 서비스 상태 확인 ==="

# PM2 상태
if pm2 list | grep -q "sceneforge-backend"; then
    STATUS=$(pm2 list | grep "sceneforge-backend" | awk '{print $10}')
    if [ "$STATUS" = "online" ]; then
        log_success "   PM2 백엔드: 실행 중"
    else
        log_error "   PM2 백엔드: $STATUS"
    fi
else
    log_error "   PM2 백엔드: 실행되지 않음"
fi

# MongoDB 상태
if systemctl is-active --quiet mongod; then
    log_success "   MongoDB: 실행 중"
else
    log_error "   MongoDB: 중지됨"
fi

# Nginx 상태
if systemctl is-active --quiet nginx; then
    log_success "   Nginx: 실행 중"
else
    log_error "   Nginx: 중지됨"
fi

# API 연결 테스트
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    log_success "   API 연결: 정상"
else
    log_error "   API 연결: 실패"
fi

# 웹페이지 연결 테스트
if curl -s http://localhost/ > /dev/null 2>&1; then
    log_success "   웹페이지: 접속 가능"
else
    log_error "   웹페이지: 접속 실패"
fi

# 9. 배포 완료 메시지
echo ""
log_success "🎉 SceneForge 전체 배포가 완료되었습니다!"
echo ""
log_info "📋 배포 완료 정보:"
log_info "   웹사이트: http://localhost (또는 서버 IP)"
log_info "   API 엔드포인트: http://localhost:5001"
log_info "   관리 도구:"
log_info "     - PM2 상태: pm2 list"
log_info "     - 로그 확인: pm2 logs sceneforge-backend"
log_info "     - 모니터링: ./monitor.sh"
log_info "     - 성능 테스트: ./performance-test.sh"
echo ""
log_warning "⚠️ 다음 사항을 확인하세요:"
log_warning "   1. backend/.env.production 파일의 환경 변수 설정"
log_warning "   2. 도메인 설정 및 SSL 인증서 발급"
log_warning "   3. 방화벽 설정 확인"
log_warning "   4. 백업 스케줄 확인"
echo ""
log_info "📞 문제가 발생하면 로그를 확인하세요:"
log_info "   - 애플리케이션 로그: pm2 logs"
log_info "   - Nginx 로그: sudo tail -f /var/log/nginx/error.log"
log_info "   - 시스템 로그: sudo journalctl -u nginx" 