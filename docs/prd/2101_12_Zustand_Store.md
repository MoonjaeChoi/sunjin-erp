<!-- Generated: 2026-01-28 15:30:00 KST -->

# Zustand Store (필터 상태 관리)

**문서 번호**: 2101_12
**원본 PRD**: 2101_공지사항_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 6.4 State Management' 참조
**구현 범위**: 목록 필터 상태 (localStorage 동기화)
**복잡도**: S (0.5~1일)
**의존성**: 2101_11 (TanStack Query Hooks)

---

## 구현 목표

공지사항 목록 페이지의 필터 상태를 Zustand로 관리합니다.
- 게시판 유형 필터
- 검색어
- 정렬 기준
- localStorage 동기화

---

## 구현 내용

### 파일 구조

```
src/stores/
└── noticeFilterStore.ts
```

### Store 구현

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { NoticeType, NoticeSortBy } from '@/types/notice';

interface NoticeFilterState {
  // 필터 상태
  type: NoticeType | 'all';
  search: string;
  sortBy: NoticeSortBy;
  page: number;

  // 날짜 범위 (선택)
  startDate: string | null;
  endDate: string | null;

  // Actions
  setType: (type: NoticeType | 'all') => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: NoticeSortBy) => void;
  setPage: (page: number) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  reset: () => void;
}

const initialState = {
  type: 'all' as const,
  search: '',
  sortBy: 'latest' as NoticeSortBy,
  page: 1,
  startDate: null,
  endDate: null,
};

export const useNoticeFilterStore = create<NoticeFilterState>()(
  persist(
    (set) => ({
      ...initialState,

      setType: (type) => set({ type, page: 1 }), // 필터 변경 시 페이지 리셋
      setSearch: (search) => set({ search, page: 1 }),
      setSortBy: (sortBy) => set({ sortBy, page: 1 }),
      setPage: (page) => set({ page }),
      setDateRange: (startDate, endDate) => set({ startDate, endDate, page: 1 }),

      reset: () => set(initialState),
    }),
    {
      name: 'notice-filter-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // 페이지는 저장하지 않음 (새로고침 시 1페이지로)
        type: state.type,
        search: state.search,
        sortBy: state.sortBy,
        startDate: state.startDate,
        endDate: state.endDate,
      }),
    }
  )
);

// 셀렉터 (성능 최적화)
export const selectNoticeFilters = (state: NoticeFilterState) => ({
  type: state.type,
  search: state.search,
  sortBy: state.sortBy,
  page: state.page,
  startDate: state.startDate,
  endDate: state.endDate,
});

export const selectNoticeFilterActions = (state: NoticeFilterState) => ({
  setType: state.setType,
  setSearch: state.setSearch,
  setSortBy: state.setSortBy,
  setPage: state.setPage,
  setDateRange: state.setDateRange,
  reset: state.reset,
});
```

---

## 사용 예시

### 목록 페이지에서 사용

```typescript
'use client';

import { useNoticeFilterStore, selectNoticeFilters, selectNoticeFilterActions } from '@/stores/noticeFilterStore';
import { useNotices } from '@/hooks/notices';

export function NoticeListPage() {
  // 필터 상태
  const filters = useNoticeFilterStore(selectNoticeFilters);
  const actions = useNoticeFilterStore(selectNoticeFilterActions);

  // TanStack Query와 연동
  const { data, isLoading } = useNotices({
    page: filters.page,
    type: filters.type,
    search: filters.search,
    sortBy: filters.sortBy,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  return (
    <div>
      {/* 필터 UI */}
      <NoticeFilters
        type={filters.type}
        search={filters.search}
        sortBy={filters.sortBy}
        onTypeChange={actions.setType}
        onSearchChange={actions.setSearch}
        onSortByChange={actions.setSortBy}
        onReset={actions.reset}
      />

      {/* 목록 */}
      <NoticeTable data={data?.data ?? []} isLoading={isLoading} />

      {/* 페이지네이션 */}
      <Pagination
        page={filters.page}
        totalPages={data?.pagination.totalPages ?? 0}
        onPageChange={actions.setPage}
      />
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] noticeFilterStore 구현
  - [ ] 유형 필터 상태
  - [ ] 검색어 상태
  - [ ] 정렬 상태
  - [ ] 페이지 상태
  - [ ] 날짜 범위 상태
- [ ] localStorage 동기화
- [ ] 필터 변경 시 페이지 1로 리셋
- [ ] reset 액션 동작

---

## 테스트 전략

```typescript
describe('noticeFilterStore', () => {
  it('should reset page when filter changes', () => {
    const store = useNoticeFilterStore.getState();
    store.setPage(3);
    store.setType('공지');
    expect(store.page).toBe(1);
  });

  it('should persist filters to localStorage', () => {
    // localStorage mock으로 테스트
  });

  it('should reset all filters', () => {
    const store = useNoticeFilterStore.getState();
    store.setType('공지');
    store.setSearch('테스트');
    store.reset();
    expect(store.type).toBe('all');
    expect(store.search).toBe('');
  });
});
```

---

## 완료 체크리스트

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] localStorage 동기화 확인
- [ ] 필터 리셋 동작 확인

---

**다음 문서**: 2101_13_목록_페이지.md
