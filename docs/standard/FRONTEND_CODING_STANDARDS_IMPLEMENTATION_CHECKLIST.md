<!-- Generated: 2026-01-24 18:00:00 KST -->

# Frontend Coding Standards - Implementation Breakdown Checklist

**목적**: `/imb` 명령어 전용 체크리스트 (PRD 구현 태스크 분해 시 필수 검증 항목)
**버전**: 3.0.0 (sunjin-erp Next.js App Router)
**최종 수정**: 2026-01-24

---

## 1️⃣ 아키텍처 준수 (MANDATORY)

### Next.js 14 App Router 적용 확인
- [ ] **Route Group 분류**: `(auth)` OR `(main)` ?
  - **(auth)**: 비인증 경로 (로그인 페이지) — 사이드바/헤더 없음
  - **(main)**: 인증 필수 경로 — 사이드바 + 헤더 + 콘텐츠 레이아웃

### Server Component (SC) 규칙
- [ ] ✅ 데이터 fetching은 Server Component에서 수행
- [ ] ✅ `getServerSession()`으로 서버에서 세션 조회
- [ ] ✅ DB 직접 접근(TypeORM)은 API Route 또는 Server Action에서만
- [ ] ✅ 정적 콘텐츠 렌더링은 SC 우선
- [ ] ❌ SC에서 useState, useEffect, event handler 사용 금지
- [ ] ❌ SC에서 Zustand store 접근 금지
- [ ] ❌ SC에서 브라우저 API (localStorage, window) 사용 금지

### Client Component (CC) 규칙
- [ ] ✅ 파일 최상단에 `'use client'` 선언 필수
- [ ] ✅ 사용자 인터랙션 (클릭, 입력, 토글) 처리
- [ ] ✅ useState, useEffect, Zustand, TanStack Query 사용
- [ ] ✅ 브라우저 API (localStorage, IntersectionObserver 등) 사용
- [ ] ❌ CC에서 직접 DB 접근 금지 (API Route 통해서만)

### Server/Client 분리 패턴
- [ ] layout.tsx는 Server Component 유지
- [ ] 인터랙티브 UI는 별도 Client Component로 분리
- [ ] Server에서 session/data를 가져와 Client Component에 props로 전달
- [ ] `children` prop을 활용하여 SC/CC 합성 (Composition Pattern)

---

## 2️⃣ State Management

### 상태 분류 확인
- [ ] **Server Data**: TanStack Query 사용 (`@tanstack/react-query`)
- [ ] **Global UI State**: Zustand 사용 (`src/stores/`)
- [ ] **Local Component State**: useState 사용
- [ ] **Form State**: React Hook Form 또는 useState
- [ ] **URL State**: Next.js `useSearchParams`, `usePathname`

### TanStack Query 패턴 준수
- [ ] Query Key는 계층적 구조 (예: `['customers', 'list', filters]`)
- [ ] Stale Time 적절히 설정:
  - 목록 데이터: 5분
  - 상세 정보: 3분
  - 사용자 세션: 10분
  - 실시간 데이터: 0초 (항상 fresh)
- [ ] Cache Invalidation 구현 (mutation 후 `queryClient.invalidateQueries()`)
- [ ] Optimistic Updates 구현 (필요 시)
- [ ] Global onError에서 401 응답 시 `/login` 리다이렉트

### Zustand Store 규칙
- [ ] Client-only UI 상태만 저장 (sidebar 축소/확장, 필터, 임시 폼 데이터)
- [ ] localStorage persist middleware 활용 (필요 시)
- [ ] 서버 데이터 절대 Zustand에 저장 금지
- [ ] Store 파일 위치: `src/stores/{store-name}.ts`

### 상태 관리 금지 사항
- [ ] ❌ Zustand에 서버 데이터 저장 금지 (TanStack Query 사용)
- [ ] ❌ localStorage에 민감 정보 저장 금지
- [ ] ❌ 전역 상태 과도한 사용 금지 (최소한으로 유지)

---

## 3️⃣ API Route Handlers

