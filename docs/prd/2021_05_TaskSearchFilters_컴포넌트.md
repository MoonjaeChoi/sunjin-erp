<!-- Generated: 2026-01-25 03:00:00 KST -->

# TaskSearchFilters 컴포넌트

**문서 번호**: 2021_05
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 US-1', 'Section 6.2 페이지 레이아웃' 참조
**구현 범위**: 검색 필터 폼 (debounce 로직 포함, 날짜/유형/형태/상태/키워드)
**복잡도**: M
**의존성**: 2021_04

---

## 구현 목표

검색 필터 UI를 구현한다. 모든 필터 변경 시 debounce를 적용한 후 부모(TaskSearchClient)의 `onUpdate` 콜백으로 URL을 업데이트한다. 필터 변경 시 page를 1로 리셋한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/tasks/
└── TaskSearchFilters.tsx     # 'use client' - 검색 필터 폼
```

### 구현 상세

#### 1. 필터 항목 (Phase 2-A)

| 필터 | UI 컴포넌트 | debounce | 비고 |
|------|------------|----------|------|
| 시작일 | Popover + Calendar | 300ms | DatePicker |
| 종료일 | Popover + Calendar | 300ms | DatePicker |
| 업무 유형 | Select | 300ms | TaskType enum |
| 근무 형태 | Select | 300ms | WorkType enum |
| 상태 | Select | 300ms | TaskStatus enum |
| 키워드 | Input | 500ms | 2자 이상 시 적용 |

#### 2. Debounce 로직

```typescript
// 로컬 상태로 즉시 UI 반영
const [localFilters, setLocalFilters] = useState<TaskFilterState>({...});

// debounce 후 URL 업데이트
useEffect(() => {
  const timer = setTimeout(() => {
    onUpdate({ ...changes, page: 1 });
  }, debounceMs);
  return () => clearTimeout(timer);
}, [localFilters]);
```

- Select/DatePicker 변경: 300ms debounce
- 키워드 입력: 500ms debounce
- 각 필터별 독립적인 debounce timer

#### 3. 초기화 버튼

- 모든 필터를 기본값으로 리셋
- 기본값: 현재 월 1일~말일, 유형/형태/상태/키워드 전체(미선택)
- page도 1로 리셋

#### 4. 날짜 범위 검증

- 시작일 > 종료일: 에러 표시 (인라인)
- 범위 > 365일: 에러 표시 "검색 기간은 최대 1년입니다"
- 에러 상태에서도 로컬 UI는 변경 허용 (검증은 API 호출 전 클라이언트에서도)

#### 5. 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ 업무 검색                                    [초기화]     │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐        │
│ │ 시작일    │ │ 종료일    │ │ 유형 ▾ │ │ 형태 ▾ │        │
│ └──────────┘ └──────────┘ └────────┘ └────────┘        │
│ ┌──────────┐ ┌────────────────────────────────┐         │
│ │ 상태 ▾   │ │ 키워드 (제목 검색, 2자 이상)     │         │
│ └──────────┘ └────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

- Desktop (1280px+): 2행 그리드 (4열 + 2열)
- Tablet (768px+): 세로 배치

### 핵심 인터페이스

```typescript
interface TaskSearchFiltersProps {
  params: TaskSearchParams;
  onUpdate: (updates: Partial<TaskSearchParams>) => void;
}

export function TaskSearchFilters({ params, onUpdate }: TaskSearchFiltersProps) {
  // 로컬 필터 상태 (즉시 UI 반영용)
  const [dateFrom, setDateFrom] = useState(params.date_from);
  const [dateTo, setDateTo] = useState(params.date_to);
  const [type, setType] = useState(params.type || '');
  const [workType, setWorkType] = useState(params.work_type || '');
  const [status, setStatus] = useState(params.status || '');
  const [keyword, setKeyword] = useState(params.keyword || '');

  // params 외부 변경 시 로컬 동기화
  useEffect(() => {
    setDateFrom(params.date_from);
    setDateTo(params.date_to);
    // ... 나머지 동기화
  }, [params]);

  // Select/DatePicker debounce (300ms)
  // Keyword debounce (500ms)
  // ...

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 시작일, 종료일, 업무 유형, 근무 형태 */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 상태, 키워드 (키워드는 col-span-3) */}
      </div>
    </div>
  );
}
```

### shadcn/ui 컴포넌트 사용

| 컴포넌트 | 용도 |
|---------|------|
| `Popover` + `Calendar` | 날짜 선택 |
| `Select` | 업무 유형, 근무 형태, 상태 |
| `Input` | 키워드 검색 |
| `Button` | 초기화 버튼 |

---

## Acceptance Criteria

- [ ] 모든 Select 변경 시 300ms debounce 후 URL 업데이트
- [ ] 키워드 입력 시 500ms debounce 후 URL 업데이트
- [ ] 키워드 1자 입력 시 API에 keyword param 전달하지 않음
- [ ] 초기화 버튼 클릭 시 모든 필터 기본값으로 리셋
- [ ] 날짜 시작일 > 종료일 시 인라인 에러 표시
- [ ] 날짜 범위 365일 초과 시 에러 메시지 표시
- [ ] 필터 변경 시 page가 1로 리셋됨
- [ ] URL params 변경(뒤로가기) 시 필터 UI가 동기화됨
- [ ] Desktop에서 2행 그리드, Tablet에서 세로 배치

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/components/features/tasks/TaskSearchFilters.test.tsx`

```typescript
describe('TaskSearchFilters', () => {
  it('should render all filter fields', () => {});
  it('should debounce select change by 300ms', async () => {});
  it('should debounce keyword input by 500ms', async () => {});
  it('should not send keyword shorter than 2 chars', async () => {});
  it('should reset all filters on reset button click', async () => {});
  it('should show error when date range exceeds 365 days', () => {});
  it('should show error when start date > end date', () => {});
  it('should sync with external params change', () => {});
  it('should reset page to 1 on any filter change', async () => {});
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run dev` → 필터 변경 시 debounce 동작 확인
3. Network 탭에서 API 호출 타이밍 확인
4. 반응형 레이아웃 확인 (Desktop/Tablet)

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] debounce 타이밍 정확 (300ms/500ms)
- [ ] 날짜 범위 검증 동작
- [ ] 반응형 레이아웃 확인
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2021_06_TaskDataTable_컴포넌트.md
