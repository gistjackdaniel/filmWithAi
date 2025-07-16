#!/bin/bash

# SceneForge 성능 최적화 스크립트

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

log_info "⚡ SceneForge 성능 최적화 설정 시작..."

# 1. CDN 설정 (CloudFront)
log_info "☁️ CDN 설정 중..."

# CloudFront 배포 스크립트 생성
cat > $PROJECT_DIR/setup-cloudfront.sh << 'EOF'
#!/bin/bash

# CloudFront 배포 스크립트
# AWS CLI가 설치되어 있어야 합니다

DOMAIN="your-domain.com"
S3_BUCKET="sceneforge-static-assets"

echo "CloudFront 배포를 위한 설정..."
echo "1. S3 버킷 생성: $S3_BUCKET"
echo "2. CloudFront 배포 생성"
echo "3. 도메인 연결"

# S3 버킷 생성 (정적 자산용)
aws s3 mb s3://$S3_BUCKET --region us-east-1

# 정적 자산 업로드
aws s3 sync /var/www/sceneforge/dist s3://$S3_BUCKET --delete

# CloudFront 배포 생성
aws cloudfront create-distribution \
    --origin-domain-name $S3_BUCKET.s3.amazonaws.com \
    --default-root-object index.html \
    --aliases $DOMAIN

echo "CloudFront 배포가 완료되었습니다."
EOF

chmod +x $PROJECT_DIR/setup-cloudfront.sh

log_success "✅ CDN 설정 스크립트 생성 완료"

# 2. 로드 밸런서 설정 (ALB)
log_info "⚖️ 로드 밸런서 설정 중..."

# ALB 설정 스크립트 생성
cat > $PROJECT_DIR/setup-alb.sh << 'EOF'
#!/bin/bash

# Application Load Balancer 설정 스크립트

VPC_ID="vpc-xxxxxxxxx"
SUBNET_IDS="subnet-xxxxxxxxx,subnet-yyyyyyyyy"
SECURITY_GROUP_ID="sg-xxxxxxxxx"

echo "ALB 설정을 위한 정보..."
echo "VPC ID: $VPC_ID"
echo "Subnet IDs: $SUBNET_IDS"
echo "Security Group ID: $SECURITY_GROUP_ID"

# ALB 생성
aws elbv2 create-load-balancer \
    --name sceneforge-alb \
    --subnets $SUBNET_IDS \
    --security-groups $SECURITY_GROUP_ID \
    --scheme internet-facing \
    --type application

echo "ALB가 생성되었습니다."
EOF

chmod +x $PROJECT_DIR/setup-alb.sh

log_success "✅ 로드 밸런서 설정 스크립트 생성 완료"

# 3. Auto Scaling 설정
log_info "📈 Auto Scaling 설정 중..."

# Auto Scaling 그룹 설정 스크립트 생성
cat > $PROJECT_DIR/setup-autoscaling.sh << 'EOF'
#!/bin/bash

# Auto Scaling 그룹 설정 스크립트

LAUNCH_TEMPLATE_ID="lt-xxxxxxxxx"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:region:account:targetgroup/sceneforge-tg/xxxxxxxxx"

echo "Auto Scaling 그룹 설정..."
echo "Launch Template ID: $LAUNCH_TEMPLATE_ID"
echo "Target Group ARN: $TARGET_GROUP_ARN"

# Auto Scaling 그룹 생성
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name sceneforge-asg \
    --launch-template LaunchTemplateId=$LAUNCH_TEMPLATE_ID \
    --min-size 2 \
    --max-size 10 \
    --desired-capacity 2 \
    --target-group-arns $TARGET_GROUP_ARN \
    --vpc-zone-identifier "subnet-xxxxxxxxx,subnet-yyyyyyyyy"

# 스케일링 정책 설정
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name sceneforge-asg \
    --policy-name scale-up-cpu \
    --scaling-adjustment 1 \
    --adjustment-type ChangeInCapacity \
    --cooldown 300

echo "Auto Scaling 그룹이 설정되었습니다."
EOF

chmod +x $PROJECT_DIR/setup-autoscaling.sh

log_success "✅ Auto Scaling 설정 스크립트 생성 완료"

# 4. 캐싱 전략 구현
log_info "💾 캐싱 전략 구현 중..."

# Redis 설치 및 설정
if ! command -v redis-server &> /dev/null; then
    log_info "📦 Redis 설치 중..."
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    log_success "✅ Redis 설치 완료"
fi

