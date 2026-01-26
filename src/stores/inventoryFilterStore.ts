// Generated: 2026-01-26 14:55:00 KST

import { create } from 'zustand';
import { InventoryStatus } from '@/types/inventory';

interface InventoryFilterState {
  // 필터 상태
  filters: {
    categories: string[];
    statuses: InventoryStatus[];
    location: string;
    search: string;
  };
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;

  // 페이지네이션 상태
  pagination: {
    page: number;
    pageSize: number;
  };
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // 정렬 상태
  sort: {
    sortBy: 'category' | 'model' | 'serialNumber' | 'location' | 'status' | 'purchaseDate';
    order: 'ASC' | 'DESC';
  };
  setSort: (sortBy: string, order: 'ASC' | 'DESC') => void;

  // 상세보기 모달 상태
  isDetailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  selectedInventoryId: number | null;
  setSelectedInventoryId: (id: number | null) => void;
}

const initialFilters = {
  categories: [] as string[],
  statuses: [] as InventoryStatus[],
  location: '',
  search: '',
};

const initialSort = {
  sortBy: 'purchaseDate' as const,
  order: 'DESC' as const,
};

const initialPagination = {
  page: 1,
  pageSize: 20,
};

export const useInventoryFilterStore = create<InventoryFilterState>((set) => ({
  // 필터
  filters: initialFilters,
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
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
  },
  setPageSize: (pageSize) => {
    set({
      pagination: { page: 1, pageSize },
    });
  },

  // 정렬
  sort: initialSort,
  setSort: (sortBy, order) => {
    set({ sort: { sortBy: sortBy as any, order } });
  },

  // 상세보기 모달
  isDetailOpen: false,
  setDetailOpen: (open) => set({ isDetailOpen: open }),
  selectedInventoryId: null,
  setSelectedInventoryId: (id) => set({ selectedInventoryId: id }),
}));

/**
 * Selector Hooks (성능 최적화용)
 */

export const useInventoryFilters = () =>
  useInventoryFilterStore((state) => state.filters);
export const useInventoryPagination = () =>
  useInventoryFilterStore((state) => state.pagination);
export const useInventorySort = () => useInventoryFilterStore((state) => state.sort);
