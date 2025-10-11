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

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 미리보기
npm run preview
```

## Vercel 배포

### 1. Vercel CLI를 사용한 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 2. Git을 통한 배포

1. GitHub/GitLab/Bitbucket에 코드 푸시
2. Vercel 대시보드에서 프로젝트 임포트
3. 자동으로 배포됨

### 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

- `VITE_API_URL`: Backend API URL (선택사항, vercel.json의 proxy를 사용하는 경우 필요 없음)

## 주요 기능

- 사용자 질문 입력
- AI 기반 답변 표시
- 마크다운 포맷팅 지원 (볼드 텍스트)
- 로딩 상태 표시
- 에러 핸들링

## 프로젝트 구조

```
frontend/
├── public/           # 정적 파일 (파비콘 등)
├── src/
│   ├── App.jsx      # 메인 애플리케이션 컴포넌트
│   ├── main.jsx     # 진입점
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── vite.config.js   # Vite 설정
├── vercel.json      # Vercel 배포 설정
└── package.json     # 프로젝트 의존성
```

## API 프록시

`vercel.json`에서 `/api/*` 요청을 백엔드 서버로 프록시합니다:
- 개발: `http://localhost:8000`
- 프로덕션: `https://inseek-agent-806288585757.asia-northeast3.run.app`
