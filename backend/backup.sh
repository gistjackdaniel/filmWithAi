#!/bin/bash

# SceneForge 데이터베이스 백업 스크립트

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
BACKUP_DIR="./backups"
DB_NAME="sceneforge_db"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="sceneforge_backup_${TIMESTAMP}"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

log_info "🗄️ SceneForge 데이터베이스 백업 시작..."

# MongoDB 백업
if command -v mongodump &> /dev/null; then
    log_info "📦 MongoDB 백업 중..."
    
    if mongodump --db $DB_NAME --out "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
        log_success "✅ MongoDB 백업 완료: $BACKUP_DIR/$BACKUP_FILE"
        
        # 백업 파일 압축
        log_info "🗜️ 백업 파일 압축 중..."
        cd $BACKUP_DIR
        tar -czf "${BACKUP_FILE}.tar.gz" "$BACKUP_FILE"
        rm -rf "$BACKUP_FILE"
        cd ..
        
        log_success "✅ 압축 완료: $BACKUP_DIR/${BACKUP_FILE}.tar.gz"
        
        # 오래된 백업 파일 정리 (30일 이상)
        log_info "🧹 오래된 백업 파일 정리 중..."
        find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
        
        log_success "🎉 백업이 성공적으로 완료되었습니다!"
    else
        log_error "❌ MongoDB 백업 실패"
        exit 1
    fi
else
    log_error "❌ mongodump가 설치되지 않았습니다."
    log_info "📝 MongoDB 설치 방법:"
    log_info "   Ubuntu/Debian: sudo apt install mongodb-clients"
    log_info "   CentOS/RHEL: sudo yum install mongodb"
    exit 1
fi

# 백업 정보 출력
BACKUP_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_FILE}.tar.gz" | cut -f1)
log_info "📊 백업 정보:"
log_info "   파일: ${BACKUP_FILE}.tar.gz"
log_info "   크기: $BACKUP_SIZE"
log_info "   위치: $BACKUP_DIR" 