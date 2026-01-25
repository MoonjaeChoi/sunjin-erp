<!-- Generated: 2026-01-25 18:05:00 KST -->

# Zustand Store 정의

**문서 번호**: 2051_11
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('5.4 State Management')
**구현 범위**: 클라이언트 UI 상태 (필터, 페이지 번호, 모달 상태)
**복잡도**: S (Small)
**의존성**: 2051_09 (TypeScript 타입)

---

## 구현 목표

Zustand로 클라이언트 전용 UI 상태를 관리한다:
- 필터 상태 (고객사, 상태, 심각도 등)
- 페이지네이션 상태
- 모달/다이얼로그 상태

**중요**: 서버 데이터는 TanStack Query에서 관리 (Zustand에 복제하지 않음)

---

## 구현 내용

### 파일 구조

생성할 파일:
```
src/stores/issueFilterStore.ts  # 필터 상태
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/stores/issueFilterStore.ts

import { create } from 'zustand';
import { IssueFilters, SortOptions, PaginationParams, IssueStatus, IssueSeverity } from '@/types/issue';

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

export const useIssueFilters = () => useIssueFilterStore((state) => state.filters);
export const usePagination = () => useIssueFilterStore((state) => state.pagination);
export const useSort = () => useIssueFilterStore((state) => state.sort);
```

### 사용 예시

```typescript
// 컴포넌트에서 사용
import { useIssueFilterStore } from '@/stores/issueFilterStore';

function IssueListPage() {
  const filters = useIssueFilterStore((state) => state.filters);
  const updateFilter = useIssueFilterStore((state) => state.updateFilter);
  const pagination = useIssueFilterStore((state) => state.pagination);
  const setPage = useIssueFilterStore((state) => state.setPage);

  const handleCustomerChange = (customerId: number) => {
    updateFilter('customer_id', customerId);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <>
      {/* UI */}
    </>
  );
}
```

---

## 상태 관계도

```
IssueFilterState
├── filters (IssueFilters)
│   ├── customer_id
│   ├── status[]
│   ├── severity[]
│   ├── assignee_id
│   ├── date_from/date_to
│   └── keyword
├── pagination (PaginationParams)
│   ├── page
│   └── page_size
├── sort (SortOptions)
│   ├── sort_by
│   └── sort_order
└── UI 상태
    ├── isCreateDialogOpen
    ├── isDetailDialogOpen
    └── selectedIssueId
```

---

## Acceptance Criteria

- [ ] useIssueFilterStore 생성
- [ ] 필터 상태 관리
- [ ] 페이지네이션 상태 관리
- [ ] 정렬 상태 관리
- [ ] 모달 상태 관리
- [ ] Selector hooks 제공
- [ ] 필터 변경 시 페이지 리셋
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2051_12_Page_Components.md
