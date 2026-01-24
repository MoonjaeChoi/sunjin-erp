<!-- Generated: 2026-01-24 18:30:00 KST -->

# Frontend Coding Standards - Quick Reference

**목적**: PRD 구현 시 필요한 핵심 지시사항 (간결한 참조용)
**원본**: FRONTEND_CODING_STANDARDS_IMPLEMENTATION_CHECKLIST.md (v3.0.0)
**프로젝트**: sunjin-erp (Next.js 14 App Router)
**최종 수정**: 2026-01-24

---

## 1. 기본 원칙

### Next.js App Router Architecture (MANDATORY)

**Route Group 분리**: 인증 상태에 따라 레이아웃 분기

| Route Group | 용도 | 레이아웃 |
|-------------|------|---------|
| `(auth)/` | 비인증 경로 (로그인) | 사이드바/헤더 없음 |
| `(main)/` | 인증 필수 경로 | 사이드바 + 헤더 + 콘텐츠 |
| `api/` | Route Handlers | REST API |

### Server Component (SC) vs Client Component (CC)

```tsx
// ✅ Server Component (기본값 - 'use client' 없으면 SC)
// 데이터 fetching, 세션 조회, 정적 렌더링
export default async function Page() {
  const session = await getServerSession(authOptions);
  return <ClientComponent session={session} />;
}

// ✅ Client Component ('use client' 선언 필수)
// 인터랙션, useState, Zustand, TanStack Query
'use client';
export function ClientComponent({ session }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**SC에서 금지**: useState, useEffect, event handler, Zustand, localStorage
**CC에서 금지**: 직접 DB 접근, getServerSession (props로 받기)

### 기술 스택
| 구분 | 기술 |
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

---

## 2. State Management

### 상태 분류
| 상태 유형 | 관리 방법 | 위치 |
|----------|----------|------|
| Server Data | TanStack Query | `useQuery`, `useMutation` |
| Global UI State | Zustand | `src/stores/` |
| Local State | useState | 컴포넌트 내부 |
| Form State | React Hook Form / useState | 컴포넌트 내부 |
| URL State | useSearchParams | Next.js 제공 |

### TanStack Query 패턴

```tsx
// ✅ 목록 조회
const { data, isLoading } = useQuery({
  queryKey: ['customers', 'list', { page, filter }],
  queryFn: () => fetch('/api/customers?page=' + page).then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5분
});

// ✅ 생성/수정 (mutation + cache invalidation)
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
});
```

**Stale Time**: 목록 5분, 상세 3분, 세션 10분
**Global onError**: 401 → `/login` 리다이렉트

### Zustand 규칙
- ✅ UI 상태만 (사이드바 축소, 필터, 폼 임시 저장)
- ✅ localStorage persist middleware 활용
- ❌ 서버 데이터 저장 금지

---

## 3. API Route Handlers

### RESTful 패턴
```
GET    /api/[module]       → 목록 (pagination, filters)
GET    /api/[module]/[id]  → 단건 조회
POST   /api/[module]       → 생성
PUT    /api/[module]/[id]  → 수정
DELETE /api/[module]/[id]  → Soft delete (deleted_at 설정)
```

### 구현 패턴
```tsx
// src/app/api/customers/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // TypeORM으로 조회 (deleted_at IS NULL 필수)
  const customers = await repo.find({ where: { deletedAt: IsNull() } });
  return NextResponse.json(customers);
}
```

---

## 4. Database (Oracle XE 21c + TypeORM)

### 필수 규칙
- ✅ `VARCHAR2` (VARCHAR 금지), `NUMBER`, `CLOB` (TEXT 금지)
- ✅ `deleted_at`, `created_at`, `updated_at` column 필수
- ✅ Sequence objects for auto-increment
- ❌ **CASCADE DELETE 절대 금지** → `ON DELETE RESTRICT`
- ❌ **Physical DELETE 금지** → Soft delete only
- ❌ **Fallback DB 금지** → Oracle 실패 시 HTTP 500 반환

---

## 5. Component Patterns

### 분류 및 위치
| 유형 | 위치 | 역할 |
|------|------|------|
| Layout | `src/components/layout/` | App Shell (Sidebar, Header) |
| UI Primitives | `src/components/ui/` | shadcn/ui 컴포넌트 |
| Feature | `src/components/features/[module]/` | 도메인별 컴포넌트 |
| Page | `src/app/(main)/[module]/page.tsx` | 페이지 엔트리 |

### 크기 제한
- 기본: **200줄 이하**
- 복잡 로직: Custom Hook 분리
- 반복 UI: 별도 컴포넌트 추출

### Next.js 특화 파일
- `loading.tsx` — 스켈레톤 UI (Suspense 대체)
- `error.tsx` — 에러 바운더리 (Client Component)
- `not-found.tsx` — 404 처리
- `layout.tsx` — 공유 레이아웃 (SC 유지)

---

## 6. Testing (모든 새 기능 필수)

### Coverage 목표
- **라인**: 80%+, **브랜치**: 75%+, **Critical Path**: 100%

### Testing Pyramid
- **70%**: Unit Tests (함수, hooks)
- **20%**: Integration Tests (컴포넌트 + API mock)
- **10%**: E2E Tests (Playwright)

### 쿼리 우선순위
1. `getByRole` → 2. `getByLabelText` → 3. `getByText` → 4. `getByTestId` (최후)

### 테스트 명령어
```bash
npm run test                # 단위 테스트
npm run test -- --coverage  # 커버리지 확인
```

---

## 7. Auth & RBAC

### 역할별 권한
| 역할 | 접근 범위 |
|------|----------|
| ADMIN | 전체 기능 + 직원/부서 관리 |
| MANAGER | 부서 범위 읽기/쓰기 |
| USER | 본인 데이터 + 공유 읽기 전용 |

### 검증 위치
- **Middleware**: 미인증 → `/login` 리다이렉트
- **API Route**: `getServerSession()` + role 검증
- **Client**: 메뉴/버튼 표시 제어 (보조적, 서버 검증 필수)

---

## 8. Styling (Tailwind + shadcn/ui)

### shadcn/ui 활용
- `src/components/ui/`에 설치
- Button, Input, Dialog, Table, Form, Select, Skeleton 등
- 커스터마이징: className 확장 (소스 수정 최소화)
- `cn()` 유틸리티 (clsx + tailwind-merge)

### 반응형 설계
| Breakpoint | 동작 |
|------------|------|
| Desktop (1280px+) | 기본 레이아웃 (사이드바 고정) |
| Tablet (768px~1279px) | 사이드바 축소 |
| Small (< 768px) | 사이드바 Sheet 오버레이 |

### 콘텐츠 너비
- 기본: `max-w-full` (ERP 테이블에 최적)
- 폼/상세: `max-w-5xl` 래핑 가능
- 아이콘: Lucide React (`lucide-react`)

---

## 9. Error Handling

### 3단계 처리
1. **API Route**: HTTP 상태 코드 + JSON 에러 응답
2. **Client**: `error.tsx` 에러 바운더리 + toast 표시
3. **Global**: TanStack Query onError → 401 시 리다이렉트

### HTTP 에러 메시지 (한글)
- `400`: "잘못된 요청입니다."
- `401`: "로그인이 필요합니다."
- `403`: "접근 권한이 없습니다."
- `404`: "요청하신 리소스를 찾을 수 없습니다."
- `500`: "서버 오류가 발생했습니다."

---

## 10. Performance

### Web Vitals 목표
- **CLS** < 0.1, **FCP** < 1.5s, **LCP** < 2.5s
- 사이드바 인터랙션 < 50ms, 페이지 전환 < 100ms

### 최적화 기법
- `next/image`, `next/link` (프리페칭)
- `next/dynamic` (heavy component lazy loading)
- Server Components로 클라이언트 번들 최소화
- 측정: Chrome DevTools / Lighthouse 수동 검증

---

## 11. 금지 사항 (❌)

```tsx
// ❌ Server Component에서 Client API 사용
export default function Page() {
  const [state, setState] = useState(0); // Error!
}

