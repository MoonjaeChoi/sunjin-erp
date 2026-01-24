<!-- Generated: 2026-01-24 22:50:00 KST -->

# Zustand Store (useCalendarStore)

**문서 번호**: 2011_10
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 Client State (Zustand)' 참조
**구현 범위**: useCalendarStore — 일시적 UI 상태 관리
**복잡도**: S
**의존성**: 없음 (독립)

---

## 구현 목표

캘린더 UI의 일시적 클라이언트 상태를 관리하는 Zustand store를 구현한다. URL에 적합하지 않은 상태(폼 열림, 선택된 직원 필터 등)만 관리한다.

**중요:** 뷰 모드(`view`)와 선택 날짜(`date`)는 URL query param으로 관리하므로 Zustand에 포함하지 않는다.

---

## 구현 내용

### 파일 구조

```
src/
└── stores/
    └── useCalendarStore.ts
```

### 구현 상세

**관리 대상 상태 (URL에 부적합한 일시적 UI 상태):**

| 상태 | 타입 | 설명 |
|------|------|------|
| taskFormOpen | boolean | 업무 등록/수정 폼 열림 여부 |
| editingTaskId | number \| null | 수정 중인 업무 ID (null = 신규) |
| selectedEmployeeFilter | number \| null | 팀 캘린더 직원 필터 |
| selectedDate | string \| null | DayDetailPanel에 표시할 날짜 |

### 핵심 인터페이스

```typescript
import { create } from 'zustand';

interface CalendarState {
  // 업무 폼 상태
  taskFormOpen: boolean;
  editingTaskId: number | null;

  // 팀 캘린더 필터
  selectedEmployeeFilter: number | null;

  // DayDetailPanel 선택 날짜
  selectedDate: string | null;

  // Actions
  openTaskForm: (taskId?: number) => void;
  closeTaskForm: () => void;
  setEmployeeFilter: (employeeId: number | null) => void;
  setSelectedDate: (date: string | null) => void;
  resetFilters: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  taskFormOpen: false,
  editingTaskId: null,
  selectedEmployeeFilter: null,
  selectedDate: null,

  openTaskForm: (taskId) => set({
    taskFormOpen: true,
    editingTaskId: taskId ?? null,
  }),

  closeTaskForm: () => set({
    taskFormOpen: false,
    editingTaskId: null,
  }),

  setEmployeeFilter: (employeeId) => set({
    selectedEmployeeFilter: employeeId,
  }),

  setSelectedDate: (date) => set({
    selectedDate: date,
  }),

  resetFilters: () => set({
    selectedEmployeeFilter: null,
    selectedDate: null,
  }),
}));
```

---

## Acceptance Criteria

- [ ] `src/stores/useCalendarStore.ts` 생성
- [ ] 4개 상태 + 5개 액션 정의
- [ ] URL 관리 대상(view, date)은 포함하지 않음
- [ ] openTaskForm: taskId 있으면 수정, 없으면 신규
- [ ] closeTaskForm: 폼 닫기 + editingTaskId 초기화
- [ ] resetFilters: 필터 초기화
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/stores/useCalendarStore.test.ts`

```typescript
describe('useCalendarStore', () => {
  it('should initialize with default values', () => {});
  it('openTaskForm should set taskFormOpen true and editingTaskId', () => {});
  it('openTaskForm without id should set editingTaskId null (new)', () => {});
  it('closeTaskForm should reset form state', () => {});
  it('setEmployeeFilter should update filter', () => {});
  it('setSelectedDate should update selected date', () => {});
  it('resetFilters should clear all filters', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Zustand store 구현 (서버 데이터 미포함 확인)
- [ ] 단위 테스트 통과

---

**다음 문서**: 2011_11_Dashboard_페이지_컴포넌트.md
