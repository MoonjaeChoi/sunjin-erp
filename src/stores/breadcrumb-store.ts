// Generated: 2026-01-24 22:20:00 KST

import { create } from 'zustand';

interface BreadcrumbState {
  /** 동적 세그먼트의 커스텀 레이블 (예: { '/customers/123': '삼성전자' }) */
  dynamicLabels: Record<string, string>;
  /** 동적 세그먼트 레이블 설정 */
  setLabel: (path: string, label: string) => void;
  /** 레이블 초기화 */
  clearLabels: () => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  dynamicLabels: {},
  setLabel: (path, label) =>
    set((state) => ({
      dynamicLabels: { ...state.dynamicLabels, [path]: label },
    })),
  clearLabels: () => set({ dynamicLabels: {} }),
}));
