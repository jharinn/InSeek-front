# INSEEK Frontend

법령 기반 정확한 답변을 제공하는 INSEEK의 프론트엔드 애플리케이션입니다.

## 기술 스택

- React 18
- Vite
- Tailwind CSS

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 VITE_API_URL을 로컬 백엔드 URL로 설정

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## 환경 변수

### 로컬 개발 (.env)
```bash
VITE_API_URL=http://localhost:8000
```

### 프로덕션 (Vercel)
Vercel 대시보드에서 다음 환경 변수를 설정하세요:
- `VITE_API_URL`: Backend API URL (예: `https://your-backend.run.app`)

**중요:** 환경 변수 설정 후 반드시 Redeploy를 실행하세요!

## Vercel 배포

### 배포 방법

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Update frontend"
   git push origin main
   ```

2. **Vercel 대시보드에서 프로젝트 연결**
   - [Vercel Dashboard](https://vercel.com/dashboard)에서 프로젝트 Import
   - GitHub 저장소 선택
   - Framework Preset: Vite
   - Root Directory: `frontend` (필요한 경우)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **환경 변수 설정**
   - Settings → Environment Variables
   - `VITE_API_URL` 추가
   - Production, Preview, Development 모두 체크
   - 값: 백엔드 서버 URL

4. **배포 완료 후 확인**
   - 배포된 사이트 접속
   - F12를 눌러 콘솔 확인
   - "INSEEK Frontend Configuration" 로그에서 API_URL 확인

### 환경 변수 변경 후

환경 변수를 변경한 경우:
1. Vercel Deployments 페이지로 이동
2. 최신 배포 선택
3. "Redeploy" 버튼 클릭
4. 배포 완료 후 브라우저 캐시 클리어
5. 페이지 새로고침하여 확인

## 디버깅 도구

### 환경 설정 확인 페이지
배포된 사이트에서 `/debug.html` 접속:
- 환경 모드 확인
- API URL 확인
- 백엔드 연결 테스트
- 전체 환경 변수 확인

예: `https://your-site.vercel.app/debug.html`

### 브라우저 콘솔 로그
F12를 눌러 콘솔을 열면 다음 정보를 확인할 수 있습니다:
- 환경 설정 정보
- API 요청/응답 상세 정보
- 에러 상세 정보 및 스택 트레이스

## 문제 해결

### "서버와 통신하는 중 오류가 발생했습니다"

1. **브라우저 콘솔 확인** (F12)
   - API URL이 올바른지 확인
   - 상세 에러 메시지 확인

2. **환경 변수 확인**
   - Vercel에서 `VITE_API_URL` 설정 확인
   - 설정 후 Redeploy 했는지 확인

3. **백엔드 서버 확인**
   - Swagger로 백엔드 테스트: `https://your-backend-url/docs`
   - 백엔드 서버가 실행 중인지 확인

4. **CORS 설정 확인**
   - 백엔드의 `allow_origins`에 Vercel 도메인 추가 확인
   - 콘솔에 CORS 에러가 있는지 확인

5. **네트워크 탭 확인**
   - F12 → Network 탭
   - `/api/ask` 요청 찾기
   - Status Code 및 Response 확인

자세한 문제 해결 가이드는 `VERCEL_SETUP.md`를 참고하세요.

## 주요 기능

- 사용자 질문 입력 및 검색
- AI 기반 답변 표시
- 마크다운 포맷팅 지원 (볼드 텍스트)
- 답변 출처 표시 (법령, 지자체, 관리부처)
- 검색 히스토리 관리 (localStorage 사용)
- 질문 예시 제공
- 상세한 에러 로깅 및 사용자 피드백
- 로딩 상태 표시
- 반응형 3단 레이아웃

## 프로젝트 구조

```
frontend/
├── public/              # 정적 파일
├── src/
│   ├── App.jsx         # 메인 애플리케이션 컴포넌트
│   ├── main.jsx        # 진입점
│   └── index.css       # 전역 스타일 (Tailwind)
├── debug.html          # 환경 설정 확인 페이지
├── index.html          # HTML 템플릿
├── vite.config.js      # Vite 설정
├── tailwind.config.js  # Tailwind CSS 설정
├── .env.example        # 환경 변수 예시
├── .env.production     # 프로덕션 환경 변수
├── VERCEL_SETUP.md     # Vercel 배포 가이드
├── package.json        # 프로젝트 의존성
└── README.md           # 이 파일
```

<<<<<<< HEAD

=======
## 개발 가이드

### 새로운 기능 추가

1. `src/App.jsx`에서 컴포넌트 수정
2. 로컬에서 테스트 (`npm run dev`)
3. 변경사항 커밋 및 푸시
4. Vercel이 자동으로 배포

### 스타일 수정

- Tailwind CSS 유틸리티 클래스 사용
- `tailwind.config.js`에서 커스텀 색상 및 테마 설정
- `src/index.css`에서 전역 스타일 설정

### API 통신

```javascript
// API 요청 예시
const response = await fetch(`${API_URL}/api/ask`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ question: userQuestion }),
});

const data = await response.json();
```

## 로깅 시스템

### 앱 시작 시
```
=== INSEEK Frontend Configuration ===
API_URL: https://backend-url
Environment: production
All env vars: { ... }
=====================================
```

### API 요청 시
```
=== API Request ===
URL: https://backend-url/api/ask
Question: 사용자 질문
Timestamp: 2025-01-01T12:00:00.000Z
```

### API 응답 시
```
=== API Response ===
Status: 200
Status Text: OK
Headers: { ... }
Response Data: { ... }
```

### 에러 발생 시
```
=== Request Failed ===
Error Type: TypeError
Error Message: Failed to fetch
Error Stack: ...
API URL: https://backend-url/api/ask
```

## 성능 최적화

- Vite의 빠른 HMR(Hot Module Replacement)
- React의 효율적인 렌더링
- Tailwind CSS의 JIT 모드로 최소 CSS 번들 크기
- 로컬스토리지를 활용한 히스토리 캐싱
- 불필요한 리렌더링 방지

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 라이선스

이 프로젝트의 라이선스는 [LICENSE](../LICENSE) 파일을 참조하세요.

## 문의

문제나 질문이 있으시면 이슈를 등록해주세요.
>>>>>>> e41ca1e (feat: 디버그용 로그 추가)
