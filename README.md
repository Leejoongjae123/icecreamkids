# I-Scream Kids Kinder Board

## ✏️ 개요

- i-scream kids 영유아 교육 컨텐츠 관련 웹사이트 개발 프로젝트
- 유아 교육을 담당하는 선생님들을 위한 AI 기반 교육 자료 작성 및 공유 플랫폼
- [관련위키🔗](https://wiki.daumkakao.com/pages/viewpage.action?pageId=1556336687)

## 🚀 주요 기능

- AI를 활용한 교육 자료 자동 생성
- 교육 자료 관리 및 공유 시스템

## 🛠 기술 스택

### 프론트엔드

- **프레임워크**: Next.js 14.2.5 (React 18)
- **상태 관리**: Zustand, React Query
- **스타일링**: SCSS
- **폼 관리**: React Hook Form + Zod
- **차트**: Recharts, Chart.js
- **기타 주요 라이브러리**:
  - orval : swagger를 통한 API엔드포인트 자동 생성
  - Drag & Drop: react-dnd
  - PDF 처리: react-pdf, pdfjs-dist
  - hwp한글파일 뷰어처리 : hwp.js
  - 이미지 처리: cropperjs, react-image-file-resizer
  - 비디오 플레이어: video.js
  - UI 컴포넌트: Storybook

### 개발 도구

- **언어**: TypeScript
- **코드 품질**: ESLint, Prettier, Husky
- **API 문서화**: Swagger (orval을 통한 자동 생성)

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js 14의 App Router 방식
├── components/             # 재사용 가능한 컴포넌트
├── const/                  # 상수 정의
├── context/                # React Context
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티 함수
├── providers/              # Context Providers
├── service/                # API 서비스 레이어 (orval로 자동 생성)
├── stores/                 # Zustand 스토어
├── style/                  # 전역 스타일
├── swagger/                # API 스펙 (Swagger)
└── utils/                  # 유틸리티 함수
```

## 🚀 시작하기

### 사전 요구 사항

- Node.js v20.11.0
- npm 9.x+

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 테스트 실행
npm run test

# 스토리북 실행
npm run storybook

# API 클라이언트 코드 생성 (Swagger 스키마 기반)
npm run service
```

### 환경 변수 설정

1. `.env.development` 파일을 생성 및 설정이 필요합니다.

2. 환경 변수는 실행 모드에 따라 우선순위가 적용됩니다: (local 필요 없을경우 바로 dev 부터 설정가능)

- `npm run dev`: `.env.local` > `.env.development`
- `npm run prod`: `.env.local` > `.env.production`

## 📝 커밋 규칙

| **Type** | **Description**                             |
| -------- | ------------------------------------------- |
| feat     | 새로운 기능 추가                            |
| fix      | 버그 수정                                   |
| refactor | 코드 리팩토링                               |
| docs     | 문서 수정                                   |
| style    | 코드 포맷팅, 세미콜론 누락 등 (기능 변경 X) |
| test     | 테스트 코드 추가/수정                       |
| rename   | 파일명 수정                                 |
| remove   | 파일 삭제                                   |
| chore    | 빌드 과정, 패키지 매니저 설정 등            |
| markup   | UI 마크업 작업                              |

## 👥 Contributors

- jasper.se(박종상)
- ash.y(임채윤)
- add.remove(권범규)
- danny.yk(김대엽)
- notus.jung(정상훈)
- griffin.ku(구영준)

# Ice Cream Kids

## 개발 환경 설정

### Tailwind CSS 설정

이 프로젝트는 Tailwind CSS를 사용하여 스타일링을 구현합니다.

#### 설치된 패키지
- `tailwindcss`: 메인 Tailwind CSS 프레임워크
- `postcss`: PostCSS 프로세서
- `autoprefixer`: 브라우저 호환성을 위한 자동 prefix 추가

#### 설정 파일
- `tailwind.config.js`: Tailwind CSS 설정 파일
- `postcss.config.js`: PostCSS 설정 파일
- `src/app/globals.css`: Tailwind CSS 디렉티브 포함

#### 커스텀 색상 팔레트
- `primary`: 메인 브랜드 색상 (파란색 계열)
- `secondary`: 보조 색상 (회색 계열)

#### 사용 방법
```jsx
// 기본 Tailwind 클래스 사용
<div className="bg-primary-500 text-white p-4 rounded-lg">
  Hello World
</div>

// 커스텀 컴포넌트 클래스 사용
<button className="btn-primary">
  Primary Button
</button>
```

#### 기존 SCSS와의 호환성
기존 SCSS 스타일은 그대로 유지되며, Tailwind CSS와 함께 사용할 수 있습니다. Tailwind CSS는 기존 스타일보다 우선순위가 높게 설정되어 있습니다.

## 개발 서버 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```
