#!/bin/bash

echo "🚀 프론트엔드 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 에러 처리
set -e

# 1. 프론트엔드 디렉토리로 이동
echo -e "${YELLOW}📁 프론트엔드 디렉토리로 이동...${NC}"
cd sceneforge-frontend

# 2. 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm install

# 3. 프로덕션 빌드
echo -e "${YELLOW}🔨 프로덕션 빌드 중...${NC}"
npm run build

# 4. 정적 파일 복사
echo -e "${YELLOW}📋 정적 파일 복사 중...${NC}"
sudo cp -r dist/* /var/www/filmaiforge.com/

# 5. 권한 설정
echo -e "${YELLow}🔐 파일 권한 설정 중...${NC}"
sudo chown -R www-data:www-data /var/www/filmaiforge.com/
sudo chmod -R 755 /var/www/filmaiforge.com/

# 6. nginx 설정 테스트 및 재로드
echo -e "${YELLOW}🔄 nginx 설정 테스트 및 재로드 중...${NC}"
sudo nginx -t && sudo systemctl reload nginx

# 7. PM2에서 개발 서버 중지 (이미 중지된 경우 무시)
echo -e "${YELLOW}⏹️  개발 서버 중지 중...${NC}"
pm2 stop sceneforge-frontend 2>/dev/null || true

echo -e "${GREEN}✅ 프론트엔드 배포 완료!${NC}"
echo -e "${GREEN}🌐 https://filmaiforge.com 에서 확인하세요${NC}" 