### RESTful 패턴 준수
- [ ] `GET /api/[module]` — 목록 조회 (query params: pagination, filters)
- [ ] `GET /api/[module]/[id]` — 단건 조회
- [ ] `POST /api/[module]` — 생성
- [ ] `PUT /api/[module]/[id]` — 수정
- [ ] `DELETE /api/[module]/[id]` — 삭제 (soft delete: `deleted_at` 설정)

### API Route 구현 규칙
- [ ] 파일 위치: `src/app/api/[module]/route.ts`, `src/app/api/[module]/[id]/route.ts`
- [ ] NextAuth 세션 검증 포함 (`getServerSession()`)
- [ ] 역할 기반 권한 검증 (ADMIN/MANAGER/USER)
- [ ] 에러 응답: 적절한 HTTP 상태 코드 + JSON body
- [ ] 입력값 검증 (Zod 또는 자체 validation)
- [ ] TypeORM을 통한 DB 접근 (raw SQL 최소화)

### 에러 응답 형식
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "사용자에게 표시할 메시지",
    "details": {}
  }
}
```

---

## 4️⃣ Database (Oracle XE 21c + TypeORM)

### Entity 정의 규칙
- [ ] 파일 위치: `src/entities/[EntityName].ts`
- [ ] `VARCHAR2` for string fields (VARCHAR 사용 금지)
- [ ] `NUMBER` for numeric types
- [ ] `CLOB` for large text (TEXT 사용 금지)
- [ ] Sequence objects for auto-increment IDs
- [ ] `deleted_at` column 필수 (soft delete)
- [ ] `created_at`, `updated_at` timestamp columns 포함

### Safety Rules (필수)
- [ ] ❌ **CASCADE DELETE 절대 금지** — All FK use `ON DELETE RESTRICT`
- [ ] ❌ **Physical DELETE 금지** — Soft delete only (`deleted_at` 설정)
- [ ] ❌ **Fallback DB 금지** — Oracle 연결 실패 시 HTTP 500 반환 (SQLite 등 대체 금지)
- [ ] ✅ 삭제 전 의존성 확인 (관련 레코드 존재 여부 검증)
- [ ] ✅ 목록 조회 시 `WHERE deleted_at IS NULL` 조건 필수

### Migration 규칙
- [ ] 파일 위치: `src/migrations/`
- [ ] `npx typeorm migration:generate -n MigrationName`으로 생성
- [ ] Migration 파일에 rollback 로직 포함 (`down()` 메서드)

---

## 5️⃣ Component Patterns

### 컴포넌트 분류
- [ ] **Layout Component**: `src/components/layout/` (Sidebar, Header, Breadcrumb, MainShell)
- [ ] **UI Primitives**: `src/components/ui/` (shadcn/ui 컴포넌트)
- [ ] **Feature Component**: `src/components/features/[module]/` (도메인별 컴포넌트)
- [ ] **Page Component**: `src/app/(main)/[module]/page.tsx`

### 컴포넌트 크기 제한
- [ ] 기본 컴포넌트: **200줄 이하**
- [ ] 복잡한 로직: Custom Hook으로 분리
- [ ] 반복 UI: 별도 컴포넌트로 추출

### Server/Client Component 결정 기준
- [ ] **Server Component 사용**: 정적 렌더링, 데이터 fetching, SEO 필요
- [ ] **Client Component 사용**: 사용자 인터랙션, 상태 관리, 브라우저 API, Zustand/TanStack Query
- [ ] **Composition Pattern**: SC에서 CC를 children으로 전달

### Next.js 특화 패턴
- [ ] `loading.tsx` — 페이지 로딩 스켈레톤 UI
- [ ] `error.tsx` — 에러 바운더리 (Client Component)
- [ ] `not-found.tsx` — 404 페이지
- [ ] `layout.tsx` — 공유 레이아웃 (SC 유지)

---

## 6️⃣ TypeScript Strict Mode

### 필수 설정 확인
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  }
}
```

### 타입 안전성 검증
- [ ] `any` 타입 최소화 (불가피 시 주석으로 사유 명시)
- [ ] 타입 가드 사용 (타입 assertion 최소화)
- [ ] API 응답 타입 정의 (interface/type 분리)
- [ ] Path mapping `@/` alias 사용 (`src/` 기준)
- [ ] Props 타입은 컴포넌트와 동일 파일에 정의

