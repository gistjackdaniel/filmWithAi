#!/bin/bash

# SceneForge Nginx 웹 서버 설정 스크립트

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
DOMAIN="your-domain.com"  # 실제 도메인으로 변경 필요

log_info "🌐 SceneForge Nginx 웹 서버 설정 시작..."

# 1. Nginx 상태 확인
log_info "🔍 Nginx 상태 확인 중..."
if systemctl is-active --quiet nginx; then
    log_success "✅ Nginx가 실행 중입니다"
else
    log_warning "⚠️ Nginx가 실행되지 않았습니다. 시작 중..."
    sudo systemctl start nginx
    if systemctl is-active --quiet nginx; then
        log_success "✅ Nginx가 시작되었습니다"
    else
        log_error "❌ Nginx 시작 실패"
        exit 1
    fi
fi

# 2. 기본 사이트 비활성화
log_info "🔧 기본 사이트 비활성화 중..."
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    log_success "✅ 기본 사이트 비활성화 완료"
fi

# 3. SceneForge 사이트 설정
log_info "🔧 SceneForge 사이트 설정 중..."

# Nginx 설정 파일 생성
sudo tee /etc/nginx/sites-available/sceneforge > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Frontend static files
    location / {
        root /var/www/sceneforge/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy to backend
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket support for real-time features
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Upload files
    location /uploads {
        alias /var/www/sceneforge/backend/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 도메인 이름 업데이트
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/sceneforge

# 4. 사이트 활성화
log_info "🔧 사이트 활성화 중..."
sudo ln -sf /etc/nginx/sites-available/sceneforge /etc/nginx/sites-enabled/

# 5. Nginx 설정 테스트
log_info "🔍 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    log_success "✅ Nginx 설정이 유효합니다"
else
    log_error "❌ Nginx 설정에 오류가 있습니다"
    exit 1
fi

# 6. Nginx 재시작
log_info "🔄 Nginx 재시작 중..."
sudo systemctl reload nginx
log_success "✅ Nginx 재시작 완료"

# 7. SSL 인증서 설정 (Let's Encrypt)
log_info "🔒 SSL 인증서 설정 중..."

# Certbot 설치 확인
if ! command -v certbot &> /dev/null; then
    log_info "📦 Certbot 설치 중..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# SSL 인증서 발급 (도메인이 설정된 경우에만)
if [ "$DOMAIN" != "your-domain.com" ]; then
    log_info "🔒 SSL 인증서 발급 중..."
    if sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN; then
        log_success "✅ SSL 인증서 발급 완료"
    else
        log_warning "⚠️ SSL 인증서 발급 실패 (도메인 설정을 확인하세요)"
    fi
else
    log_warning "⚠️ 도메인이 설정되지 않았습니다. SSL 인증서를 발급할 수 없습니다."
    log_info "📝 도메인 설정 후 다음 명령어로 SSL 인증서를 발급하세요:"
    log_info "   sudo certbot --nginx -d your-domain.com"
fi

# 8. 방화벽 설정 확인
log_info "🔒 방화벽 설정 확인 중..."
if sudo ufw status | grep -q "Nginx Full"; then
    log_success "✅ Nginx 방화벽 규칙이 설정되어 있습니다"
else
    log_warning "⚠️ Nginx 방화벽 규칙을 설정합니다"
    sudo ufw allow 'Nginx Full'
fi

# 9. 서비스 상태 확인
log_info "🔍 서비스 상태 확인 중..."

# Nginx 상태
if systemctl is-active --quiet nginx; then
    log_success "   Nginx: 실행 중"
else
    log_error "   Nginx: 중지됨"
fi

# 백엔드 서버 상태
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    log_success "   백엔드 API: 연결됨"
else
    log_warning "   백엔드 API: 연결 실패"
fi

# 프론트엔드 파일 확인
if [ -d "$PROJECT_DIR/dist" ]; then
    log_success "   프론트엔드: 배포됨"
else
    log_error "   프론트엔드: 배포되지 않음"
fi

log_success "🎉 SceneForge Nginx 웹 서버 설정이 완료되었습니다!"
log_info "📋 설정 정보:"
log_info "   도메인: $DOMAIN"
log_info "   프론트엔드: $PROJECT_DIR/dist"
log_info "   백엔드 API: http://localhost:5001"
log_info "   Nginx 상태: systemctl status nginx"
log_info "   로그 확인: sudo tail -f /var/log/nginx/access.log" 