// Generated: 2026-01-24 21:15:00 KST

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
    }
  )
);
