// Generated: 2026-01-25 15:38:00 KST

import { useRef, useCallback } from 'react';

/**
 * 디바운스된 콜백 함수를 반환하는 Hook
 * 연속적인 함수 호출을 지정된 시간만큼 지연시켜 최종 호출만 실행
 *
 * @param callback 실행할 콜백 함수
 * @param delay 디바운스 지연 시간 (밀리초)
 * @returns 디바운스된 콜백 함수
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay]
  );
}
