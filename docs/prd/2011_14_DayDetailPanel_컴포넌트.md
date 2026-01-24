<!-- Generated: 2026-01-24 22:50:00 KST -->

# DayDetailPanel 컴포넌트

**문서 번호**: 2011_14
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 6.2 Layout Structure', 'US-4' 참조
**구현 범위**: 날짜별 상세 현황 패널 (업무 + 기술지원 통합)
**복잡도**: S
**의존성**: 2011_09 (useDailySummaryQuery)

---

## 구현 목표

캘린더에서 날짜를 선택했을 때 표시되는 상세 현황 패널을 구현한다. 업무(Task)와 기술지원(TechSupport) 건을 구분하여 표시하며, Phase 3 전까지 기술지원 섹션은 빈 상태로 표시한다.

---

## 구현 내용

### 파일 구조

```
src/
└── components/
    └── features/
        └── dashboard/
            └── DayDetailPanel.tsx
```

### 구현 상세

**레이아웃:**
- 선택된 날짜 헤더 ("2026년 1월 24일 (금)" 형식)
- 업무 섹션: Card + 업무 리스트
- 기술지원 섹션: Card + 빈 상태 또는 리스트
- 닫기 버튼 (X)

**업무 항목 표시:**
- 근무 형태 배지 (내근/외근)
- 업무 유형 레이블
- 제목
- 고객사명 (있는 경우)
- 상태 배지 (클릭 시 상태 변경 가능)

**상태 변경:**
- 상태 배지 클릭 → 드롭다운 (READY → IN_PROGRESS → DONE)
- `useUpdateTaskMutation()` 호출
- isPending 동안 비활성화

### 핵심 인터페이스

```typescript
interface DayDetailPanelProps {
  date: string;  // ISO date string
}

export function DayDetailPanel({ date }: DayDetailPanelProps) {
  const { setSelectedDate } = useCalendarStore();
  const { data, isLoading } = useDailySummaryQuery(date);
  const updateMutation = useUpdateTaskMutation();

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateMutation.mutate({ id: taskId, status: newStatus });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {format(new Date(date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업무 섹션 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">업무</h4>
          {data?.tasks.length ? (
            <div className="space-y-2">
              {data.tasks.map(task => (
                <DayDetailTaskItem
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  isPending={updateMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
          )}
        </div>

        {/* 기술지원 섹션 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">기술지원</h4>
          {data?.techSupports.length ? (
            <div className="space-y-2">
              {data.techSupports.map(ts => (
                <div key={ts.id} className="text-sm p-2 rounded border bg-gray-50">
                  {ts.customer_name} - {ts.title}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">기술지원 내역 없음</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Acceptance Criteria

- [ ] DayDetailPanel 컴포넌트 구현
- [ ] useDailySummaryQuery 훅 연동
- [ ] 업무 섹션: 시간순 정렬, 유형/상태 배지 표시
- [ ] 기술지원 섹션: Phase 3 전 빈 상태 표시
- [ ] 상태 변경 인터랙션 (드롭다운)
- [ ] isPending 동안 상태 변경 비활성화
- [ ] 닫기 버튼 → setSelectedDate(null)
- [ ] 날짜 헤더: 한글 형식
- [ ] 로딩 상태 처리

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('DayDetailPanel', () => {
  it('should display date in Korean format', () => {});
  it('should render task list from daily summary', () => {});
  it('should show empty state for tech supports', () => {});
  it('should call setSelectedDate(null) on close', () => {});
  it('should call updateMutation on status change', () => {});
  it('should disable status change when isPending', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 업무 + 기술지원 구분 표시
- [ ] 상태 변경 인터랙션
- [ ] 닫기 기능
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_15_TaskForm_컴포넌트.md
