<!-- Generated: 2026-01-24 21:00:00 KST -->

# Zustand Sidebar Store

**문서 번호**: 2001_02
**원본 PRD**: 2001_전체_레이아웃_설정_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 State Management' 참조
**구현 범위**: 사이드바 UI 상태 관리 (축소/확장, 모바일 오버레이)
**복잡도**: S
**의존성**: 2001_01 (타입 정의)

---

## 구현 목표

사이드바의 축소/확장 상태와 모바일 오버레이 상태를 관리하는 Zustand store를 구현한다. localStorage persist로 상태를 유지한다.

---

## 구현 내용

### 파일 구조

```
src/
└── stores/
    └── sidebar-store.ts           # Zustand - 사이드바 상태
```

### 구현 상세

**`src/stores/sidebar-store.ts`**

```typescript
// Generated: YYYY-MM-DD HH:MM:SS KST

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  /** 사이드바 축소 여부 (Desktop/Tablet) */
  isCollapsed: boolean;
  /** 모바일/태블릿 오버레이 열림 상태 */
  isMobileOpen: boolean;
  /** 축소/확장 토글 */
  toggle: () => void;
  /** 모바일 사이드바 열기/닫기 */
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
    }),
    {
      name: 'sidebar-state',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
      // isMobileOpen은 persist하지 않음 (세션별 초기화)
    }
  )
);
```

### 핵심 설계 결정

1. **persist partialize**: `isCollapsed`만 localStorage에 저장. `isMobileOpen`은 페이지 로드 시 항상 `false`로 시작
2. **storage key**: `sidebar-state` (다른 Zustand store와 충돌 방지)
3. **서버 데이터 미포함**: PRD 원칙에 따라 UI 상태만 관리 (서버 데이터는 TanStack Query)

---

## Acceptance Criteria

- [ ] `useSidebarStore` 생성 및 export
- [ ] `toggle()` 호출 시 `isCollapsed` 상태 반전
- [ ] `setMobileOpen(true/false)` 호출 시 `isMobileOpen` 상태 변경
- [ ] localStorage에 `sidebar-state` 키로 `isCollapsed` 상태 저장
- [ ] `isMobileOpen`은 localStorage에 저장되지 않음
- [ ] 페이지 새로고침 후에도 `isCollapsed` 상태 유지
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/stores/sidebar-store.test.ts`

```typescript
import { act, renderHook } from '@testing-library/react';
import { useSidebarStore } from '@/stores/sidebar-store';

describe('useSidebarStore', () => {
  beforeEach(() => {
    // store 상태 초기화
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
    act(() => result.current.setMobileOpen(false));
    expect(result.current.isMobileOpen).toBe(false);
  });
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] localStorage persist 동작 확인

---

**다음 문서**: 2001_03_Root_Layout_및_Providers.md
