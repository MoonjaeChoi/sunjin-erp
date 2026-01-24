// Generated: 2026-01-24 21:15:00 KST

import { act, renderHook } from '@testing-library/react';
import { useSidebarStore } from '@/stores/sidebar-store';

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
    act(() => result.current.setMobileOpen(false));
    expect(result.current.isMobileOpen).toBe(false);
  });

  it('should expose toggle and setMobileOpen as functions', () => {
    const { result } = renderHook(() => useSidebarStore());
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.setMobileOpen).toBe('function');
  });
});
