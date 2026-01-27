// Generated: 2026-01-28 16:00:00 KST

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NoticeType, NoticeSortBy, NoticeListParams } from '@/types/notice';

interface DateRange {
  start: string | null;
  end: string | null;
}

interface NoticeFilterState {
  // 필터 상태
  type: NoticeType | 'all';
  search: string;
  sortBy: NoticeSortBy;
  page: number;
  dateRange: DateRange;

  // Actions
  setType: (type: NoticeType | 'all') => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: NoticeSortBy) => void;
  setPage: (page: number) => void;
  setDateRange: (dateRange: DateRange) => void;
  reset: () => void;

  // Computed
  getQueryParams: () => NoticeListParams;
}

const initialState = {
  type: 'all' as const,
  search: '',
  sortBy: 'latest' as NoticeSortBy,
  page: 1,
  dateRange: { start: null, end: null },
};

export const useNoticeFilterStore = create<NoticeFilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setType: (type) => {
        set({ type, page: 1 }); // 필터 변경 시 페이지 리셋
      },

      setSearch: (search) => {
        set({ search, page: 1 }); // 검색 시 페이지 리셋
      },

      setSortBy: (sortBy) => {
        set({ sortBy, page: 1 }); // 정렬 변경 시 페이지 리셋
      },

      setPage: (page) => {
        set({ page });
      },

      setDateRange: (dateRange) => {
        set({ dateRange, page: 1 });
      },

      reset: () => {
        set(initialState);
      },

      getQueryParams: () => {
        const state = get();
        const params: NoticeListParams = {
          page: state.page,
          limit: 20,
          sortBy: state.sortBy,
        };

        if (state.type !== 'all') {
          params.type = state.type;
        }
        if (state.search.trim()) {
          params.search = state.search.trim();
        }
        if (state.dateRange.start) {
          params.startDate = state.dateRange.start;
        }
        if (state.dateRange.end) {
          params.endDate = state.dateRange.end;
        }

        return params;
      },
    }),
    {
      name: 'notice-filter-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        type: state.type,
        sortBy: state.sortBy,
        // search, page, dateRange는 세션 간 유지하지 않음
      }),
    }
  )
);

/**
 * Selector Hooks (성능 최적화용)
 */
export const useNoticeType = () => useNoticeFilterStore((state) => state.type);
export const useNoticeSearch = () => useNoticeFilterStore((state) => state.search);
export const useNoticeSortBy = () => useNoticeFilterStore((state) => state.sortBy);
export const useNoticePage = () => useNoticeFilterStore((state) => state.page);
export const useNoticeDateRange = () => useNoticeFilterStore((state) => state.dateRange);
