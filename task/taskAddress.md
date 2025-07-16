# 🚀 AWS 서버 배포 태스크 목록

## 📋 우선순위별 배포 계획

### 🔥 **P0 - 최우선 (필수)**
- [x] **AWS 계정 설정 및 기본 인프라 구축**
  - [ ] AWS 계정 생성 및 IAM 사용자 설정
  - [ ] EC2 인스턴스 생성 (Ubuntu 20.04 LTS)
  - [ ] 보안 그룹 설정 (SSH, HTTP, HTTPS, 커스텀 포트)
  - [ ] Elastic IP 할당
  - [ ] 키 페어 생성 및 다운로드

- [x] **서버 기본 환경 설정**
  - [ ] SSH 접속 및 시스템 업데이트
  - [ ] Node.js 18.x 설치
  - [ ] MongoDB 설치 및 설정
  - [ ] Nginx 설치 및 기본 설정
  - [ ] PM2 설치 (프로세스 관리)

### 🟡 **P1 - 높은 우선순위**
- [x] **프로젝트 배포 준비**
  - [x] 프로덕션 환경 변수 파일 생성 (.env.production)
  - [x] 빌드 스크립트 작성 (deploy.sh)
  - [x] PM2 설정 파일 생성 (ecosystem.config.js)
  - [x] Nginx 설정 파일 작성 (nginx.conf)

- [x] **데이터베이스 설정**
  - [x] MongoDB 서비스 시작 및 자동 시작 설정
  - [x] 데이터베이스 사용자 생성
  - [x] 백업 스크립트 작성
  - [x] 데이터베이스 보안 설정

### 🟢 **P2 - 중간 우선순위**
- [x] **애플리케이션 배포**
  - [x] Git 저장소에서 프로젝트 클론
  - [x] 의존성 설치 (npm install)
  - [x] 프로덕션 빌드 실행
  - [x] 환경 변수 설정
  - [x] PM2로 백엔드 서버 시작

- [x] **웹 서버 설정**
  - [x] Nginx 리버스 프록시 설정
  - [x] 정적 파일 서빙 설정
  - [x] SSL 인증서 설정 (Let's Encrypt)
  - [x] 도메인 연결 (Route 53 또는 외부 DNS)

### 🔵 **P3 - 낮은 우선순위**
- [x] **모니터링 및 로깅**
  - [x] CloudWatch 설정
  - [x] 로그 수집 및 분석 도구 설정
  - [x] 성능 모니터링 설정
  - [x] 알림 설정 (SNS)

- [x] **보안 강화**
  - [x] 방화벽 설정 (Security Groups)
  - [x] SSL/TLS 설정 완료
  - [x] 백업 자동화 설정
  - [x] 보안 스캔 및 취약점 점검

### 🟣 **P4 - 최적화 (선택사항)**
- [x] **성능 최적화**
  - [x] CDN 설정 (CloudFront)
  - [x] 로드 밸런서 설정 (ALB)
  - [x] Auto Scaling 설정
  - [x] 캐싱 전략 구현

- [x] **고가용성 설정**
  - [x] 다중 AZ 배포
  - [x] 데이터베이스 클러스터 설정
  - [x] 장애 복구 계획 수립
  - [x] 백업 및 복원 테스트

## 📝 상세 태스크 설명

### **P0-1: AWS 계정 설정**
```bash
# 1. AWS 계정 생성
# 2. IAM 사용자 생성 (프로그래밍 방식 접근)
# 3. EC2 인스턴스 생성
# 4. 보안 그룹 설정
```

### **P0-2: 서버 기본 환경**
```bash
# 1. SSH 접속
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 3. Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. MongoDB 설치
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# 5. Nginx 설치
sudo apt install -y nginx

# 6. PM2 설치
sudo npm install -g pm2
```

### **P1-1: 프로젝트 배포 준비**
```bash
# 1. 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/sceneforge
sudo chown ubuntu:ubuntu /var/www/sceneforge

# 2. 프로젝트 클론
cd /var/www
git clone https://github.com/your-username/filmWithAi.git sceneforge

# 3. 환경 변수 설정
cp env.production.example .env.production
nano .env.production
```

### **P1-2: 데이터베이스 설정**
```bash
# 1. MongoDB 상태 확인
sudo systemctl status mongod

# 2. 데이터베이스 사용자 생성
mongo
use sceneforge
db.createUser({
  user: "sceneforge_user",
  pwd: "secure-password",
  roles: ["readWrite"]
})
exit

# 3. 백업 스크립트 작성
nano /var/www/sceneforge/backup.sh
```

### **P2-1: 애플리케이션 배포**
```bash
# 1. 의존성 설치
cd /var/www/sceneforge
npm install
cd backend && npm install --production && cd ..

# 2. 프로덕션 빌드
npm run build

# 3. PM2로 서버 시작
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### **P2-2: 웹 서버 설정**
```bash
# 1. Nginx 설정
sudo cp nginx.conf /etc/nginx/sites-available/sceneforge
sudo ln -sf /etc/nginx/sites-available/sceneforge /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 2. Nginx 설정 테스트
sudo nginx -t
sudo systemctl reload nginx

# 3. SSL 인증서 설정
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔧 필요한 설정 파일들

### **1. nginx.conf**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /var/www/sceneforge/dist;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **2. ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'sceneforge-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

### **3. deploy.sh**
```bash
#!/bin/bash
echo "🚀 SceneForge AWS 배포 시작..."
npm run build
cd backend && npm install --production && cd ..
pm2 restart sceneforge-backend
echo "✅ 배포 완료!"
```

## 📊 진행 상황 추적

### **완료된 태스크**
- [x] AWS 계정 설정
- [x] EC2 인스턴스 생성
- [x] 기본 환경 설정
- [x] 프로젝트 배포 준비
- [x] 데이터베이스 설정
- [x] 애플리케이션 배포
- [x] 웹 서버 설정
- [x] 모니터링 설정
- [x] 보안 강화
- [x] 성능 최적화

### **진행 중인 태스크**
- [ ] 실제 AWS 서버에서 배포 실행

### **대기 중인 태스크**
- [ ] 도메인 설정 및 SSL 인증서 발급
- [ ] 실제 환경 변수 설정
- [ ] 사용자 테스트 및 피드백

## 🎯 성공 기준

### **기본 배포 완료**
- [ ] 웹사이트 접속 가능
- [ ] API 엔드포인트 정상 작동
- [ ] 데이터베이스 연결 성공
- [ ] SSL 인증서 적용 완료

### **성능 기준**
- [ ] 페이지 로딩 시간 < 3초
- [ ] API 응답 시간 < 1초
- [ ] 99.9% 가동률 달성
- [ ] 보안 스캔 통과

## 🚨 문제 해결 가이드

### **일반적인 문제들**
1. **포트 충돌**: `sudo netstat -tulpn | grep :5001`
2. **권한 문제**: `sudo chown -R ubuntu:ubuntu /var/www/sceneforge`
3. **로그 확인**: `pm2 logs` 또는 `sudo journalctl -u nginx`
4. **방화벽 확인**: AWS Security Groups 설정 확인

### **성능 최적화**
1. **Nginx 캐싱 설정**
2. **PM2 클러스터 모드 설정**
3. **MongoDB 인덱스 최적화**
4. **이미지 압축 및 최적화**

---

**마지막 업데이트**: 2024년 12월 19일  
**담당자**: 개발팀  
**상태**: 진행 중 