---

## 7️⃣ Testing (MANDATORY)

### Coverage 목표
- [ ] **라인 커버리지**: 80% 이상
- [ ] **브랜치 커버리지**: 75% 이상
- [ ] **Critical Paths**: 100%

### Testing Pyramid
- [ ] **70%**: Unit Tests (함수, hooks, utilities)
- [ ] **20%**: Integration Tests (컴포넌트 + API mock)
- [ ] **10%**: E2E Tests (Playwright - 실제 사용자 시나리오)

### 테스트 패턴
- [ ] **쿼리 우선순위**: getByRole > getByLabelText > getByText > getByTestId
- [ ] **User Event 사용**: `userEvent.click()` (fireEvent 사용 금지)
- [ ] **사용자 동작 테스트**: 구현 세부사항 아닌 행동 테스트
- [ ] **Async 테스트**: `waitFor()`, `waitForElementToBeRemoved()`

### 테스트 실행 명령어
```bash
npm run test              # 단위 테스트 실행
npm run test -- --coverage  # 커버리지 확인
```

---

## 8️⃣ Error Handling

### API Route 레벨
- [ ] HTTP 상태 코드별 적절한 응답 (400, 401, 403, 404, 422, 500)
- [ ] 구조화된 에러 응답 형식 사용
- [ ] TypeORM 에러를 사용자 친화적 메시지로 변환
- [ ] Oracle 연결 실패 시 HTTP 500 반환 (fallback DB 금지)

### 컴포넌트 레벨
- [ ] `error.tsx` 파일로 라우트별 에러 바운더리 적용
- [ ] 사용자 친화적 에러 메시지 (한글)
- [ ] 재시도 옵션 제공 (필요 시)
- [ ] TanStack Query `onError` 콜백에서 toast 표시

### Global Error Handling
- [ ] TanStack Query global onError에서 401 → `/login` 리다이렉트
- [ ] 예상치 못한 에러 로깅 (console.error 최소화, 구조화된 로깅)

---

## 9️⃣ Performance Optimization

### Web Vitals 목표
- [ ] **CLS** (Cumulative Layout Shift): < 0.1
- [ ] **FCP** (First Contentful Paint): < 1.5s
- [ ] **LCP** (Largest Contentful Paint): < 2.5s
- [ ] **사이드바 인터랙션 응답**: < 50ms
- [ ] **클라이언트 사이드 페이지 전환**: < 100ms

### Next.js 최적화
- [ ] `next/image` 사용 (이미지 최적화)
- [ ] `next/link` 사용 (프리페칭)
- [ ] Dynamic imports (`next/dynamic`) for heavy components
- [ ] Server Components로 클라이언트 번들 크기 최소화

### 측정 방법
- [ ] Chrome DevTools / Lighthouse로 수동 측정 (초기 단계)
- [ ] 릴리스 전 체크리스트 항목으로 관리

---

## 🔟 Styling (Tailwind CSS + shadcn/ui)

### shadcn/ui 컴포넌트 활용
- [ ] `src/components/ui/` 디렉토리에 설치
- [ ] Button, Input, Dialog, Table, Form, Select, DatePicker 등
- [ ] 커스터마이징은 className으로 확장 (소스 수정 최소화)

### Tailwind CSS 규칙
- [ ] Desktop-first 반응형 설계 (1280px+ 기본)
- [ ] Tablet 지원 (768px+)
- [ ] `cn()` 유틸리티 사용 (clsx + tailwind-merge)
- [ ] 인라인 스타일 사용 금지 (Tailwind 클래스만)

### 콘텐츠 영역 너비
- [ ] 기본값: `max-w-full` (ERP 테이블에 최적)
- [ ] 폼/상세 페이지: 필요 시 `max-w-5xl` 래핑
- [ ] 패딩: `p-6` (콘텐츠 영역 기본)

### 아이콘
- [ ] Lucide React (`lucide-react`) 사용
- [ ] 사이드바 메뉴별 아이콘 적용 (네비게이션 설정 참조)

---

## 1️⃣1️⃣ Authentication & Authorization

