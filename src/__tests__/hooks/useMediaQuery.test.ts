// Generated: 2026-01-24 22:40:00 KST

import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Array<(event: MediaQueryListEvent) => void>;
  let mockMatches: boolean;

  beforeEach(() => {
    listeners = [];
    mockMatches = false;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: mockMatches,
        media: query,
        addEventListener: jest.fn((event: string, listener: any) => {
          listeners.push(listener);
        }),
        removeEventListener: jest.fn((event: string, listener: any) => {
          listeners = listeners.filter((l) => l !== listener);
        }),
      })),
    });
  });

  it('should return initial match state', () => {
    mockMatches = true;
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    mockMatches = false;
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);
  });

  it('should update when media query changes', () => {
    mockMatches = false;
    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    // Simulate media query change
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);
  });

  it('should cleanup listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(listeners).toHaveLength(1);
    unmount();
    expect(listeners).toHaveLength(0);
  });
});
