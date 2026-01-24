<!-- Generated: 2026-01-24 22:50:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2011_09
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 State Management' 참조
**구현 범위**: TanStack Query 기반 useQuery/useMutation 커스텀 훅 (6개)
**복잡도**: M
**의존성**: 2011_08

---

## 구현 목표

Task API와 Dashboard API를 호출하는 TanStack Query 커스텀 훅을 구현한다. Optimistic Update + 롤백 패턴, 캐시 무효화 전략을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
└── hooks/
    └── dashboard/
        ├── useTasksQuery.ts          # 기간별 업무 조회
        ├── useDailySummaryQuery.ts    # 날짜별 통합 현황
        ├── useTeamTasksQuery.ts       # 팀 캘린더
        ├── useCreateTaskMutation.ts   # 업무 생성 (optimistic)
        ├── useUpdateTaskMutation.ts   # 업무 수정
        ├── useDeleteTaskMutation.ts   # 업무 삭제
        └── index.ts                   # barrel export
```

### 구현 상세

**Query Key 전략:**
```typescript
const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  dailySummary: (date: string) => ['dashboard', 'daily-summary', date] as const,
  team: (dateFrom: string, dateTo: string) => ['dashboard', 'team', dateFrom, dateTo] as const,
};
```

**Optimistic Update 패턴 (useCreateTaskMutation):**
```typescript
export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTaskDto) =>
      fetch('/api/tasks', { method: 'POST', body: JSON.stringify(dto) }).then(r => r.json()),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousTasks = queryClient.getQueryData(taskKeys.lists());
      // Optimistic add
      queryClient.setQueryData(taskKeys.lists(), (old: TaskListResponse | undefined) => {
        if (!old) return old;
        return { ...old, tasks: [...old.tasks, { ...newTask, id: Date.now(), status: newTask.status || 'READY' }] };
      });
      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      // Rollback
      if (context?.previousTasks) {
        queryClient.setQueryData(taskKeys.lists(), context.previousTasks);
      }
      toast.error('업무 등록에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

**useUpdateTaskMutation:**
- status 변경 시 optimistic update
- isPending 상태 노출 (UI에서 비활성화용)
- 실패 시 rollback + toast

**useDeleteTaskMutation:**
- Optimistic remove from list
- 실패 시 rollback + toast

**Stale Time 전략:**
- 목록 조회: `staleTime: 30_000` (30초)
- 상세 조회: `staleTime: 60_000` (1분)
- daily-summary: `staleTime: 30_000`
- team: `staleTime: 60_000`

### 핵심 인터페이스

```typescript
// useTasksQuery.ts
export function useTasksQuery(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    staleTime: 30_000,
    enabled: !!filters.date_from && !!filters.date_to,
  });
}

// useDailySummaryQuery.ts
export function useDailySummaryQuery(date: string | null) {
  return useQuery({
    queryKey: taskKeys.dailySummary(date || ''),
    queryFn: () => fetchDailySummary(date!),
    staleTime: 30_000,
    enabled: !!date,
  });
}

// useTeamTasksQuery.ts
export function useTeamTasksQuery(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: taskKeys.team(dateFrom, dateTo),
    queryFn: () => fetchTeamTasks(dateFrom, dateTo),
    staleTime: 60_000,
    enabled: !!dateFrom && !!dateTo,
  });
}
```

---

## Acceptance Criteria

- [ ] 6개 커스텀 훅 구현 완료
- [ ] Query Key factory 패턴 적용
- [ ] useCreateTaskMutation: optimistic update + rollback
- [ ] useUpdateTaskMutation: optimistic update + rollback
- [ ] useDeleteTaskMutation: optimistic remove + rollback
- [ ] 실패 시 toast.error 호출
- [ ] staleTime 설정 (30s/60s)
- [ ] enabled 조건으로 불필요한 쿼리 방지
- [ ] barrel export (index.ts)

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/hooks/dashboard/useTasksQuery.test.ts`

```typescript
describe('useTasksQuery', () => {
  it('should fetch tasks with filters', async () => {});
  it('should not fetch when date params are empty', async () => {});
});

describe('useCreateTaskMutation', () => {
  it('should optimistically add task to cache', async () => {});
  it('should rollback on error', async () => {});
  it('should show toast on error', async () => {});
  it('should invalidate queries on settled', async () => {});
});

describe('useUpdateTaskMutation', () => {
  it('should update task in cache optimistically', async () => {});
  it('should rollback on error', async () => {});
});

describe('useDeleteTaskMutation', () => {
  it('should remove task from cache optimistically', async () => {});
  it('should rollback on error', async () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 6개 훅 구현
- [ ] Optimistic Update + Rollback 패턴
- [ ] Toast 에러 알림
- [ ] Cache invalidation 전략
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_10_Zustand_Store.md