### NextAuth.js (Auth.js v5) 적용
- [ ] Session 객체에 `user.role`, `user.name`, `user.department` 포함
- [ ] Middleware (`src/middleware.ts`)에서 route-level 보호
- [ ] SessionProvider를 Root Layout에 적용
- [ ] `refetchOnWindowFocus: true` 설정

### RBAC (Role-Based Access Control)
- [ ] **ADMIN**: 전체 기능 + 직원/부서 관리
- [ ] **MANAGER**: 부서 범위 읽기/쓰기
- [ ] **USER**: 본인 데이터 + 공유 리소스 읽기 전용

### 권한 검증 위치
- [ ] **Middleware**: route-level 보호 (미인증 → `/login`)
- [ ] **API Route**: 세션 + 역할 검증
- [ ] **Client Component**: 메뉴/버튼 표시 제어 (`session.user.role` 기반)
- [ ] ⚠️ 클라이언트 검증만으로는 불충분 — 서버 측 검증 필수

---

## 1️⃣2️⃣ 금지 사항 (❌)

### 절대 금지
- [ ] ❌ **CASCADE DELETE** 금지 (soft delete 사용, ON DELETE RESTRICT)
- [ ] ❌ **Fallback DB** 금지 (Oracle 실패 시 SQLite 등으로 대체 금지)
- [ ] ❌ **Physical DELETE** 금지 (deleted_at column 사용)
- [ ] ❌ **Server Data를 Zustand에 저장** 금지 (TanStack Query 사용)
- [ ] ❌ **SC에서 Client 전용 API 사용** 금지 (useState, useEffect, window 등)
- [ ] ❌ **인라인 스타일** 사용 금지 (Tailwind 사용)
- [ ] ❌ **`any` 타입 무분별 사용** 금지

### 파일 생성 규칙
- [ ] ❌ 불필요한 파일 생성 금지 (기존 파일 편집 우선)
- [ ] ✅ 모든 새 파일에 KST 타임스탬프 주석 필수
  - TypeScript: `// Generated: YYYY-MM-DD HH:MM:SS KST`
  - Markdown: `<!-- Generated: YYYY-MM-DD HH:MM:SS KST -->`

---

## 1️⃣3️⃣ 필수 검증 명령어 (모든 구현 완료 후)

### TypeScript & Lint
```bash
npm run build             # Next.js 빌드 (TypeScript 컴파일 포함)
npm run type-check        # TypeScript strict mode 검증
npm run lint              # ESLint 검사
npm run lint -- --fix     # 자동 수정
npm run format            # Prettier 포맷팅
```

### 단위 테스트
```bash
npm run test              # 테스트 실행
npm run test -- --coverage  # 커버리지 확인 (80%+ 라인, 75%+ 브랜치)
```

### 개발 서버 확인
```bash
npm run dev               # Dev 서버 (port 3000)
# 브라우저에서 http://localhost:3000 확인
```

### Docker 환경
```bash
docker-compose up -d      # App (port 3000) + Oracle XE (port 1521)
```

---

## 1️⃣4️⃣ Implementation Breakdown Task 생성 템플릿

### Database Layer
```markdown
### 1. Database Layer
- [ ] {DOC_NUM}_01: TypeORM Entity 정의
  - Entity 파일 생성 (`src/entities/`)
  - Oracle 타입 규칙 준수 (VARCHAR2, NUMBER, CLOB)
  - deleted_at, created_at, updated_at column 포함
  - Foreign Key: ON DELETE RESTRICT

- [ ] {DOC_NUM}_02: Migration 생성
  - `npx typeorm migration:generate -n MigrationName`
  - rollback 로직 (down 메서드) 포함
```

### Backend API Layer
```markdown
### 2. Backend API Layer
- [ ] {DOC_NUM}_03: API Route Handlers 구현
  - GET /api/[module] — 목록 (pagination, filters, soft delete 제외)
  - GET /api/[module]/[id] — 단건 조회
  - POST /api/[module] — 생성 (입력값 검증)
  - PUT /api/[module]/[id] — 수정 (권한 검증)
  - DELETE /api/[module]/[id] — Soft delete (deleted_at 설정)
  - NextAuth 세션 + 역할 검증 포함
```

