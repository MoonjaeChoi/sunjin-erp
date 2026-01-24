<!-- Generated: 2026-01-24 21:00:00 KST -->

# Root Layout 및 Providers

**문서 번호**: 2001_03
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1 Root Layout, Section 5.4 TanStack Query 설정' 참조
**구현 범위**: Root Layout, QueryClient Provider, SessionProvider, Toaster
**복잡도**: S
**의존성**: 없음

---

## 구현 목표

애플리케이션의 Root Layout에 전역 Provider들을 설정한다. TanStack Query의 QueryClient(401 에러 처리 포함), NextAuth SessionProvider, 글로벌 Toaster를 구성한다.

---

## 구현 내용

### 파일 구조

```
src/
├── app/
│   └── layout.tsx                 # Root Layout (SC) - HTML/Body + Providers
├── components/
│   └── providers/
│       └── Providers.tsx           # 'use client' - QueryClient + Session + Toaster
└── lib/
    └── query-client.ts            # QueryClient 인스턴스 설정
```

### 1. QueryClient 설정 (`src/lib/query-client.ts`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query 글로벌 설정
 *
 * PRD Section 5.4 참조:
 * - 401 응답 시 재시도 안 함
 * - mutation 에러 시 401이면 로그인 리다이렉트
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          if (error?.status === 401) return false;
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5분
      },
      mutations: {
        onError: (error: any) => {
          if (error?.status === 401) {
            window.location.href = '/login';
          }
        },
      },
    },
  });
}
```

### 2. Providers 컴포넌트 (`src/components/providers/Providers.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { makeQueryClient } from '@/lib/query-client';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### 3. Root Layout (`src/app/layout.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sunjin ERP',
  description: 'Sunjin ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 핵심 설계 결정

1. **Server Component 유지**: Root Layout은 SC. Client-only 로직은 `Providers` CC에 위임
2. **QueryClient 생성**: `useState`로 컴포넌트 lifecycle에 바인딩 (SSR 안전)
3. **SessionProvider**: `refetchOnWindowFocus: true`로 탭 전환 시 세션 동기화 (DT-3 결정)
4. **Toaster**: 전역 토스트 알림 렌더링

---

## Acceptance Criteria

- [ ] `src/app/layout.tsx`가 Server Component로 유지
- [ ] `Providers` 컴포넌트에 `'use client'` 선언
- [ ] QueryClient에 401 재시도 방지 + 로그인 리다이렉트 설정
- [ ] SessionProvider에 `refetchOnWindowFocus: true` 설정
- [ ] Toaster 전역 렌더링
- [ ] HTML lang="ko" 설정
- [ ] `npm run build` 성공

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/lib/query-client.test.ts`

```typescript
describe('makeQueryClient', () => {
  it('should create a QueryClient with correct defaults', () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
  });

  it('should not retry on 401 errors', () => {
    const client = makeQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Function;
    expect(retry(1, { status: 401 })).toBe(false);
    expect(retry(1, { status: 500 })).toBe(true);
    expect(retry(3, { status: 500 })).toBe(false);
  });
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run dev`에서 페이지 로드 시 Provider 에러 없음
3. React DevTools에서 Provider 트리 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] Root Layout이 SC로 유지
- [ ] Provider가 CC로 분리

---

**다음 문서**: 2001_04_인증_Middleware.md
