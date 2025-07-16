#!/bin/bash

# SceneForge 모니터링 및 로깅 설정 스크립트

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
LOG_DIR="$PROJECT_DIR/logs"

log_info "📊 SceneForge 모니터링 및 로깅 설정 시작..."

# 1. 로그 디렉토리 생성
log_info "📁 로그 디렉토리 설정 중..."
mkdir -p $LOG_DIR
mkdir -p $LOG_DIR/nginx
mkdir -p $LOG_DIR/application
mkdir -p $LOG_DIR/error

# 2. 로그 로테이션 설정
log_info "🔄 로그 로테이션 설정 중..."

# PM2 로그 로테이션 설정
cat > /tmp/pm2-logrotate.conf << 'EOF'
/var/www/sceneforge/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

sudo cp /tmp/pm2-logrotate.conf /etc/logrotate.d/sceneforge
rm /tmp/pm2-logrotate.conf

# 3. 시스템 모니터링 도구 설치
log_info "📦 시스템 모니터링 도구 설치 중..."

# htop 설치 (시스템 모니터링)
if ! command -v htop &> /dev/null; then
    sudo apt install -y htop
    log_success "✅ htop 설치 완료"
fi

# iotop 설치 (I/O 모니터링)
if ! command -v iotop &> /dev/null; then
    sudo apt install -y iotop
    log_success "✅ iotop 설치 완료"
fi

# 4. CloudWatch 에이전트 설치 (AWS 환경)
log_info "☁️ CloudWatch 에이전트 설정 중..."

# CloudWatch 에이전트 설치
if ! command -v amazon-cloudwatch-agent &> /dev/null; then
    log_info "📦 CloudWatch 에이전트 설치 중..."
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
    sudo dpkg -i amazon-cloudwatch-agent.deb
    rm amazon-cloudwatch-agent.deb
    log_success "✅ CloudWatch 에이전트 설치 완료"
fi

