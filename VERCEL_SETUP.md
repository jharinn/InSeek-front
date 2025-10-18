# Vercel 배포 및 환경변수 설정 가이드

## 1. Vercel 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정해야 합니다:

### 필수 환경변수
- **변수명**: `VITE_API_URL`
- **값**: `https://your-backend-url.run.app` (실제 백엔드 URL로 변경)
- **Environment**: Production, Preview, Development 모두 체크

### 설정 방법
1. Vercel 프로젝트 페이지 접속
2. Settings → Environment Variables 메뉴 선택
3. `VITE_API_URL` 환경변수 추가
4. 값에 GCP Cloud Run의 백엔드 URL 입력
5. 저장 후 Redeploy 실행

## 2. 환경변수 확인 방법

### 로컬 개발 환경
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정
# VITE_API_URL=http://localhost:8000
```

### 프로덕션 환경
브라우저 콘솔(F12)을 열면 다음과 같은 로그가 표시됩니다:
```
=== INSEEK Frontend Configuration ===
API_URL: https://your-backend-url.run.app
Environment: production
All env vars: { ... }
=====================================
```

## 3. 문제 해결

### 증상: "서버와 통신하는 중 오류가 발생했습니다"

#### 체크리스트
1. ✅ Vercel에서 `VITE_API_URL` 환경변수가 설정되어 있는가?
2. ✅ 환경변수 설정 후 Redeploy를 했는가?
3. ✅ 백엔드 서버가 정상적으로 작동하는가? (Swagger 테스트)
4. ✅ 백엔드 CORS 설정이 올바른가?
5. ✅ 브라우저 콘솔에서 실제 요청 URL이 올바른가?

#### 디버깅 단계

**1단계: 브라우저 콘솔 확인**
- F12를 눌러 콘솔 열기
- 페이지 새로고침
- "INSEEK Frontend Configuration" 로그 확인
- `API_URL` 값이 올바른 백엔드 URL인지 확인

**2단계: 네트워크 탭 확인**
- 브라우저 개발자 도구의 Network 탭 열기
- 질문 검색 시도
- `/api/ask` 요청 찾기
- Status Code 확인 (200 OK가 아니면 문제)
- Request URL이 올바른지 확인
- Response 확인

**3단계: CORS 에러 확인**
콘솔에 다음과 같은 메시지가 있는 경우:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

백엔드의 CORS 설정을 확인:
```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.vercel.app"],  # Vercel 도메인 추가
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**4단계: 백엔드 서버 상태 확인**
```bash
# Swagger로 백엔드 테스트
curl -X POST "https://your-backend-url.run.app/api/ask" \
  -H "Content-Type: application/json" \
  -d '{"question":"테스트 질문"}'
```

## 4. Vercel 환경변수 변경 후 확인

환경변수를 변경한 후 **반드시**:
1. Vercel에서 Redeploy 실행 (Deployments → 최신 배포 → Redeploy)
2. 브라우저 캐시 클리어 (Ctrl+Shift+Delete 또는 Cmd+Shift+Delete)
3. 페이지 새로고침
4. 콘솔에서 새로운 `API_URL` 확인

## 5. 로그 확인

### 프론트엔드 로그
브라우저 콘솔(F12)에서 다음 정보를 확인할 수 있습니다:
- 환경 설정 정보
- API 요청/응답 상세 정보
- 에러 상세 정보

### 로그 예시
```
=== API Request ===
URL: https://backend-url/api/ask
Question: 테스트 질문
Timestamp: 2025-01-01T12:00:00.000Z

=== API Response ===
Status: 200
Status Text: OK
Headers: {...}
Response Data: {...}
```

## 6. 일반적인 오류 메시지

### "Failed to fetch" / "NetworkError"
- 백엔드 서버가 다운되었거나
- URL이 잘못되었거나
- 네트워크 연결 문제

### "CORS error"
- 백엔드의 CORS 설정이 프론트엔드 도메인을 허용하지 않음
- 백엔드 `allow_origins`에 Vercel 도메인 추가 필요

### "404 Not Found"
- API 엔드포인트 경로가 잘못됨
- 백엔드에 `/api/ask` 경로가 존재하는지 확인

### "500 Internal Server Error"
- 백엔드 서버 내부 오류
- 백엔드 로그 확인 필요

## 7. 환경별 설정

### Development (로컬)
```bash
# .env
VITE_API_URL=http://localhost:8000
```

### Production (Vercel)
- Vercel 환경변수: `VITE_API_URL=https://your-backend-url.run.app`

## 8. 빠른 체크리스트

배포 후 확인사항:
- [ ] Vercel에 `VITE_API_URL` 환경변수 설정됨
- [ ] 환경변수 설정 후 Redeploy 완료
- [ ] 브라우저 콘솔에서 올바른 API_URL 확인
- [ ] 백엔드 서버 정상 작동 (Swagger 테스트)
- [ ] 백엔드 CORS에 Vercel 도메인 추가
- [ ] Network 탭에서 요청이 올바른 URL로 가는지 확인
- [ ] 응답 Status Code가 200 OK인지 확인

## 9. 추가 도움

문제가 계속되면 다음 정보를 확인하세요:
1. 브라우저 콘솔의 전체 로그 (스크린샷)
2. Network 탭의 요청/응답 정보
3. 백엔드 서버 로그
4. Vercel 환경변수 설정 스크린샷
