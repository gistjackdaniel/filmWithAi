#!/bin/bash

# SceneForge MongoDB 설정 스크립트

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

log_info "🗄️ SceneForge MongoDB 설정 시작..."

# MongoDB 서비스 상태 확인
if systemctl is-active --quiet mongod; then
    log_success "✅ MongoDB 서비스가 실행 중입니다."
else
    log_warning "⚠️ MongoDB 서비스가 실행되지 않았습니다. 시작 중..."
    sudo systemctl start mongod
    if systemctl is-active --quiet mongod; then
        log_success "✅ MongoDB 서비스가 시작되었습니다."
    else
        log_error "❌ MongoDB 서비스 시작 실패"
        exit 1
    fi
fi

# MongoDB 자동 시작 설정
if systemctl is-enabled --quiet mongod; then
    log_success "✅ MongoDB 자동 시작이 설정되어 있습니다."
else
    log_info "🔧 MongoDB 자동 시작 설정 중..."
    sudo systemctl enable mongod
    log_success "✅ MongoDB 자동 시작이 설정되었습니다."
fi

# 데이터베이스 사용자 생성
log_info "👤 데이터베이스 사용자 생성 중..."

# MongoDB 연결 테스트
if mongo --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    log_success "✅ MongoDB 연결 성공"
else
    log_error "❌ MongoDB 연결 실패"
    exit 1
fi

# 데이터베이스 및 사용자 생성 스크립트
cat > /tmp/setup_mongodb.js << 'EOF'
// SceneForge 데이터베이스 설정
use sceneforge_db

// 기존 사용자가 있다면 삭제
db.dropUser("sceneforge_user")

// 새 사용자 생성
db.createUser({
  user: "sceneforge_user",
  pwd: "sceneforge_secure_password_2024",
  roles: [
    { role: "readWrite", db: "sceneforge_db" },
    { role: "dbAdmin", db: "sceneforge_db" }
  ]
})

// 컬렉션 생성 (인덱스 포함)
db.createCollection("users")
db.createCollection("projects")
db.createCollection("contes")

// 인덱스 생성
db.users.createIndex({ "email": 1 }, { unique: true })
db.projects.createIndex({ "userId": 1 })
db.projects.createIndex({ "createdAt": -1 })
db.contes.createIndex({ "projectId": 1 })
db.contes.createIndex({ "createdAt": -1 })

print("✅ SceneForge 데이터베이스 설정 완료")
EOF

# MongoDB 설정 실행
if mongo < /tmp/setup_mongodb.js; then
    log_success "✅ 데이터베이스 사용자 및 컬렉션 생성 완료"
else
    log_error "❌ 데이터베이스 설정 실패"
    exit 1
fi

# 임시 파일 정리
rm -f /tmp/setup_mongodb.js

# 백업 디렉토리 생성
mkdir -p ./backups

# 백업 스크립트 권한 설정
if [ -f "./backup.sh" ]; then
    chmod +x ./backup.sh
    log_success "✅ 백업 스크립트 권한 설정 완료"
fi

# MongoDB 보안 설정
log_info "🔒 MongoDB 보안 설정 중..."

# MongoDB 설정 파일 백업
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# 보안 설정 추가
sudo tee -a /etc/mongod.conf > /dev/null << 'EOF'

# Security settings
security:
  authorization: enabled
EOF

# MongoDB 재시작
log_info "🔄 MongoDB 재시작 중..."
sudo systemctl restart mongod

# 재시작 후 연결 테스트
sleep 3
if systemctl is-active --quiet mongod; then
    log_success "✅ MongoDB 재시작 완료"
else
    log_error "❌ MongoDB 재시작 실패"
    exit 1
fi

log_success "🎉 SceneForge MongoDB 설정이 완료되었습니다!"
log_info "📊 설정 정보:"
log_info "   데이터베이스: sceneforge_db"
log_info "   사용자: sceneforge_user"
log_info "   백업 스크립트: ./backup.sh"
log_info "   서비스 상태: systemctl status mongod" 