# Redis 설정 최적화
sudo tee -a /etc/redis/redis.conf > /dev/null << 'EOF'

# Performance optimizations
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

sudo systemctl restart redis-server

# Node.js 캐싱 미들웨어 생성
cat > $PROJECT_DIR/backend/middleware/cache.js << 'EOF'
const redis = require('redis');
const client = redis.createClient();

// 캐싱 미들웨어
const cacheMiddleware = (duration = 300) => {
    return (req, res, next) => {
        const key = `cache:${req.originalUrl}`;
        
        client.get(key, (err, data) => {
            if (err) {
                console.error('Redis 오류:', err);
                return next();
            }
            
            if (data) {
                return res.json(JSON.parse(data));
            }
            
            // 원본 응답을 캐시에 저장
            const originalSend = res.json;
            res.json = function(data) {
                client.setex(key, duration, JSON.stringify(data));
                originalSend.call(this, data);
            };
            
            next();
        });
    };
};

module.exports = { cacheMiddleware, client };
EOF

log_success "✅ 캐싱 전략 구현 완료"

# 5. MongoDB 인덱스 최적화
log_info "🗄️ MongoDB 인덱스 최적화 중..."

# MongoDB 인덱스 최적화 스크립트 생성
cat > $PROJECT_DIR/backend/scripts/optimizeIndexes.js << 'EOF'
// MongoDB 인덱스 최적화 스크립트

const mongoose = require('mongoose');

async function optimizeIndexes() {
    try {
        const db = mongoose.connection;
        
        // 사용자 컬렉션 인덱스
        await db.collection('users').createIndex({ "email": 1 }, { unique: true });
        await db.collection('users').createIndex({ "createdAt": -1 });
        
        // 프로젝트 컬렉션 인덱스
        await db.collection('projects').createIndex({ "userId": 1 });
        await db.collection('projects').createIndex({ "createdAt": -1 });
        await db.collection('projects').createIndex({ "title": "text", "synopsis": "text" });
        
        // 콘티 컬렉션 인덱스
        await db.collection('contes').createIndex({ "projectId": 1 });
        await db.collection('contes').createIndex({ "createdAt": -1 });
        await db.collection('contes').createIndex({ "status": 1 });
        
        console.log('✅ MongoDB 인덱스 최적화 완료');
    } catch (error) {
        console.error('❌ 인덱스 최적화 오류:', error);
    }
}

optimizeIndexes();
EOF

log_success "✅ MongoDB 인덱스 최적화 스크립트 생성 완료"

# 6. 이미지 압축 및 최적화
log_info "🖼️ 이미지 압축 및 최적화 중..."

# 이미지 최적화 도구 설치
if ! command -v imagemagick &> /dev/null; then
    sudo apt install -y imagemagick
fi

# 이미지 최적화 스크립트 생성
cat > $PROJECT_DIR/backend/scripts/optimizeImages.js << 'EOF'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const uploadsDir = path.join(__dirname, '../uploads/images');

function optimizeImages() {
    if (!fs.existsSync(uploadsDir)) {
        console.log('업로드 디렉토리가 없습니다.');
        return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    
    console.log(`${imageFiles.length}개의 이미지 파일을 최적화합니다...`);
    
    imageFiles.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        const outputPath = path.join(uploadsDir, `optimized_${file}`);
        
        // ImageMagick을 사용한 이미지 최적화
        exec(`convert "${filePath}" -quality 85 -strip "${outputPath}"`, (error) => {
            if (error) {
                console.error(`이미지 최적화 실패: ${file}`, error);
            } else {
                console.log(`✅ ${file} 최적화 완료`);
                // 원본 파일 백업 후 최적화된 파일로 교체
                fs.renameSync(outputPath, filePath);
            }
        });
    });
}

optimizeImages();
EOF

log_success "✅ 이미지 최적화 스크립트 생성 완료"

# 7. PM2 클러스터 모드 설정
log_info "🔄 PM2 클러스터 모드 설정 중..."

# PM2 설정 업데이트
cat > $PROJECT_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sceneforge-backend',
    script: './backend/server.js',
    instances: 'max', // CPU 코어 수만큼 인스턴스 생성
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 클러스터 모드 최적화 설정
    kill_timeout: 5000,
    listen_timeout: 3000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

log_success "✅ PM2 클러스터 모드 설정 완료"

