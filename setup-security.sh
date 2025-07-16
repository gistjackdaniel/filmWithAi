#!/bin/bash

# SceneForge 보안 강화 스크립트

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

log_info "🔒 SceneForge 보안 강화 설정 시작..."

# 1. 방화벽 설정
log_info "🔥 방화벽 설정 중..."

# UFW 활성화
sudo ufw --force enable

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 접속 허용
sudo ufw allow ssh

# HTTP/HTTPS 허용
sudo ufw allow 'Nginx Full'

# 백엔드 API 포트 허용
sudo ufw allow 5001

# MongoDB 포트 차단 (로컬에서만 접근)
sudo ufw deny 27017

log_success "✅ 방화벽 설정 완료"

# 2. SSH 보안 설정
log_info "🔐 SSH 보안 설정 중..."

# SSH 설정 파일 백업
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# SSH 보안 설정 적용
sudo tee -a /etc/ssh/sshd_config > /dev/null << 'EOF'

# Security settings
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
Protocol 2
HostKeyAlgorithms ssh-rsa,ssh-dss
KexAlgorithms diffie-hellman-group14-sha256,curve25519-sha256@libssh.org
Ciphers aes128-ctr,aes192-ctr,aes256-ctr
MACs hmac-sha2-256,hmac-sha2-512
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 5
EOF

# SSH 서비스 재시작
sudo systemctl restart ssh

log_success "✅ SSH 보안 설정 완료"

# 3. MongoDB 보안 설정
log_info "🗄️ MongoDB 보안 설정 중..."

# MongoDB 설정 파일 백업
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# MongoDB 보안 설정 추가
sudo tee -a /etc/mongod.conf > /dev/null << 'EOF'

# Security settings
security:
  authorization: enabled
  keyFile: /etc/mongodb/keyfile

# Network settings
net:
  bindIp: 127.0.0.1
  port: 27017
EOF

# MongoDB 키 파일 생성
sudo mkdir -p /etc/mongodb
sudo openssl rand -base64 756 > /tmp/mongodb-keyfile
sudo mv /tmp/mongodb-keyfile /etc/mongodb/keyfile
sudo chmod 400 /etc/mongodb/keyfile
sudo chown mongodb:mongodb /etc/mongodb/keyfile

# MongoDB 재시작
sudo systemctl restart mongod

log_success "✅ MongoDB 보안 설정 완료"

# 4. Nginx 보안 설정
log_info "🌐 Nginx 보안 설정 중..."

# Nginx 보안 헤더 추가
sudo tee /etc/nginx/conf.d/security-headers.conf > /dev/null << 'EOF'
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Hide Nginx version
server_tokens off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
EOF

# Nginx 설정 테스트 및 재시작
if sudo nginx -t; then
    sudo systemctl reload nginx
    log_success "✅ Nginx 보안 설정 완료"
else
    log_error "❌ Nginx 설정 오류"
fi

# 5. 파일 권한 설정
log_info "📁 파일 권한 설정 중..."

# 프로젝트 디렉토리 권한 설정
sudo chown -R www-data:www-data /var/www/sceneforge
sudo chmod -R 755 /var/www/sceneforge
sudo chmod -R 644 /var/www/sceneforge/backend/.env.production

# 로그 파일 권한 설정
sudo chown -R www-data:www-data /var/www/sceneforge/logs
sudo chmod -R 644 /var/www/sceneforge/logs/*.log

log_success "✅ 파일 권한 설정 완료"

# 6. 시스템 보안 업데이트
log_info "🔧 시스템 보안 업데이트 중..."

# 자동 보안 업데이트 설정
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 보안 업데이트 설정
sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

log_success "✅ 시스템 보안 업데이트 설정 완료"

# 7. 로그 모니터링 설정
log_info "📊 로그 모니터링 설정 중..."

# fail2ban 설치 및 설정
if ! command -v fail2ban &> /dev/null; then
    sudo apt install -y fail2ban
fi

# fail2ban 설정
sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https"]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
EOF

# fail2ban 서비스 시작
sudo systemctl start fail2ban
sudo systemctl enable fail2ban

log_success "✅ 로그 모니터링 설정 완료"

# 8. 보안 스캔 도구 설치
log_info "🔍 보안 스캔 도구 설치 중..."

# Lynis 설치 (보안 감사 도구)
if ! command -v lynis &> /dev/null; then
    sudo apt install -y lynis
fi

# ClamAV 설치 (바이러스 스캔)
if ! command -v clamscan &> /dev/null; then
    sudo apt install -y clamav clamav-daemon
    sudo freshclam
fi

log_success "✅ 보안 스캔 도구 설치 완료"

# 9. 백업 자동화 설정
log_info "💾 백업 자동화 설정 중..."

# 백업 Cron 작업 추가
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/sceneforge/backend/backup.sh") | crontab -

# 백업 보존 정책 설정
sudo tee /var/www/sceneforge/cleanup-backups.sh > /dev/null << 'EOF'
#!/bin/bash
# 30일 이상 된 백업 파일 삭제
find /var/www/sceneforge/backups -name "*.tar.gz" -mtime +30 -delete
EOF

chmod +x /var/www/sceneforge/cleanup-backups.sh

# 백업 정리 Cron 작업 추가
(crontab -l 2>/dev/null; echo "0 3 * * 0 /var/www/sceneforge/cleanup-backups.sh") | crontab -

log_success "✅ 백업 자동화 설정 완료"

# 10. 보안 상태 확인
log_info "🔍 보안 상태 확인 중..."

# 방화벽 상태
if sudo ufw status | grep -q "Status: active"; then
    log_success "   방화벽: 활성화됨"
else
    log_error "   방화벽: 비활성화됨"
fi

# SSH 보안 설정 확인
if grep -q "PermitRootLogin no" /etc/ssh/sshd_config; then
    log_success "   SSH 보안: 설정됨"
else
    log_warning "   SSH 보안: 설정되지 않음"
fi

# MongoDB 보안 확인
if systemctl is-active --quiet mongod; then
    log_success "   MongoDB: 실행 중"
else
    log_error "   MongoDB: 중지됨"
fi

# fail2ban 상태
if systemctl is-active --quiet fail2ban; then
    log_success "   fail2ban: 실행 중"
else
    log_error "   fail2ban: 중지됨"
fi

log_success "🎉 SceneForge 보안 강화 설정이 완료되었습니다!"
log_info "📋 보안 설정 정보:"
log_info "   방화벽 상태: sudo ufw status"
log_info "   SSH 설정: /etc/ssh/sshd_config"
log_info "   MongoDB 설정: /etc/mongod.conf"
log_info "   fail2ban 상태: sudo fail2ban-client status"
log_info "   보안 스캔: sudo lynis audit system"
log_info "   백업 스크립트: /var/www/sceneforge/backend/backup.sh" 