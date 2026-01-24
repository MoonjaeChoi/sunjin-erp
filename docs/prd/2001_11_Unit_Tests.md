<!-- Generated: 2026-01-24 21:00:00 KST -->

# Unit Tests

**문서 번호**: 2001_11
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 전체 기능의 단위 테스트
**구현 범위**: 모든 레이아웃 컴포넌트, Store, Config의 단위 테스트
**복잡도**: L
**의존성**: 2001_01~2001_10 (모든 구현 항목)

---

## 구현 목표

레이아웃 시스템의 모든 컴포넌트와 유틸리티에 대한 단위 테스트를 작성한다. 커버리지 목표: 라인 80%+, 브랜치 75%+.

---

## 구현 내용

### 테스트 파일 구조

```
src/__tests__/
├── lib/
│   ├── navigation-config.test.ts
│   ├── breadcrumb-config.test.ts
│   └── query-client.test.ts
├── stores/
│   ├── sidebar-store.test.ts
│   └── breadcrumb-store.test.ts
├── hooks/
│   └── useMediaQuery.test.ts
└── components/layout/
    ├── MainShell.test.tsx
    ├── Sidebar.test.tsx
    ├── SidebarMenuItem.test.tsx
    ├── Header.test.tsx
    ├── UserMenu.test.tsx
    ├── Breadcrumb.test.tsx
    └── Loading.test.tsx
```

### 1. navigation-config.test.ts

```typescript
import { navigationGroups, hasPermission, getFilteredNavigation } from '@/lib/navigation-config';

describe('navigationGroups', () => {
  it('should have 4 groups', () => {
    expect(navigationGroups).toHaveLength(4);
  });

  it('should have total 10 menu items', () => {
    const total = navigationGroups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(10);
  });

  it('should have employees menu requiring MANAGER role', () => {
    const allItems = navigationGroups.flatMap(g => g.items);
    const employees = allItems.find(i => i.href === '/employees');
    expect(employees?.requiredRole).toBe('MANAGER');
  });
});

describe('hasPermission', () => {
  it('should allow ADMIN to access all roles', () => {
    expect(hasPermission('ADMIN', 'USER')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGER')).toBe(true);
    expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
  });

  it('should allow MANAGER to access USER and MANAGER', () => {
    expect(hasPermission('MANAGER', 'USER')).toBe(true);
    expect(hasPermission('MANAGER', 'MANAGER')).toBe(true);
    expect(hasPermission('MANAGER', 'ADMIN')).toBe(false);
  });

  it('should restrict USER to USER only', () => {
    expect(hasPermission('USER', 'USER')).toBe(true);
    expect(hasPermission('USER', 'MANAGER')).toBe(false);
    expect(hasPermission('USER', 'ADMIN')).toBe(false);
  });
});

describe('getFilteredNavigation', () => {
  it('should show 9 items for USER (employees hidden)', () => {
    const groups = getFilteredNavigation('USER');
    const allItems = groups.flatMap(g => g.items);
    expect(allItems).toHaveLength(9);
    expect(allItems.find(i => i.href === '/employees')).toBeUndefined();
  });

  it('should show 10 items for MANAGER', () => {
    const groups = getFilteredNavigation('MANAGER');
    const allItems = groups.flatMap(g => g.items);
    expect(allItems).toHaveLength(10);
  });

  it('should show 10 items for ADMIN', () => {
    const groups = getFilteredNavigation('ADMIN');
    const allItems = groups.flatMap(g => g.items);
    expect(allItems).toHaveLength(10);
  });

  it('should remove empty groups after filtering', () => {
    // 모든 그룹에 최소 1개 USER 항목이 있으므로 빈 그룹 없음
    const groups = getFilteredNavigation('USER');
    groups.forEach(g => expect(g.items.length).toBeGreaterThan(0));
  });
});
```

### 2. sidebar-store.test.ts

```typescript
import { useSidebarStore } from '@/stores/sidebar-store';
import { act, renderHook } from '@testing-library/react';

describe('useSidebarStore', () => {
  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false, isMobileOpen: false });
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useSidebarStore());
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.isMobileOpen).toBe(false);
  });

  it('should toggle isCollapsed', () => {
    const { result } = renderHook(() => useSidebarStore());
    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(false);
  });

  it('should set mobile open state', () => {
    const { result } = renderHook(() => useSidebarStore());
    act(() => result.current.setMobileOpen(true));
    expect(result.current.isMobileOpen).toBe(true);
  });
});
```

### 3. breadcrumb-store.test.ts

```typescript
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';
import { act, renderHook } from '@testing-library/react';

describe('useBreadcrumbStore', () => {
  beforeEach(() => {
    useBreadcrumbStore.setState({ dynamicLabels: {} });
  });

  it('should set dynamic label', () => {
    const { result } = renderHook(() => useBreadcrumbStore());
    act(() => result.current.setLabel('/customers/123', '삼성전자'));
    expect(result.current.dynamicLabels['/customers/123']).toBe('삼성전자');
  });

  it('should clear all labels', () => {
    const { result } = renderHook(() => useBreadcrumbStore());
    act(() => result.current.setLabel('/customers/123', '삼성전자'));
    act(() => result.current.clearLabels());
    expect(result.current.dynamicLabels).toEqual({});
  });
});
```

### 4. Sidebar.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false, // Desktop
}));