# CloudWatch 설정 파일 생성
cat > /tmp/cloudwatch-config.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/www/sceneforge/logs/*.log",
                        "log_group_name": "/aws/sceneforge/application",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/sceneforge/nginx/access",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/sceneforge/nginx/error",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    },
    "metrics": {
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "diskio": {
                "measurement": ["io_time"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": ["tcp_established", "tcp_time_wait"],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": ["swap_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

sudo cp /tmp/cloudwatch-config.json /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
rm /tmp/cloudwatch-config.json

# CloudWatch 에이전트 시작
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent

# 5. 성능 모니터링 스크립트 생성
log_info "📊 성능 모니터링 스크립트 생성 중..."

cat > $PROJECT_DIR/monitor.sh << 'EOF'
#!/bin/bash

# SceneForge 성능 모니터링 스크립트

echo "=== SceneForge 성능 모니터링 ==="
echo "시간: $(date)"
echo ""

# 시스템 리소스
echo "=== 시스템 리소스 ==="
echo "CPU 사용률: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "메모리 사용률: $(free | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}')"
echo "디스크 사용률: $(df / | tail -1 | awk '{print $5}')"
echo ""

# PM2 프로세스 상태
echo "=== PM2 프로세스 상태 ==="
pm2 list
echo ""

# MongoDB 상태
echo "=== MongoDB 상태 ==="
if systemctl is-active --quiet mongod; then
    echo "MongoDB: 실행 중"
else
    echo "MongoDB: 중지됨"
fi
echo ""

# Nginx 상태
echo "=== Nginx 상태 ==="
if systemctl is-active --quiet nginx; then
    echo "Nginx: 실행 중"
else
    echo "Nginx: 중지됨"
fi
echo ""

# API 응답 시간
echo "=== API 응답 시간 ==="
if curl -s -w "응답 시간: %{time_total}s\n" -o /dev/null http://localhost:5001/health; then
    echo "API: 정상"
else
    echo "API: 오류"
fi
echo ""

# 로그 파일 크기
echo "=== 로그 파일 크기 ==="
du -sh /var/www/sceneforge/logs/* 2>/dev/null || echo "로그 파일이 없습니다"
echo ""
EOF

chmod +x $PROJECT_DIR/monitor.sh

# 6. 알림 설정 (SNS)
log_info "🔔 알림 설정 중..."

# 이메일 알림 스크립트 생성
cat > $PROJECT_DIR/alert.sh << 'EOF'
#!/bin/bash

# SceneForge 알림 스크립트

# 설정
ALERT_EMAIL="admin@your-domain.com"
LOG_FILE="/var/www/sceneforge/logs/alerts.log"

# 알림 함수
send_alert() {
    local message="$1"
    local level="$2"
    
    echo "[$(date)] [$level] $message" >> $LOG_FILE
    
    # 이메일 알림 (sendmail이 설치된 경우)
    if command -v sendmail &> /dev/null; then
        echo "Subject: SceneForge Alert - $level" | sendmail $ALERT_EMAIL
    fi
    
    # 로그 출력
    echo "[ALERT] $message"
}

# 서비스 상태 확인
check_services() {
    # PM2 프로세스 확인
    if ! pm2 list | grep -q "online"; then
        send_alert "PM2 프로세스가 오프라인입니다" "ERROR"
    fi
    
    # MongoDB 확인
    if ! systemctl is-active --quiet mongod; then
        send_alert "MongoDB가 중지되었습니다" "ERROR"
    fi
    
    # Nginx 확인
    if ! systemctl is-active --quiet nginx; then
        send_alert "Nginx가 중지되었습니다" "ERROR"
    fi
    
    # 디스크 공간 확인
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ $DISK_USAGE -gt 80 ]; then
        send_alert "디스크 사용률이 80%를 초과했습니다: ${DISK_USAGE}%" "WARNING"
    fi
    
    # 메모리 사용률 확인
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $MEM_USAGE -gt 90 ]; then
        send_alert "메모리 사용률이 90%를 초과했습니다: ${MEM_USAGE}%" "WARNING"
    fi
}

# 메인 실행
check_services
EOF

chmod +x $PROJECT_DIR/alert.sh

# 7. Cron 작업 설정
log_info "⏰ Cron 작업 설정 중..."

# 모니터링 Cron 작업 추가
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/sceneforge/monitor.sh >> /var/www/sceneforge/logs/monitoring.log 2>&1") | crontab -

# 알림 Cron 작업 추가
(crontab -l 2>/dev/null; echo "*/10 * * * * /var/www/sceneforge/alert.sh") | crontab -

# 로그 정리 Cron 작업 추가
(crontab -l 2>/dev/null; echo "0 2 * * * find /var/www/sceneforge/logs -name '*.log' -mtime +30 -delete") | crontab -

# 8. 서비스 상태 확인
log_info "🔍 서비스 상태 확인 중..."

# CloudWatch 에이전트 상태
if systemctl is-active --quiet amazon-cloudwatch-agent; then
    log_success "   CloudWatch 에이전트: 실행 중"
else
    log_error "   CloudWatch 에이전트: 중지됨"
fi

# Cron 작업 확인
if crontab -l | grep -q "monitor.sh"; then
    log_success "   모니터링 Cron: 설정됨"
else
    log_error "   모니터링 Cron: 설정되지 않음"
fi

if crontab -l | grep -q "alert.sh"; then
    log_success "   알림 Cron: 설정됨"
else
    log_error "   알림 Cron: 설정되지 않음"
fi

log_success "🎉 SceneForge 모니터링 및 로깅 설정이 완료되었습니다!"
log_info "📋 설정 정보:"
log_info "   모니터링 스크립트: $PROJECT_DIR/monitor.sh"
log_info "   알림 스크립트: $PROJECT_DIR/alert.sh"
log_info "   로그 디렉토리: $LOG_DIR"
log_info "   CloudWatch 설정: /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
log_info "   Cron 작업 확인: crontab -l" 