# 8. Nginx 캐싱 설정
log_info "🌐 Nginx 캐싱 설정 중..."

# Nginx 캐싱 설정 추가
sudo tee /etc/nginx/conf.d/caching.conf > /dev/null << 'EOF'
# Nginx 캐싱 설정

# 정적 파일 캐싱
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}

# API 응답 캐싱
location /api {
    # 캐시 설정
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 5s;
    
    # 캐시 키 설정
    proxy_cache_key "$scheme$request_method$host$request_uri";
    
    # 캐시 헤더 추가
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Gzip 압축 최적화
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
EOF

# Nginx 설정 테스트 및 재시작
if sudo nginx -t; then
    sudo systemctl reload nginx
    log_success "✅ Nginx 캐싱 설정 완료"
else
    log_error "❌ Nginx 설정 오류"
fi

# 9. 성능 모니터링 도구 설치
log_info "📊 성능 모니터링 도구 설치 중..."

# New Relic 설치 (선택사항)
if ! command -v newrelic &> /dev/null; then
    log_info "📦 New Relic 설치 중..."
    # New Relic 설치 스크립트 (라이센스 키 필요)
    # curl -L https://download.newrelic.com/php_agent/release/newrelic-php5-{VERSION}.tar.gz | tar -C /tmp -zx
fi

# 성능 테스트 도구 설치
sudo apt install -y apache2-utils siege

log_success "✅ 성능 모니터링 도구 설치 완료"

# 10. 성능 테스트 스크립트 생성
log_info "🧪 성능 테스트 스크립트 생성 중..."

cat > $PROJECT_DIR/performance-test.sh << 'EOF'
#!/bin/bash

# SceneForge 성능 테스트 스크립트

echo "=== SceneForge 성능 테스트 ==="
echo "시간: $(date)"
echo ""

# 1. API 응답 시간 테스트
echo "=== API 응답 시간 테스트 ==="
ab -n 100 -c 10 http://localhost:5001/health
echo ""

# 2. 웹페이지 로딩 시간 테스트
echo "=== 웹페이지 로딩 시간 테스트 ==="
curl -s -w "응답 시간: %{time_total}s\n" -o /dev/null http://localhost/
echo ""

# 3. 시스템 리소스 사용률
echo "=== 시스템 리소스 사용률 ==="
echo "CPU 사용률: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "메모리 사용률: $(free | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}')"
echo "디스크 사용률: $(df / | tail -1 | awk '{print $5}')"
echo ""

# 4. PM2 프로세스 상태
echo "=== PM2 프로세스 상태 ==="
pm2 list
echo ""

# 5. Redis 캐시 상태
echo "=== Redis 캐시 상태 ==="
redis-cli info memory | grep used_memory_human
echo ""
EOF

chmod +x $PROJECT_DIR/performance-test.sh

log_success "✅ 성능 테스트 스크립트 생성 완료"

# 11. 최적화 상태 확인
log_info "🔍 최적화 상태 확인 중..."

# Redis 상태
if systemctl is-active --quiet redis-server; then
    log_success "   Redis: 실행 중"
else
    log_error "   Redis: 중지됨"
fi

# PM2 클러스터 상태
if pm2 list | grep -q "sceneforge-backend"; then
    INSTANCE_COUNT=$(pm2 list | grep "sceneforge-backend" | wc -l)
    log_success "   PM2 클러스터: $INSTANCE_COUNT 인스턴스 실행 중"
else
    log_error "   PM2 클러스터: 실행되지 않음"
fi

# Nginx 캐싱 설정 확인
if grep -q "proxy_cache" /etc/nginx/conf.d/caching.conf; then
    log_success "   Nginx 캐싱: 설정됨"
else
    log_warning "   Nginx 캐싱: 설정되지 않음"
fi

log_success "🎉 SceneForge 성능 최적화 설정이 완료되었습니다!"
log_info "📋 최적화 설정 정보:"
log_info "   CDN 설정: $PROJECT_DIR/setup-cloudfront.sh"
log_info "   로드 밸런서: $PROJECT_DIR/setup-alb.sh"
log_info "   Auto Scaling: $PROJECT_DIR/setup-autoscaling.sh"
log_info "   성능 테스트: $PROJECT_DIR/performance-test.sh"
log_info "   Redis 상태: systemctl status redis-server"
log_info "   PM2 상태: pm2 list" 