<!-- Generated: 2026-01-25 03:00:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2021_02
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 State Management' 참조
**구현 범위**: 검색 API 요청/응답 타입, 필터 상태 타입, URL param 타입 정의
**복잡도**: S
**의존성**: 2021_01

---

## 구현 목표

업무 검색 기능에서 사용할 TypeScript 인터페이스와 타입을 정의한다. API 요청 파라미터, 응답 형태, 필터 상태, URL param 매핑 등을 타입으로 표현하여 타입 안전성을 확보한다.

---

## 구현 내용

### 파일 구조

```
src/types/
└── task-search.ts     # 검색 전용 타입 (기존 task.ts와 분리)
```

### 구현 상세

기존 `src/types/task.ts`의 enum은 재사용하고, 검색 전용 타입을 별도 파일로 분리한다.

### 핵심 인터페이스

```typescript
import { TaskType, WorkType, TaskStatus } from './task';

/** 유효한 정렬 컬럼 */
export type TaskSortBy = 'task_date' | 'title' | 'status';

/** 정렬 방향 */
export type SortOrder = 'ASC' | 'DESC';

/** 유효한 페이지 크기 */
export type PageSize = 10 | 20 | 50;

/** 검색 API 요청 파라미터 */
export interface TaskSearchParams {
  date_from: string;         // ISO date (YYYY-MM-DD)
  date_to: string;           // ISO date (YYYY-MM-DD)
  type?: TaskType;           // 업무 유형
  work_type?: WorkType;      // 근무 형태
  status?: TaskStatus;       // 상태
  keyword?: string;          // 키워드 (2자 이상)
  page?: number;             // 1-based 페이지 번호
  page_size?: PageSize;      // 페이지 크기 (기본 20)
  sort_by?: TaskSortBy;      // 정렬 컬럼 (기본 task_date)
  sort_order?: SortOrder;    // 정렬 방향 (기본 DESC)
  // Phase 2-B
  employee_id?: number;
  customer_id?: number;
}

/** Task 엔티티 (API 응답) */
export interface TaskRecord {
  id: number;
  title: string;
  description: string | null;
  task_date: string;          // ISO date string
  start_time: number | null;  // 분 단위 (0~1439)
  end_time: number | null;    // 분 단위 (0~1439)
  task_type: TaskType;
  work_type: WorkType;
  status: TaskStatus;
  employee_id: number;
  customer_id: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 페이지네이션 응답 (page 지정 시) */
export interface TaskSearchResponse {
  tasks: TaskRecord[];
  total: number;
  page: number;
  page_size: number;
}

/** 기존 대시보드 응답 (page 미지정 시) */
export interface TaskListResponse {
  tasks: TaskRecord[];
  total: number;
}

/** 검색 필터 UI 상태 (debounce 전 로컬 상태) */
export interface TaskFilterState {
  dateFrom: string;
  dateTo: string;
  type: TaskType | '';
  workType: WorkType | '';
  status: TaskStatus | '';
  keyword: string;
}

/** URL param 키 목록 */
export const TASK_SEARCH_PARAM_KEYS = [
  'date_from',
  'date_to',
  'type',
  'work_type',
  'status',
  'keyword',
  'page',
  'page_size',
  'sort_by',
  'sort_order',
  'detail',
] as const;

/** 검색 필터 기본값 */
export const DEFAULT_PAGE_SIZE: PageSize = 20;
export const DEFAULT_SORT_BY: TaskSortBy = 'task_date';
export const DEFAULT_SORT_ORDER: SortOrder = 'DESC';

/** 업무 수정 요청 DTO */
export interface UpdateTaskDto {
  title?: string;
  description?: string;
  task_date?: string;
  start_time?: number | null;
  end_time?: number | null;
  task_type?: TaskType;
  work_type?: WorkType;
  status?: TaskStatus;
  customer_id?: number | null;
}
```

---

## Acceptance Criteria

- [ ] `TaskSearchParams` 타입으로 API 요청 파라미터 타입 안전하게 구성 가능
- [ ] `TaskSearchResponse` 타입이 API 응답과 정확히 일치
- [ ] `TaskFilterState`가 필터 UI의 로컬 상태를 표현
- [ ] 기존 `src/types/task.ts`의 enum 재사용 (중복 정의 없음)
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run type-check    # 타입 정의 자체의 정합성 검증
npm run lint
```

### 검증 방법

1. `npm run type-check` 통과
2. 후속 Hook/Component에서 import하여 사용 시 타입 에러 없음

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 기존 task.ts enum과 충돌 없음
- [ ] 타입 export 정상 동작

---

**다음 문서**: 2021_03_TanStack_Query_Hooks.md
