<!-- Generated: 2026-01-24 21:00:00 KST -->

# Sidebar 컴포넌트

**문서 번호**: 2001_07
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.6, 6.2, 6.3, 6.4, 6.5' 참조
**구현 범위**: Sidebar 컴포넌트 (메뉴 그룹핑, RBAC 필터링, 축소/확장, 반응형, 하단 영역)
**복잡도**: L
**의존성**: 2001_01 (네비게이션 설정), 2001_02 (Sidebar Store), 2001_06 (MainShell)

---

## 구현 목표

역할 기반 메뉴 필터링, Separator 그룹핑, 축소/확장 전환, 반응형(Desktop/Tablet/Small) 동작, 하단 버전 정보 및 토글 버튼을 포함하는 사이드바 컴포넌트를 구현한다.

---

## 구현 내용

### 파일 구조

```
src/components/layout/
├── Sidebar.tsx                    # 사이드바 메인 컴포넌트
└── SidebarMenuItem.tsx            # 개별 메뉴 항목
```

### 1. Sidebar 컴포넌트 (`src/components/layout/Sidebar.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { type Session } from 'next-auth';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { getFilteredNavigation } from '@/lib/navigation-config';
import { UserRole } from '@/types/navigation';
import { SidebarMenuItem } from './SidebarMenuItem';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SidebarProps {
  session: Session;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const userRole = (session.user as any).role as UserRole;
  const groups = getFilteredNavigation(userRole);
  const isSmallScreen = useMediaQuery('(max-width: 767px)');

  // Small screen: Sheet 오버레이
  if (isSmallScreen) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            groups={groups}
            pathname={pathname}
            isCollapsed={false}
            onNavigate={() => setMobileOpen(false)}
            toggle={toggle}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: 고정 사이드바
  return (
    <aside
      className={cn(
        'h-screen border-r bg-white flex flex-col transition-[width] duration-200 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent
        groups={groups}
        pathname={pathname}
        isCollapsed={isCollapsed}
        toggle={toggle}
      />
    </aside>
  );
}

interface SidebarContentProps {
  groups: ReturnType<typeof getFilteredNavigation>;
  pathname: string;
  isCollapsed: boolean;
  toggle: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ groups, pathname, isCollapsed, toggle, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* 로고/타이틀 영역 */}
      <div className={cn(
        'h-14 flex items-center border-b px-4',
        isCollapsed ? 'justify-center' : 'justify-start'
      )}>
        {isCollapsed ? (
          <span className="text-lg font-bold">S</span>
        ) : (
          <span className="text-lg font-bold">Sunjin ERP</span>
        )}
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && (
              <Separator className="my-2 mx-3" />
            )}
            <div className="space-y-1 px-2">
              {group.items.map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                  isCollapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 영역: 버전 + 토글 버튼 (DT-10) */}
      <div className="border-t p-2">
        {!isCollapsed && (
          <p className="text-xs text-gray-400 px-2 mb-1">v0.1.0</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
          onClick={toggle}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 mr-2" />
              <span>축소</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
```

### 2. SidebarMenuItem 컴포넌트 (`src/components/layout/SidebarMenuItem.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import Link from 'next/link';
import { NavigationItem } from '@/types/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarMenuItemProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarMenuItem({ item, isActive, isCollapsed, onNavigate }: SidebarMenuItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-gray-100',
        isActive && 'bg-gray-100 text-primary border-l-2 border-primary',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );

  // 축소 시 Tooltip 표시
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
```

### 3. useMediaQuery Hook (`src/hooks/useMediaQuery.ts`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    function listener(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

### 핵심 설계 결정

1. **RBAC 필터링**: `getFilteredNavigation(userRole)`로 메뉴 필터링 (DT-2)
2. **그룹핑**: Separator 컴포넌트로 시각적 구분 (DT-7)
3. **축소/확장**: width transition 200ms, 축소 시 아이콘만 + Tooltip
4. **활성 상태**: pathname 기반 active 표시 (배경색 + 좌측 border)
5. **반응형 (DT-8)**:
   - Desktop (1280px+): 고정, 확장 기본
   - Tablet (768px~1279px): 고정, 확장/축소 가능
   - Small (< 768px): 숨김, Sheet 오버레이
6. **하단 영역 (DT-10)**: 버전 정보 + 축소/확장 토글 버튼 (VS Code 스타일)
7. **모바일 닫기**: 메뉴 선택 시 `onNavigate` 콜백으로 Sheet 자동 닫기

---

## Acceptance Criteria

- [ ] 4개 그룹, 10개 메뉴 항목 렌더링
- [ ] USER 역할에서 직원 관리 메뉴 미표시 (9개 표시)
- [ ] MANAGER 역할에서 모든 10개 메뉴 표시
- [ ] Separator로 그룹 간 시각적 구분
- [ ] 축소 시 아이콘만 표시 + Tooltip 메뉴명
- [ ] 확장 시 아이콘 + 텍스트 표시
- [ ] width transition 200ms ease-in-out
- [ ] 현재 경로에 해당하는 메뉴 항목 active 스타일 적용
- [ ] 768px 미만에서 Sheet 오버레이로 동작
- [ ] 메뉴 선택 시 Sheet 자동 닫힘
- [ ] 하단에 버전 정보 표시 (확장 시)
- [ ] 하단에 축소/확장 토글 버튼
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/layout/Sidebar.test.tsx`

```typescript
describe('Sidebar', () => {
  it('should render all menu groups with separators', () => {});
  it('should filter menu items by user role', () => {});
  it('should highlight active menu item', () => {});
  it('should show tooltip on collapsed items', () => {});
  it('should show version info in expanded state', () => {});
  it('should toggle collapse on button click', () => {});
});

describe('SidebarMenuItem', () => {
  it('should render icon and label in expanded state', () => {});
  it('should render icon only in collapsed state', () => {});
  it('should apply active styles when isActive is true', () => {});
  it('should call onNavigate when clicked', () => {});
});
```

### 검증 방법

1. `npm run dev`에서 사이드바 메뉴 표시 확인
2. 축소/확장 토글 동작 확인
3. 권한별 메뉴 필터링 확인 (USER/MANAGER/ADMIN)
4. 브라우저 크기 조정으로 반응형 동작 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] RBAC 필터링 동작
- [ ] 반응형 동작 (Desktop/Tablet/Small)
- [ ] 축소/확장 전환 + Tooltip
- [ ] 하단 버전 정보 + 토글 버튼

---

**다음 문서**: 2001_08_Header_및_UserMenu_컴포넌트.md