describe('Sidebar', () => {
  const adminSession = { user: { name: 'Admin', role: 'ADMIN' }, expires: '' };
  const userSession = { user: { name: 'User', role: 'USER' }, expires: '' };

  it('should render menu items for ADMIN', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('직원 관리')).toBeInTheDocument();
  });

  it('should hide employees for USER', () => {
    render(<Sidebar session={userSession} />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('직원 관리')).not.toBeInTheDocument();
  });

  it('should highlight active menu item', () => {
    render(<Sidebar session={adminSession} />);
    const dashboardLink = screen.getByText('대시보드').closest('a');
    expect(dashboardLink).toHaveClass('bg-gray-100');
  });

  it('should show version info when expanded', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('should render toggle button', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('축소')).toBeInTheDocument();
  });

  it('should render separators between groups', () => {
    render(<Sidebar session={adminSession} />);
    const separators = document.querySelectorAll('[data-orientation]');
    expect(separators.length).toBe(3); // 4그룹 = 3 separator
  });
});
```

### 5. Header.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(),
}));
jest.mock('./Breadcrumb', () => ({ Breadcrumb: () => <div data-testid="breadcrumb" /> }));

describe('Header', () => {
  const session = { user: { name: '홍길동', role: 'ADMIN' }, expires: '' };

  it('should render breadcrumb area', () => {
    render(<Header session={session} />);
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  it('should show hamburger on small screen', () => {
    const { useMediaQuery } = require('@/hooks/useMediaQuery');
    useMediaQuery.mockReturnValue(true); // isSmallScreen = true
    render(<Header session={session} />);
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument();
  });

  it('should hide hamburger on desktop', () => {
    const { useMediaQuery } = require('@/hooks/useMediaQuery');
    useMediaQuery.mockReturnValue(false);
    render(<Header session={session} />);
    expect(screen.queryByLabelText('메뉴 열기')).not.toBeInTheDocument();
  });
});
```

### 6. UserMenu.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/layout/UserMenu';

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('UserMenu', () => {
  const session = { user: { name: '홍길동', role: 'ADMIN' }, expires: '' };

  it('should display user name', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('should display Korean role label', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('should show avatar initials', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('홍길')).toBeInTheDocument();
  });

  it('should call signOut on logout click', async () => {
    const user = userEvent.setup();
    const { signOut } = require('next-auth/react');
    render(<UserMenu session={session} />);

    // 드롭다운 열기
    await user.click(screen.getByText('홍길동'));
    await user.click(screen.getByText('로그아웃'));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
```

### 7. Breadcrumb.test.tsx

```typescript
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Breadcrumb', () => {
  it('should render static path label', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/customers');
    render(<Breadcrumb />);
    expect(screen.getByText('고객 관리')).toBeInTheDocument();
  });

  it('should render nested path', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/customers/new');
    render(<Breadcrumb />);
    expect(screen.getByText('고객 관리')).toBeInTheDocument();
    expect(screen.getByText('등록')).toBeInTheDocument();
  });

  it('should render dynamic label from store', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/customers/123');

    // Store에 동적 레이블 설정
    const { useBreadcrumbStore } = require('@/stores/breadcrumb-store');
    useBreadcrumbStore.setState({
      dynamicLabels: { '/customers/123': '삼성전자' },
    });

    render(<Breadcrumb />);
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
  });

  it('should render last item as non-clickable', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    const lastItem = screen.getByText('대시보드');
    expect(lastItem.closest('a')).toBeNull();
  });
});
```

### 8. query-client.test.ts

```typescript
import { makeQueryClient } from '@/lib/query-client';

describe('makeQueryClient', () => {
  it('should create QueryClient with 5min staleTime', () => {
    const client = makeQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(300000);
  });

  it('should not retry on 401', () => {
    const client = makeQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Function;
    expect(retry(1, { status: 401 })).toBe(false);
  });

  it('should retry up to 3 times on other errors', () => {
    const client = makeQueryClient();
    const retry = client.getDefaultOptions().queries?.retry as Function;
    expect(retry(1, { status: 500 })).toBe(true);
    expect(retry(2, { status: 500 })).toBe(true);
    expect(retry(3, { status: 500 })).toBe(false);
  });
});
```

---

## 실행 명령어

```bash
# 전체 테스트
npm run test

# 특정 파일
npm run test -- src/__tests__/components/layout/Sidebar.test.tsx

# 커버리지
npm run test -- --coverage

# Watch 모드
npm run test -- --watch
```

---

## Coverage 목표

| 대상 | 라인 | 브랜치 |
|------|------|--------|
| navigation-config.ts | 100% | 100% |
| sidebar-store.ts | 100% | 100% |
| breadcrumb-store.ts | 100% | 100% |
| Sidebar.tsx | 80%+ | 75%+ |
| Header.tsx | 80%+ | 75%+ |
| UserMenu.tsx | 80%+ | 75%+ |
| Breadcrumb.tsx | 80%+ | 75%+ |
| MainShell.tsx | 80%+ | 75%+ |

---

## Acceptance Criteria

- [ ] 모든 테스트 파일 작성
- [ ] `npm run test` 전체 통과
- [ ] 라인 커버리지 80%+
- [ ] 브랜치 커버리지 75%+
- [ ] 모든 critical path (RBAC 필터링, 로그아웃, 리다이렉트) 100% 커버

---

## 완료 체크리스트

- [ ] 테스트 전체 통과
- [ ] 커버리지 목표 달성
- [ ] ESLint 통과 (테스트 파일 포함)
- [ ] Mock 설정 올바름

---

**다음 문서**: 2001_12_E2E_Tests.md
