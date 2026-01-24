<!-- Generated: 2026-01-25 03:00:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2021_03
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 State Management' 참조
**구현 범위**: useTaskSearchQuery, useTaskDetailQuery, useUpdateTaskMutation Hook 정의
**복잡도**: M
**의존성**: 2021_01, 2021_02

---

## 구현 목표

TanStack Query 기반의 데이터 fetching Hook을 정의한다. 검색 목록 조회, 상세 조회, 수정 mutation을 각각 독립적인 Hook으로 구현하여 컴포넌트에서 선언적으로 사용할 수 있도록 한다.

---

## 구현 내용

### 파일 구조

```
src/hooks/tasks/
├── useTaskSearchQuery.ts      # 검색 목록 조회 Hook
├── useTaskDetailQuery.ts      # 상세 조회 Hook
├── useUpdateTaskMutation.ts   # 수정 Mutation Hook
├── queryKeys.ts               # Query Key 팩토리
└── index.ts                   # 배럴 export
```

### 구현 상세

#### 1. Query Keys (`queryKeys.ts`)

```typescript
import { TaskSearchParams } from '@/types/task-search';

export const taskSearchKeys = {
  all: ['tasks', 'search'] as const,
  list: (params: TaskSearchParams) => ['tasks', 'search', params] as const,
  detail: (id: number) => ['tasks', 'detail', id] as const,
};
```

#### 2. useTaskSearchQuery

- **입력**: `TaskSearchParams` (URL params에서 파싱)
- **출력**: `UseQueryResult<TaskSearchResponse>`
- **queryKey**: `taskSearchKeys.list(params)`
- **queryFn**: `GET /api/tasks` with search params
- **옵션**:
  - `enabled`: `date_from`과 `date_to`가 유효할 때만
  - `placeholderData`: `keepPreviousData` (페이지 전환 시 이전 데이터 유지)
  - `staleTime`: 30초 (같은 조건 재요청 방지)

#### 3. useTaskDetailQuery

- **입력**: `id: number | null`
- **출력**: `UseQueryResult<TaskRecord>`
- **queryKey**: `taskSearchKeys.detail(id)`
- **queryFn**: `GET /api/tasks/{id}`
- **옵션**:
  - `enabled`: `id !== null`

#### 4. useUpdateTaskMutation

- **입력**: `{ id: number, data: UpdateTaskDto }`
- **mutationFn**: `PUT /api/tasks/{id}`
- **onSuccess**:
  - `queryClient.invalidateQueries({ queryKey: taskSearchKeys.all })`
  - `queryClient.invalidateQueries({ queryKey: taskSearchKeys.detail(id) })`
  - 대시보드 캐시도 무효화: `queryClient.invalidateQueries({ queryKey: ['tasks'] })`

### 핵심 인터페이스

```typescript
// useTaskSearchQuery 사용 예시
const { data, isLoading, isPlaceholderData } = useTaskSearchQuery({
  date_from: '2026-01-01',
  date_to: '2026-01-31',
  page: 1,
  page_size: 20,
  sort_by: 'task_date',
  sort_order: 'DESC',
});

// useTaskDetailQuery 사용 예시
const { data: task } = useTaskDetailQuery(selectedTaskId);

// useUpdateTaskMutation 사용 예시
const updateMutation = useUpdateTaskMutation();
updateMutation.mutate({ id: 1, data: { title: '수정된 제목' } });
```

### API 호출 함수

```typescript
async function fetchTaskSearch(params: TaskSearchParams): Promise<TaskSearchResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('date_from', params.date_from);
  searchParams.set('date_to', params.date_to);
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('page_size', String(params.page_size ?? 20));
  searchParams.set('sort_by', params.sort_by ?? 'task_date');
  searchParams.set('sort_order', params.sort_order ?? 'DESC');

  if (params.type) searchParams.set('type', params.type);
  if (params.work_type) searchParams.set('work_type', params.work_type);
  if (params.status) searchParams.set('status', params.status);
  if (params.keyword && params.keyword.length >= 2) {
    searchParams.set('keyword', params.keyword);
  }

  const res = await fetch(`/api/tasks?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch tasks');
  }
  return res.json();
}
```

---

## Acceptance Criteria

- [ ] `useTaskSearchQuery`가 유효한 params로 데이터 fetch 성공
- [ ] `enabled: false` 조건에서 불필요한 API 호출 없음
- [ ] `placeholderData`로 페이지 전환 시 이전 데이터 유지
- [ ] `useTaskDetailQuery`가 task ID로 상세 데이터 fetch 성공
- [ ] `useUpdateTaskMutation` 성공 시 검색 목록 + 상세 캐시 무효화
- [ ] API 에러 시 Error 객체로 적절히 throw
- [ ] queryKey 구조가 granular하여 불필요한 재요청 없음

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/hooks/tasks/useTaskSearchQuery.test.ts`

```typescript
describe('useTaskSearchQuery', () => {
  it('should fetch tasks with valid params', async () => {});
  it('should not fetch when date params are missing', async () => {});
  it('should keep previous data on page change', async () => {});
  it('should throw on API error', async () => {});
});

describe('useUpdateTaskMutation', () => {
  it('should invalidate search queries on success', async () => {});
  it('should throw on 403 forbidden', async () => {});
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run test` 통과
3. React DevTools에서 Query 상태 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] queryKey 충돌 없음 (대시보드 hooks와 분리)
- [ ] placeholderData 동작 확인
- [ ] mutation 후 캐시 무효화 정상

---

**다음 문서**: 2021_04_검색_페이지_컴포넌트.md