// ❌ Zustand에 서버 데이터 저장
const useStore = create((set) => ({
  customers: [], // 서버 데이터는 TanStack Query로!
}));

// ❌ CASCADE DELETE
// ON DELETE CASCADE -- 절대 금지!

// ❌ Fallback DB
// if (!oracle) connectSQLite(); -- 금지!
```

### 전체 금지 목록
- ❌ CASCADE DELETE (soft delete 사용)
- ❌ Fallback DB (Oracle 전용)
- ❌ Physical DELETE (deleted_at 사용)
- ❌ SC에서 useState/useEffect/Zustand
- ❌ 인라인 스타일 (Tailwind 사용)
- ❌ `any` 타입 무분별 사용

---

## 12. Code Review Checklist

### 아키텍처
- [ ] SC/CC 분리 올바른가?
- [ ] API Route에서 세션 + 역할 검증하는가?
- [ ] Soft delete 적용했는가?

### 코드 품질
- [ ] TypeScript strict mode 통과?
- [ ] `npm run lint` 통과?
- [ ] `npm run build` 성공?

### 테스트
- [ ] 새 기능에 테스트 추가?
- [ ] Coverage 80%+ (라인), 75%+ (브랜치)?

### 성능
- [ ] heavy 컴포넌트 dynamic import?
- [ ] 불필요한 CC 선언 없는가? (SC로 가능한 부분)

---

## 13. 필수 검증 (모든 구현 후)

```bash
# TypeScript & Lint
npm run build             # Next.js 빌드 (TS 컴파일 포함)
npm run type-check        # TypeScript strict 검증
npm run lint              # ESLint
npm run format            # Prettier

# 테스트
npm run test              # 단위 테스트
npm run test -- --coverage  # 커버리지

# 개발 서버
npm run dev               # http://localhost:3000

# Docker
docker-compose up -d      # App + Oracle XE
```

---

## 🚀 Quick Start

```bash
# 1. 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env      # Oracle, NextAuth 설정

# 3. Docker (Oracle XE)
docker-compose up -d

# 4. 개발 서버
npm run dev               # http://localhost:3000

# 5. Quality Check
npm run build && npm run lint && npm run test
```

---

**최종 업데이트**: 2026-01-24
**프로젝트**: sunjin-erp (Next.js 14 App Router + Oracle XE 21c)
**용도**: PRD 구현 시 빠른 참조 (~250줄)
