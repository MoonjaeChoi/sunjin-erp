<!-- Generated: 2026-01-25 03:00:00 KST -->

# TaskDataTable 컴포넌트

**문서 번호**: 2021_06
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 US-4' 및 'Section 6.2 페이지 레이아웃' 참조
**구현 범위**: 데이터 테이블 (정렬, 페이지네이션, 로딩/빈 상태, 행 클릭)
**복잡도**: M
**의존성**: 2021_04

---

## 구현 목표

검색 결과를 테이블 형태로 표시하고, 컬럼 헤더 클릭으로 정렬, 하단 페이지네이션, 로딩 상태 Skeleton, 빈 상태 표시, 행 클릭으로 상세 Dialog를 여는 기능을 구현한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/tasks/
└── TaskDataTable.tsx     # 'use client' - 데이터 테이블
```

### 구현 상세

#### 1. 테이블 컬럼 (Phase 2-A)

| 컬럼 | 필드 | 정렬 | 반응형 | 비고 |
|------|------|------|--------|------|
| 날짜 | task_date | Yes (task_date) | 항상 표시 | YYYY-MM-DD 형식 |
| 제목 | title | Yes (title) | 항상 표시 | 최대 너비 제한, 말줄임 |
| 업무 유형 | task_type | No | md 이상 | Badge 표시 |
| 근무 형태 | work_type | No | lg 이상 | Badge 표시 |
| 상태 | status | Yes (status) | 항상 표시 | 색상 Badge |
| 시간 | start_time~end_time | No | md 이상 | HH:MM~HH:MM 형식 |

#### 2. 정렬

- 컬럼 헤더 클릭 시 정렬 방향 토글 (ASC ↔ DESC)
- 다른 컬럼 클릭 시 해당 컬럼 DESC로 시작
- 현재 정렬 상태는 화살표 아이콘으로 표시
- 정렬 변경 시 page 1로 리셋

#### 3. 페이지네이션

- 하단 중앙에 페이지 네비게이션
- 이전/다음 버튼 + 페이지 번호 (최대 5개 표시)
- 상단 우측에 페이지 크기 Select (10/20/50)
- 상단 좌측에 총 건수 표시 ("총 142건")
- 페이지 크기 변경 시 page 1로 리셋

#### 4. 로딩 상태

- `isLoading=true` && `!data`: Skeleton 테이블 (5행)
- `isPlaceholderData=true`: 이전 데이터 표시 + 반투명 오버레이

#### 5. 빈 상태

- 검색 결과 0건: 아이콘 + "검색 조건에 맞는 업무가 없습니다" 메시지 표시

#### 6. 행 클릭

- 행 클릭 시 `onUpdate({ detail: task.id })` 호출
- 커서 pointer 스타일

#### 7. 시간 표시 헬퍼

```typescript
function formatTime(minutes: number | null): string {
  if (minutes === null) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimeRange(start: number | null, end: number | null): string {
  if (start === null && end === null) return '-';
  return `${formatTime(start)}~${formatTime(end)}`;
}
```

### 핵심 인터페이스

```typescript
interface TaskDataTableProps {
  data: TaskSearchResponse | undefined;
  isLoading: boolean;
  isPlaceholderData: boolean;
  params: TaskSearchParams;
  onUpdate: (updates: Partial<TaskSearchParams>) => void;
}

export function TaskDataTable({
  data,
  isLoading,
  isPlaceholderData,
  params,
  onUpdate,
}: TaskDataTableProps) {
  // 정렬 핸들러
  const handleSort = (column: TaskSortBy) => {
    if (params.sort_by === column) {
      onUpdate({
        sort_order: params.sort_order === 'ASC' ? 'DESC' : 'ASC',
        page: 1,
      });
    } else {
      onUpdate({ sort_by: column, sort_order: 'DESC', page: 1 });
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    onUpdate({ page: newPage });
  };

  // 페이지 크기 변경
  const handlePageSizeChange = (newSize: PageSize) => {
    onUpdate({ page_size: newSize, page: 1 });
  };

  // 행 클릭
  const handleRowClick = (taskId: number) => {
    onUpdate({ detail: taskId });
  };

  // ...
}
```

### shadcn/ui 컴포넌트 사용

| 컴포넌트 | 용도 |
|---------|------|
| `Table`, `TableHeader`, `TableRow`, `TableCell` | 테이블 구조 |
| `Badge` | 상태/유형/형태 표시 |
| `Button` | 페이지네이션 버튼 |
| `Select` | 페이지 크기 선택 |
| `Skeleton` | 로딩 상태 |

### Badge 색상 매핑

```typescript
const statusColors: Record<TaskStatus, string> = {
  READY: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const taskTypeColors: Record<TaskType, string> = {
  DOCUMENT: 'bg-purple-100 text-purple-700',
  TEST: 'bg-orange-100 text-orange-700',
  MEETING: 'bg-cyan-100 text-cyan-700',
  TRAINING: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-600',
};
```

---

## Acceptance Criteria

- [ ] 테이블에 6개 컬럼 정상 표시
- [ ] 컬럼 헤더(날짜, 제목, 상태) 클릭 시 정렬 변경
- [ ] 현재 정렬 상태 화살표 아이콘 표시
- [ ] 정렬 변경 시 page 1로 리셋
- [ ] 하단 페이지네이션 정상 동작 (이전/다음 + 번호)
- [ ] 상단 총 건수 표시
- [ ] 페이지 크기 변경 시 page 1로 리셋
- [ ] 로딩 시 Skeleton 5행 표시
- [ ] isPlaceholderData 시 이전 데이터 + 반투명 오버레이
- [ ] 결과 0건 시 빈 상태 메시지
- [ ] 행 클릭 시 detail param 업데이트
- [ ] 시간 HH:MM 형식 표시
- [ ] Badge 색상 정상 적용
- [ ] md 미만에서 업무유형/시간 컬럼 숨김

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/components/features/tasks/TaskDataTable.test.tsx`

```typescript
describe('TaskDataTable', () => {
  it('should render table columns correctly', () => {});
  it('should display task data in rows', () => {});
  it('should show loading skeleton when isLoading', () => {});
  it('should show empty state when no tasks', () => {});
  it('should show placeholder overlay when isPlaceholderData', () => {});
  it('should toggle sort direction on header click', async () => {});
  it('should switch to new column DESC on different header click', async () => {});
  it('should show sort arrow icon for active column', () => {});
  it('should call onUpdate with page on pagination click', async () => {});
  it('should reset page on page_size change', async () => {});
  it('should call onUpdate with detail on row click', async () => {});
  it('should format time as HH:MM', () => {});
  it('should display total count', () => {});
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run dev` → 테이블 렌더링, 정렬, 페이지네이션 확인
3. 반응형 레이아웃 확인 (컬럼 숨김)
4. Skeleton/빈 상태 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] 정렬 동작 정상
- [ ] 페이지네이션 동작 정상
- [ ] 로딩/빈 상태 표시 정상
- [ ] Badge 색상 정상
- [ ] 반응형 레이아웃 확인
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2021_07_TaskDetailDialog_컴포넌트.md
