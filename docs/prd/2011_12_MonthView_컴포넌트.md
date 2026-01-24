<!-- Generated: 2026-01-24 22:50:00 KST -->

# MonthView 컴포넌트

**문서 번호**: 2011_12
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1', 'Section 6.1~6.4', 'US-1' 참조
**구현 범위**: CSS Grid 기반 월간 캘린더 뷰
**복잡도**: L
**의존성**: 2011_09, 2011_10, 2011_11

---

## 구현 목표

CSS Grid (7열)를 활용한 월간 캘린더 뷰를 구현한다. 각 날짜 셀에 업무 건수 및 내근/외근 색상 배지를 표시하고, 날짜 클릭 시 DayDetailPanel을 활성화한다.

---

## 구현 내용

### 파일 구조

```
src/
└── components/
    └── features/
        └── dashboard/
            ├── MonthView.tsx          # 월간 캘린더 그리드
            └── MonthDayCell.tsx        # 개별 날짜 셀
```

### 구현 상세

**MonthView 레이아웃:**
- 7열 CSS Grid (`grid-cols-7`)
- 요일 헤더 (월~일)
- 6주 × 7일 = 42셀 (이전/다음 월 포함, 흐리게 표시)
- 각 셀: 날짜 숫자 + 업무 배지 (내근/외근 색상 구분)

**MonthDayCell 내용:**
- 날짜 숫자 (오늘: 원형 하이라이트)
- 업무 배지 표시 (최대 3개, 초과 시 "+N more")
  - 내근(OFFICE): `bg-blue-100 text-blue-700`
  - 외근(FIELD): `bg-orange-100 text-orange-700`
- 클릭: `setSelectedDate(date)` → DayDetailPanel 활성화
- 더블클릭 또는 "+" 버튼: `openTaskForm()` → TaskForm 열기

**date-fns 활용:**
- `startOfMonth`, `endOfMonth`: 현재 월의 시작/끝
- `startOfWeek`, `endOfWeek`: 그리드 시작/끝 (월요일 시작)
- `eachDayOfInterval`: 전체 날짜 배열 생성
- `isSameMonth`, `isSameDay`, `isToday`: 날짜 비교

### 핵심 인터페이스

```typescript
// MonthView.tsx
interface MonthViewProps {
  date: Date;
  tasks: TaskListItem[];
}

export function MonthView({ date, tasks }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 월요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 날짜별 업무 그룹화
  const tasksByDate = groupTasksByDate(tasks);

  return (
    <div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b">
        {['월', '화', '수', '목', '금', '토', '일'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {days.map(day => (
          <MonthDayCell
            key={day.toISOString()}
            date={day}
            isCurrentMonth={isSameMonth(day, date)}
            isToday={isToday(day)}
            tasks={tasksByDate[format(day, 'yyyy-MM-dd')] || []}
          />
        ))}
      </div>
    </div>
  );
}
```

```typescript
// MonthDayCell.tsx
interface MonthDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskListItem[];
}

export function MonthDayCell({ date, isCurrentMonth, isToday, tasks }: MonthDayCellProps) {
  const { setSelectedDate, openTaskForm } = useCalendarStore();
  const dateStr = format(date, 'yyyy-MM-dd');

  const officeTasks = tasks.filter(t => t.work_type === 'OFFICE');
  const fieldTasks = tasks.filter(t => t.work_type === 'FIELD');

  return (
    <div
      className={cn(
        'min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-gray-50',
        !isCurrentMonth && 'bg-gray-50 text-gray-400',
      )}
      onClick={() => setSelectedDate(dateStr)}
      onDoubleClick={() => openTaskForm()}
    >
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-sm w-6 h-6 flex items-center justify-center rounded-full',
          isToday && 'bg-blue-600 text-white font-bold',
        )}>
          {format(date, 'd')}
        </span>
        {isCurrentMonth && tasks.length === 0 && (
          <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600" onClick={(e) => { e.stopPropagation(); openTaskForm(); }}>+</button>
        )}
      </div>

      <div className="mt-1 space-y-0.5">
        {officeTasks.length > 0 && (
          <div className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 truncate">
            내근 {officeTasks.length}건
          </div>
        )}
        {fieldTasks.length > 0 && (
          <div className="text-xs px-1 py-0.5 rounded bg-orange-100 text-orange-700 truncate">
            외근 {fieldTasks.length}건
          </div>
        )}
        {tasks.length > 5 && (
          <div className="text-xs text-gray-500">+{tasks.length - 5} more</div>
        )}
      </div>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] CSS Grid (7열) 기반 월간 캘린더 구현
- [ ] 요일 헤더 표시 (월~일)
- [ ] 이전/다음 월 날짜 흐리게 표시
- [ ] 오늘 날짜 원형 하이라이트
- [ ] 내근/외근 색상 배지 표시
- [ ] 5건 초과 시 "+N more" 표시
- [ ] 날짜 클릭 → setSelectedDate 호출
- [ ] 더블클릭 → openTaskForm 호출
- [ ] date-fns 한글 로케일 + 월요일 시작
- [ ] 반응형: 최소 768px에서 정상 표시

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('MonthView', () => {
  it('should render 7-column grid with day headers', () => {});
  it('should render 42 day cells (6 weeks)', () => {});
  it('should highlight today', () => {});
  it('should dim days outside current month', () => {});
  it('should display task count badges', () => {});
  it('should show office tasks in blue', () => {});
  it('should show field tasks in orange', () => {});
  it('should show "+N more" when tasks > 5', () => {});
});

describe('MonthDayCell', () => {
  it('should call setSelectedDate on click', () => {});
  it('should call openTaskForm on double click', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] CSS Grid 레이아웃 구현
- [ ] 색상 코딩 (내근 파랑, 외근 주황)
- [ ] 오늘 하이라이트
- [ ] 클릭/더블클릭 인터랙션
- [ ] 반응형 대응 (768px+)
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_13_WeekView_DayView_컴포넌트.md
