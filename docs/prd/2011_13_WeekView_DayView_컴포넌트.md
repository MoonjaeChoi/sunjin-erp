<!-- Generated: 2026-01-24 22:50:00 KST -->

# WeekView + DayView 컴포넌트

**문서 번호**: 2011_13
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.1', 'US-1' 참조
**구현 범위**: 주간/일간 리스트 형태 캘린더 뷰 (v1)
**복잡도**: M
**의존성**: 2011_09, 2011_10, 2011_11

---

## 구현 목표

주간 뷰와 일간 뷰를 시간순 정렬 리스트 형태로 구현한다 (v1). 각 업무 항목에 시간, 유형, 상태, 고객사 정보를 표시하고, 클릭 시 수정 폼을 열 수 있다.

---

## 구현 내용

### 파일 구조

```
src/
└── components/
    └── features/
        └── dashboard/
            ├── WeekView.tsx         # 주간 리스트 뷰
            ├── DayView.tsx          # 일간 리스트 뷰
            └── TaskListItem.tsx     # 공통 업무 항목 UI
```

### 구현 상세

**WeekView:**
- 현재 주의 7일을 날짜별 섹션으로 표시
- 각 날짜 헤더: "1월 24일 (금)" 형식
- 각 날짜 아래: 해당 날짜의 업무 리스트 (시간순)
- 업무가 없는 날: "등록된 업무가 없습니다" + "+" 버튼

**DayView:**
- 선택된 날짜의 전체 업무 리스트
- 시간순 정렬 (start_time ASC, null은 마지막)
- 각 항목: 시간대, 제목, 유형 배지, 상태 배지

**TaskListItem (공통):**
- 시간 표시: "09:00 - 11:00" (start_time/end_time → HH:MM 변환)
- 제목
- 업무 유형 배지 (문서작성, 테스트, 회의, 교육, 기타)
- 근무 형태 배지 (내근/외근 색상)
- 상태 배지 (준비/진행/완료 색상)
- 고객사명 (있는 경우)
- 클릭 → openTaskForm(taskId)

### 핵심 인터페이스

```typescript
// WeekView.tsx
interface WeekViewProps {
  date: Date;
  tasks: TaskListItem[];
}

export function WeekView({ date, tasks }: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const tasksByDate = groupTasksByDate(tasks);

  return (
    <div className="space-y-4">
      {weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDate[dateStr] || [];
        return (
          <div key={dateStr}>
            <h3 className="font-medium text-sm text-gray-700 mb-2">
              {format(day, 'M월 d일 (EEE)', { locale: ko })}
            </h3>
            {dayTasks.length > 0 ? (
              <div className="space-y-1">
                {dayTasks.map(task => <TaskItem key={task.id} task={task} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

```typescript
// DayView.tsx
interface DayViewProps {
  date: Date;
  tasks: TaskListItem[];
}

export function DayView({ date, tasks }: DayViewProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayTasks = tasks
    .filter(t => t.task_date === dateStr)
    .sort((a, b) => (a.start_time ?? 1440) - (b.start_time ?? 1440));

  return (
    <div className="space-y-2">
      {dayTasks.length > 0 ? (
        dayTasks.map(task => <TaskItem key={task.id} task={task} />)
      ) : (
        <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
      )}
    </div>
  );
}
```

```typescript
// TaskListItem.tsx
interface TaskItemProps {
  task: TaskListItem;
}

export function TaskItem({ task }: TaskItemProps) {
  const { openTaskForm } = useCalendarStore();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
      onClick={() => openTaskForm(task.id)}
    >
      {/* 시간 */}
      <div className="text-sm text-gray-500 w-24 shrink-0">
        {task.start_time !== null
          ? `${minutesToTimeString(task.start_time)}${task.end_time !== null ? ` - ${minutesToTimeString(task.end_time)}` : ''}`
          : '시간 미정'}
      </div>

      {/* 제목 */}
      <div className="flex-1 text-sm font-medium truncate">{task.title}</div>

      {/* 배지들 */}
      <Badge variant="outline" className={workTypeColors[task.work_type]}>
        {task.work_type === 'OFFICE' ? '내근' : '외근'}
      </Badge>
      <Badge variant="outline" className={statusColors[task.status]}>
        {statusLabels[task.status]}
      </Badge>
    </div>
  );
}
```

---

## Acceptance Criteria

- [ ] WeekView: 7일 날짜별 섹션 표시
- [ ] DayView: 선택 날짜의 업무 리스트
- [ ] TaskListItem: 시간 + 제목 + 배지(유형/상태) 표시
- [ ] 시간순 정렬 (start_time ASC, null은 마지막)
- [ ] 시간 표시: minutesToTimeString 활용 ("09:00 - 11:00")
- [ ] 내근/외근 색상 구분
- [ ] 상태 배지 색상 (준비: 회색, 진행: 노랑, 완료: 녹색)
- [ ] 업무 없는 날: "등록된 업무가 없습니다" 표시
- [ ] 항목 클릭 → openTaskForm(taskId)
- [ ] 한글 날짜 형식 ("1월 24일 (금)")

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('WeekView', () => {
  it('should render 7 day sections', () => {});
  it('should display tasks under correct date', () => {});
  it('should show empty message for days without tasks', () => {});
});

describe('DayView', () => {
  it('should render tasks sorted by start_time', () => {});
  it('should put tasks without time at the end', () => {});
});

describe('TaskItem', () => {
  it('should display time range', () => {});
  it('should show "시간 미정" when no start_time', () => {});
  it('should show work type badge with correct color', () => {});
  it('should call openTaskForm on click', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] WeekView + DayView + TaskListItem 구현
- [ ] 시간 변환 유틸리티 활용
- [ ] 색상 코딩 적용
- [ ] 클릭 인터랙션
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_14_DayDetailPanel_컴포넌트.md
