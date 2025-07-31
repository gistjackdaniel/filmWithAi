#!/bin/bash

echo "🚀 백엔드 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 에러 처리
set -e

# 1. 백엔드 디렉토리로 이동
echo -e "${YELLOW}📁 백엔드 디렉토리로 이동...${NC}"
cd sceneforge-nestjs

# 2. 의존성 설치
echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
npm install

# 3. TypeScript 빌드
echo -e "${YELLOW}🔨 TypeScript 빌드 중...${NC}"
npm run build

# 4. PM2로 백엔드 재시작
echo -e "${YELLOW}🔄 백엔드 서버 재시작 중...${NC}"
cd ..
pm2 restart sceneforge-nestjs

# 5. 서버 상태 확인
echo -e "${YELLOW}🔍 서버 상태 확인 중...${NC}"
sleep 5
pm2 status

# 6. API 연결 테스트
echo -e "${YELLOW}🧪 API 연결 테스트 중...${NC}"
if curl -f -s http://localhost:5001/api > /dev/null; then
    echo -e "${GREEN}✅ API 서버 정상 작동${NC}"
else
    echo -e "${RED}❌ API 서버 연결 실패${NC}"
    echo -e "${YELLOW}📋 로그 확인: pm2 logs sceneforge-nestjs${NC}"
fi

echo -e "${GREEN}✅ 백엔드 배포 완료!${NC}"
echo -e "${GREEN}🌐 https://api.filmaiforge.com 에서 확인하세요${NC}" 