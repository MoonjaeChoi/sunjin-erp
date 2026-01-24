<!-- Generated: 2026-01-24 21:00:00 KST -->

# Header 및 UserMenu 컴포넌트

**문서 번호**: 2001_08
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'US-5, US-6, Section 6.2' 참조
**구현 범위**: Header 컴포넌트 (사이드바 토글, Breadcrumb 영역) + UserMenu (프로필, 로그아웃)
**복잡도**: M
**의존성**: 2001_06 (MainShell)

---

## 구현 목표

헤더에 사이드바 토글 버튼(모바일), Breadcrumb 영역, 사용자 정보 및 로그아웃 드롭다운 메뉴를 구현한다.

---

## 구현 내용

### 파일 구조

```
src/components/layout/
├── Header.tsx                     # 상단 헤더 (토글 + Breadcrumb + UserMenu)
└── UserMenu.tsx                   # 사용자 프로필 드롭다운
```

### 1. Header 컴포넌트 (`src/components/layout/Header.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { type Session } from 'next-auth';
import { useSidebarStore } from '@/stores/sidebar-store';
import { UserMenu } from './UserMenu';
import { Breadcrumb } from './Breadcrumb';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const { setMobileOpen } = useSidebarStore();
  const isSmallScreen = useMediaQuery('(max-width: 767px)');

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* 모바일: 햄버거 메뉴 버튼 */}
        {isSmallScreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Breadcrumb */}
        <Breadcrumb />
      </div>

      {/* 사용자 메뉴 */}
      <UserMenu session={session} />
    </header>
  );
}
```

### 2. UserMenu 컴포넌트 (`src/components/layout/UserMenu.tsx`)

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

'use client';

import { type Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { UserRole } from '@/types/navigation';

interface UserMenuProps {
  session: Session;
}

/** 역할 한글 표시 */
const roleLabels: Record<UserRole, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  USER: '사용자',
};

export function UserMenu({ session }: UserMenuProps) {
  const user = session.user as any;
  const name = user.name || '사용자';
  const role = user.role as UserRole;
  const initials = name.slice(0, 2);

  async function handleLogout() {
    await signOut({ callbackUrl: '/login' });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-gray-500">{roleLabels[role]}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-gray-500">{roleLabels[role]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 핵심 설계 결정

1. **모바일 햄버거**: `isSmallScreen` (< 768px) 조건부 렌더링
2. **Breadcrumb 영역**: Header 좌측에 배치 (별도 컴포넌트 2001_09에서 구현)
3. **사용자 정보**: Avatar (이름 이니셜) + 이름 + 역할 배지
4. **로그아웃**: `signOut({ callbackUrl: '/login' })` — 세션 종료 후 로그인 페이지 이동
5. **반응형**: sm 미만에서 이름/역할 텍스트 숨김 (Avatar만 표시)

---

## Acceptance Criteria

- [ ] 헤더 높이 h-14 (56px), 하단 border
- [ ] 768px 미만에서 햄버거 메뉴 버튼 표시
- [ ] 햄버거 클릭 시 `setMobileOpen(true)` 호출
- [ ] 우측에 사용자 Avatar + 이름 + 역할 표시
- [ ] 드롭다운 메뉴에 사용자 정보 + 로그아웃 항목
- [ ] 로그아웃 클릭 시 세션 종료 후 `/login` 이동
- [ ] 역할이 한글로 표시 (ADMIN→관리자, MANAGER→매니저, USER→사용자)
- [ ] `npm run build` 성공

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/layout/Header.test.tsx`

```typescript
describe('Header', () => {
  it('should render breadcrumb area', () => {});
  it('should show hamburger menu on small screens', () => {});
  it('should render UserMenu', () => {});
});

describe('UserMenu', () => {
  it('should display user name and role', () => {});
  it('should show Korean role label', () => {});
  it('should call signOut on logout click', () => {});
  it('should show avatar with initials', () => {});
});
```

### 검증 방법

1. `npm run dev`에서 헤더에 사용자 정보 표시 확인
2. 드롭다운 메뉴 열림/닫힘 확인
3. 로그아웃 동작 확인
4. 768px 미만에서 햄버거 메뉴 표시 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] 사용자 정보 정상 표시
- [ ] 로그아웃 동작
- [ ] 반응형 햄버거 메뉴

---

**다음 문서**: 2001_09_Breadcrumb_컴포넌트.md
