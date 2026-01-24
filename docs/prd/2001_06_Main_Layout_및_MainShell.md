<!-- Generated: 2026-01-24 21:00:00 KST -->

# Main Layout (SC) 및 MainShell (CC)

**문서 번호**: 2001_06
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1 Server/Client Component 분리, Section 6.2 레이아웃 구조' 참조
**구현 범위**: (main) Route Group Layout (SC) + MainShell Client Component (CC)
**복잡도**: M
**의존성**: 2001_02 (Sidebar Store), 2001_03 (Providers)

---

## 구현 목표

DT-1 결정에 따라 "Server Layout + Client Shell" 패턴을 구현한다. `(main)/layout.tsx`는 Server Component로 세션을 조회하고, `<MainShell>` Client Component에 props로 전달하여 인터랙티브 UI 쉘을 렌더링한다.

---

## 구현 내용

### 파일 구조

```
src/
├── app/
│   └── (main)/
│       ├── layout.tsx             # Main Layout (SC) - 세션 조회 + MainShell
│       └── dashboard/
│           └── page.tsx           # 대시보드 placeholder
└── components/
    └── layout/
        └── MainShell.tsx          # 'use client' - 사이드바+헤더+콘텐츠 쉘
```

### 1. Main Layout (`src/app/(main)/layout.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MainShell } from '@/components/layout/MainShell';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <MainShell session={session}>{children}</MainShell>;
}
```

### 2. MainShell 컴포넌트 (`src/components/layout/MainShell.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { type Session } from 'next-auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MainShellProps {
  session: Session;
  children: React.ReactNode;
}

export function MainShell({ session, children }: MainShellProps) {
  const { isCollapsed, toggle } = useSidebarStore();

  // 키보드 단축키: Ctrl/Cmd + B
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        // 텍스트 입력 중에는 단축키 비활성화
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar session={session} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 3. Dashboard Placeholder (`src/app/(main)/dashboard/page.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드 - Sunjin ERP',
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-gray-500 mt-2">대시보드 모듈에서 구현됩니다.</p>
    </div>
  );
}
```

### 핵심 설계 결정

1. **SC/CC 분리 (DT-1)**:
   - `layout.tsx` (SC): `getServerSession()`으로 세션 조회, 미인증 시 redirect
   - `MainShell.tsx` (CC): Zustand, useEffect, event handlers 사용
2. **키보드 단축키 (DT-8)**: `Ctrl/Cmd+B`로 사이드바 토글, 입력 필드 포커스 시 비활성화
3. **레이아웃 구조 (DT-6)**:
   - `h-screen overflow-hidden`: 전체 화면 고정
   - `flex-1 overflow-y-auto`: 콘텐츠만 스크롤
   - `p-6`: 콘텐츠 패딩
   - `max-w-full`: 기본 너비 제한 없음 (ERP 테이블 최적화)
4. **min-w-0**: flex item의 overflow 방지 (콘텐츠가 사이드바를 밀지 않도록)

---

## Acceptance Criteria

- [ ] `(main)/layout.tsx`가 Server Component로 유지
- [ ] `getServerSession()`으로 세션 조회
- [ ] 세션 없을 시 `/login` 리다이렉트
- [ ] `MainShell`에 `'use client'` 선언
- [ ] Sidebar + Header + Content 3영역 레이아웃 렌더링
- [ ] 콘텐츠 영역만 스크롤 (사이드바/헤더 고정)
- [ ] `Ctrl+B` / `Cmd+B` 단축키로 사이드바 토글
- [ ] 텍스트 입력 중 단축키 비활성화
- [ ] Dashboard placeholder 페이지 표시
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

**테스트 파일 위치**: `src/__tests__/components/layout/MainShell.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainShell } from '@/components/layout/MainShell';

// Mock dependencies
jest.mock('@/stores/sidebar-store');
jest.mock('./Sidebar', () => ({ Sidebar: () => <div data-testid="sidebar" /> }));
jest.mock('./Header', () => ({ Header: () => <div data-testid="header" /> }));

describe('MainShell', () => {
  const mockSession = {
    user: { name: 'Test User', role: 'ADMIN' },
    expires: '2026-12-31',
  };

  it('should render sidebar, header, and content', () => {
    render(
      <MainShell session={mockSession}>
        <div>Content</div>
      </MainShell>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should toggle sidebar on Ctrl+B', async () => {
    const user = userEvent.setup();
    render(
      <MainShell session={mockSession}>
        <div>Content</div>
      </MainShell>
    );
    await user.keyboard('{Control>}b{/Control}');
    // toggle이 호출되었는지 확인
  });

  it('should not toggle when input is focused', async () => {
    const user = userEvent.setup();
    render(
      <MainShell session={mockSession}>
        <input data-testid="input" />
      </MainShell>
    );
    const input = screen.getByTestId('input');
    await user.click(input);
    await user.keyboard('{Control>}b{/Control}');
    // toggle이 호출되지 않았는지 확인
  });
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run dev`에서 로그인 후 사이드바 + 헤더 + 콘텐츠 레이아웃 표시
3. `Ctrl+B` / `Cmd+B`로 사이드바 토글 동작 확인
4. 콘텐츠 영역만 스크롤되는지 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] SC/CC 분리 패턴 준수
- [ ] 키보드 단축키 동작
- [ ] 레이아웃 3영역 정상 렌더링

---

**다음 문서**: 2001_07_Sidebar_컴포넌트.md
