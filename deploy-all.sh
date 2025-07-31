#!/bin/bash

echo "🚀 전체 애플리케이션 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 에러 처리
set -e

echo -e "${BLUE}📋 배포 순서:${NC}"
echo -e "${BLUE}1. 백엔드 배포${NC}"
echo -e "${BLUE}2. 프론트엔드 배포${NC}"
echo ""

# 1. 백엔드 배포
echo -e "${YELLOW}🔄 백엔드 배포 중...${NC}"
./deploy-backend.sh

echo ""

# 2. 프론트엔드 배포
echo -e "${YELLOW}🔄 프론트엔드 배포 중...${NC}"
./deploy-frontend.sh

echo ""
echo -e "${GREEN}🎉 전체 배포 완료!${NC}"
echo -e "${GREEN}🌐 Frontend: https://filmaiforge.com${NC}"
echo -e "${GREEN}🌐 Backend: https://api.filmaiforge.com${NC}"
echo ""
echo -e "${YELLOW}📊 서버 상태:${NC}"
pm2 status 