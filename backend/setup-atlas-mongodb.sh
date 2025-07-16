#!/bin/bash

# SceneForge MongoDB Atlas 설정 스크립트

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

log_info "🗄️ SceneForge MongoDB Atlas 설정 시작..."

# 환경 변수 파일 확인
if [ ! -f ".env.production" ]; then
    log_error "❌ .env.production 파일이 없습니다."
    log_info "📝 다음 단계를 따라주세요:"
    log_info "   1. backend/.env.production 파일 생성"
    log_info "   2. MONGODB_URI 설정 (Atlas 연결 문자열)"
    log_info "   3. 기타 환경 변수 설정"
    exit 1
fi

# MongoDB Atlas 연결 테스트
log_info "🔗 MongoDB Atlas 연결 테스트 중..."

# Node.js를 사용한 연결 테스트
cat > /tmp/test_atlas_connection.js << 'EOF'
require('dotenv').config({ path: '.env.production' });
const { MongoClient } = require('mongodb');

async function testConnection() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ MongoDB Atlas 연결 성공');
        
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('📊 기존 컬렉션:', collections.map(c => c.name));
        
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ MongoDB Atlas 연결 실패:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF

# 연결 테스트 실행
if node /tmp/test_atlas_connection.js; then
    log_success "✅ MongoDB Atlas 연결 성공"
else
    log_error "❌ MongoDB Atlas 연결 실패"
    log_info "📋 문제 해결 방법:"
    log_info "   1. Atlas Network Access에서 현재 IP 추가"
    log_info "   2. .env.production의 MONGODB_URI 확인"
    log_info "   3. Atlas 사용자명/비밀번호 확인"
    rm -f /tmp/test_atlas_connection.js
    exit 1
fi

# 임시 파일 정리
rm -f /tmp/test_atlas_connection.js

# 데이터베이스 초기화 스크립트 생성
log_info "🗂️ 데이터베이스 초기화 스크립트 생성 중..."

cat > /tmp/init_atlas_db.js << 'EOF'
require('dotenv').config({ path: '.env.production' });
const { MongoClient } = require('mongodb');

async function initDatabase() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        
        const db = client.db();
        
        // 컬렉션 생성
        const collections = ['users', 'projects', 'contes'];
        for (const collectionName of collections) {
            try {
                await db.createCollection(collectionName);
                console.log(`✅ 컬렉션 생성: ${collectionName}`);
            } catch (error) {
                if (error.code === 48) { // 이미 존재하는 컬렉션
                    console.log(`ℹ️ 컬렉션 이미 존재: ${collectionName}`);
                } else {
                    console.error(`❌ 컬렉션 생성 실패: ${collectionName}`, error.message);
                }
            }
        }
        
        // 인덱스 생성
        try {
            await db.collection('users').createIndex({ "email": 1 }, { unique: true });
            console.log('✅ users.email 인덱스 생성');
        } catch (error) {
            console.log('ℹ️ users.email 인덱스 이미 존재');
        }
        
        try {
            await db.collection('projects').createIndex({ "userId": 1 });
            console.log('✅ projects.userId 인덱스 생성');
        } catch (error) {
            console.log('ℹ️ projects.userId 인덱스 이미 존재');
        }
        
        try {
            await db.collection('projects').createIndex({ "createdAt": -1 });
            console.log('✅ projects.createdAt 인덱스 생성');
        } catch (error) {
            console.log('ℹ️ projects.createdAt 인덱스 이미 존재');
        }
        
        try {
            await db.collection('contes').createIndex({ "projectId": 1 });
            console.log('✅ contes.projectId 인덱스 생성');
        } catch (error) {
            console.log('ℹ️ contes.projectId 인덱스 이미 존재');
        }
        
        try {
            await db.collection('contes').createIndex({ "createdAt": -1 });
            console.log('✅ contes.createdAt 인덱스 생성');
        } catch (error) {
            console.log('ℹ️ contes.createdAt 인덱스 이미 존재');
        }
        
        await client.close();
        console.log('🎉 SceneForge Atlas 데이터베이스 초기화 완료');
        process.exit(0);
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error.message);
        process.exit(1);
    }
}

initDatabase();
EOF

# 데이터베이스 초기화 실행
if node /tmp/init_atlas_db.js; then
    log_success "✅ 데이터베이스 초기화 완료"
else
    log_error "❌ 데이터베이스 초기화 실패"
    rm -f /tmp/init_atlas_db.js
    exit 1
fi

# 임시 파일 정리
rm -f /tmp/init_atlas_db.js

# 백업 디렉토리 생성
mkdir -p ./backups

log_success "🎉 SceneForge MongoDB Atlas 설정이 완료되었습니다!"
log_info "📊 설정 정보:"
log_info "   데이터베이스: Atlas 클러스터"
log_info "   연결: MONGODB_URI 환경 변수"
log_info "   백업: ./backup.sh"
log_info "   서비스: PM2로 관리" 