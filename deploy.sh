#!/bin/bash

# INSEEK Frontend 배포 스크립트
# Cloud Run에 배포하기 위한 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== INSEEK Frontend Cloud Run 배포 ===${NC}"

# 프로젝트 ID 확인
read -p "GCP Project ID를 입력하세요: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Project ID가 필요합니다.${NC}"
    exit 1
fi

# Backend URL 확인
read -p "Backend URL을 입력하세요 (예: https://inseek-backend-xxx-an.a.run.app): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}Backend URL이 필요합니다.${NC}"
    exit 1
fi

# 설정
SERVICE_NAME="inseek-frontend"
REGION="asia-northeast3"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${YELLOW}설정:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Service Name: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image: $IMAGE_NAME"
echo "  Backend URL: $BACKEND_URL"

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n${GREEN}1. Docker 이미지 빌드 중...${NC}"
docker build -t $IMAGE_NAME --build-arg VITE_API_URL=$BACKEND_URL .

echo -e "\n${GREEN}2. GCP 인증 확인 중...${NC}"
gcloud config set project $PROJECT_ID

echo -e "\n${GREEN}3. Docker 이미지 푸시 중...${NC}"
docker push $IMAGE_NAME

echo -e "\n${GREEN}4. Cloud Run에 배포 중...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 5

echo -e "\n${GREEN}=== 배포 완료! ===${NC}"

# 서비스 URL 가져오기
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "\n${GREEN}서비스 URL: ${NC}$SERVICE_URL"