### Frontend Layer
```markdown
### 3. Frontend Layer
- [ ] {DOC_NUM}_04: TypeScript 타입 정의
  - API 응답 타입 정의 (interface)
  - Props 타입 정의
  - Form 데이터 타입 정의

- [ ] {DOC_NUM}_05: TanStack Query Hooks
  - useQuery for 목록/상세 조회
  - useMutation for 생성/수정/삭제
  - Query Key 계층 구조 정의
  - Cache invalidation 구현

- [ ] {DOC_NUM}_06: 페이지 컴포넌트 구현
  - page.tsx (Server Component 가능 시 SC 우선)
  - Client Component 분리 (인터랙션 UI)
  - shadcn/ui 컴포넌트 활용
  - 200줄 이하 유지

- [ ] {DOC_NUM}_07: Frontend Coding Standards 준수 검증
  - **검증 항목**:
    - ✅ SC/CC 분리 패턴 준수
    - ✅ TanStack Query 패턴 준수 (Stale Time, Cache Invalidation)
    - ✅ Zustand 사용 범위 준수 (UI 상태만)
    - ✅ shadcn/ui + Tailwind CSS 사용
    - ✅ TypeScript strict mode 통과
    - ✅ ESLint/Prettier 통과
    - ✅ 에러 처리 표준화
    - ✅ RBAC 권한 검증 (서버 + 클라이언트)
  - **실행 명령어**:
    ```bash
    npm run build         # Next.js 빌드 + TypeScript
    npm run type-check    # TypeScript 검증
    npm run lint          # ESLint 검증
    npm run format        # Prettier 검증
    ```
```

### Testing Layer
```markdown
### 4. Testing Layer
- [ ] {DOC_NUM}_08: 단위 테스트
  - API Route Handler 테스트
  - Custom Hook 테스트
  - Component 테스트 (React Testing Library)
  - Coverage 80%+ 달성

- [ ] {DOC_NUM}_09: 통합/E2E 테스트
  - 사용자 시나리오 테스트
  - 권한별 접근 제어 테스트
  - Critical Path 100% 커버
```

---

## 1️⃣5️⃣ 파일 구조 참조

```
src/
├── app/
│   ├── layout.tsx                    # Root Layout (SC) - Providers
│   ├── (auth)/
│   │   ├── layout.tsx                # Auth Layout (사이드바 없음)
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx                # Main Layout (SC) → MainShell (CC)
│   │   ├── loading.tsx               # 공통 스켈레톤
│   │   ├── dashboard/page.tsx
│   │   └── [module]/
│   │       ├── page.tsx              # 목록 페이지
│   │       ├── [id]/page.tsx         # 상세 페이지
│   │       └── new/page.tsx          # 등록 페이지
│   └── api/
│       └── [module]/
│           ├── route.ts              # GET (list), POST (create)
│           └── [id]/route.ts         # GET (detail), PUT, DELETE
├── components/
│   ├── layout/                       # App Shell (Sidebar, Header, etc.)
│   ├── ui/                           # shadcn/ui primitives
│   └── features/[module]/            # 도메인별 컴포넌트
├── entities/                         # TypeORM Entity 정의
├── lib/                              # 유틸리티, 설정
├── stores/                           # Zustand stores
├── types/                            # 공유 타입 정의
└── middleware.ts                     # NextAuth 인증 미들웨어
```

---

## 1️⃣6️⃣ 빠른 참조

### 기술 스택 요약
| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Oracle XE 21c + TypeORM |
| Auth | NextAuth.js (Auth.js v5) |
| Server State | TanStack Query |
| Client State | Zustand |
| UI Library | shadcn/ui |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Testing | Jest/Vitest + React Testing Library + Playwright |
| Linting | ESLint + Prettier |

### Commit Convention
```
<type>(<scope>): <description>

Types: feat, fix, docs, test, refactor, perf, chore
Scopes: dashboard, tasks, support, projects, issues, inventory, maintenance, customers, employees, notices
```

---

**마지막 업데이트**: 2026-01-24
**버전**: 3.0.0 (sunjin-erp Next.js App Router)
**용도**: `/imb` 슬래시 명령어 전용 체크리스트
