// Generated: 2026-01-25 18:05:00 KST

import { create } from 'zustand';
import {
  IssueFilters,
  SortOptions,
  PaginationParams,
} from '@/types/issue';

interface IssueFilterState {
  // 필터 상태
  filters: IssueFilters;
  setFilters: (filters: IssueFilters) => void;
  updateFilter: (key: keyof IssueFilters, value: any) => void;
  clearFilters: () => void;

  // 페이지네이션 상태
  pagination: PaginationParams;
  setPagination: (pagination: PaginationParams) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // 정렬 상태
  sort: SortOptions;
  setSort: (sort: SortOptions) => void;

  // 모달 상태
  isCreateDialogOpen: boolean;
  setCreateDialogOpen: (open: boolean) => void;
  isDetailDialogOpen: boolean;
  setDetailDialogOpen: (open: boolean) => void;
  selectedIssueId: number | null;
  setSelectedIssueId: (id: number | null) => void;
}

const initialFilters: IssueFilters = {
  customer_id: undefined,
  status: undefined,
  severity: undefined,
  assignee_id: undefined,
  created_by_id: undefined,
  date_from: undefined,
  date_to: undefined,
  keyword: undefined,
};

const initialSort: SortOptions = {
  sort_by: 'created_at',
  sort_order: 'DESC',
};

const initialPagination: PaginationParams = {
  page: 1,
  page_size: 20,
};

export const useIssueFilterStore = create<IssueFilterState>((set) => ({
  // 필터
  filters: initialFilters,
  setFilters: (filters) => set({ filters }),
  updateFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
      pagination: { ...initialPagination }, // 필터 변경 시 페이지 1로 리셋
    }));
  },
  clearFilters: () => {
    set({
      filters: initialFilters,
      pagination: initialPagination,
    });
  },

  // 페이지네이션
  pagination: initialPagination,
  setPagination: (pagination) => set({ pagination }),
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },
  setPageSize: (pageSize) => {
    set({
      pagination: { page: 1, page_size: pageSize },
    });
  },

  // 정렬
  sort: initialSort,
  setSort: (sort) => {
    set({ sort });
  },

  // 모달
  isCreateDialogOpen: false,
  setCreateDialogOpen: (open) => set({ isCreateDialogOpen: open }),
  isDetailDialogOpen: false,
  setDetailDialogOpen: (open) => set({ isDetailDialogOpen: open }),
  selectedIssueId: null,
  setSelectedIssueId: (id) => set({ selectedIssueId: id }),
}));

/**
 * Selector Hooks (성능 최적화용)
 */

export const useIssueFilters = () =>
  useIssueFilterStore((state) => state.filters);
export const usePagination = () =>
  useIssueFilterStore((state) => state.pagination);
export const useSort = () => useIssueFilterStore((state) => state.sort);
