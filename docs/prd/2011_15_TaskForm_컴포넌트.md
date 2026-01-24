<!-- Generated: 2026-01-24 22:50:00 KST -->

# TaskForm 컴포넌트

**문서 번호**: 2011_15
**원본 PRD**: 2011_대시보드_및_일정관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'US-2', 'US-6', 'Section 6.4 User Interactions' 참조
**구현 범위**: 업무 등록/수정 폼 (Dialog/Sheet) + 시간 겹침 경고
**복잡도**: L
**의존성**: 2011_08, 2011_09, 2011_10

---

## 구현 목표

업무 등록 및 수정을 위한 폼 컴포넌트를 구현한다. 데스크톱에서는 Dialog, 모바일에서는 Sheet으로 표시된다. Optimistic Update, 시간 겹침 경고, 입력 검증을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/
└── components/
    └── features/
        └── dashboard/
            └── TaskForm.tsx    # 등록/수정 폼 (Dialog + Sheet)
```

### 구현 상세

**폼 필드:**

| 필드 | 타입 | 필수 | UI 컴포넌트 |
|------|------|------|-------------|
| title | text | ✅ | Input (max 200자) |
| task_date | date | ✅ | Calendar DatePicker |
| task_type | enum | ✅ | Select (5개 옵션) |
| work_type | enum | ✅ | Select (2개 옵션) |
| start_time | time | ❌ | Input (HH:MM) |
| end_time | time | ❌ | Input (HH:MM) |
| description | text | ❌ | Textarea |
| customer_id | number | ❌ | Select (고객사 목록, Phase 1 후) |
| status | enum | ❌ | Select (3개 옵션, 기본: READY) |

**동작:**
1. `taskFormOpen === true` → Dialog/Sheet 열림
2. `editingTaskId !== null` → 수정 모드 (기존 데이터 로드)
3. `editingTaskId === null` → 신규 등록 모드
4. 저장 → `useCreateTaskMutation()` 또는 `useUpdateTaskMutation()`
5. `isPending` 동안 저장 버튼 비활성화
6. 성공 → closeTaskForm() + Toast 성공 메시지
7. 실패 → Toast 에러 메시지 (롤백은 mutation에서 처리)

**시간 겹침 경고:**
- start_time/end_time 입력 시 같은 날짜의 기존 업무와 겹침 확인
- `isTimeOverlap()` 유틸리티 활용
- 겹침 발견 시: 폼 내 경고 메시지 표시 (non-blocking, 등록 가능)

**입력 검증 (클라이언트):**
- title: 1~200자 필수
- task_date: 유효한 날짜 필수
- task_type, work_type: 필수 선택
- start_time < end_time (둘 다 입력된 경우)
- start_time, end_time: HH:MM 형식 (00:00 ~ 23:59)

**삭제 (수정 모드에서):**
- "삭제" 버튼 표시 (수정 모드에서만)
- 확인 다이얼로그 표시
- DONE 상태 업무: 추가 경고 ("완료된 업무입니다. 정말 삭제하시겠습니까?")
- `useDeleteTaskMutation()` 호출

**반응형:**
- Desktop (768px+): Dialog 컴포넌트
- Mobile (<768px): Sheet 컴포넌트 (하단에서 올라옴)

### 핵심 인터페이스

```typescript
export function TaskForm() {
  const { taskFormOpen, editingTaskId, closeTaskForm } = useCalendarStore();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();

  // 수정 모드: 기존 데이터 로드
  const { data: existingTask } = useQuery({
    queryKey: ['tasks', 'detail', editingTaskId],
    queryFn: () => fetchTask(editingTaskId!),
    enabled: editingTaskId !== null,
  });

  const [formData, setFormData] = useState<CreateTaskDto>({...});
  const [timeOverlapWarning, setTimeOverlapWarning] = useState<string | null>(null);

  // 시간 겹침 확인
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      // 같은 날짜의 기존 업무와 비교
      const overlapping = existingTasks.filter(t =>
        t.start_time !== null && t.end_time !== null &&
        isTimeOverlap(formData.start_time!, formData.end_time!, t.start_time, t.end_time)
      );
      setTimeOverlapWarning(overlapping.length > 0 ? `${overlapping.length}건의 업무와 시간이 겹칩니다` : null);
    }
  }, [formData.start_time, formData.end_time]);

  const handleSubmit = () => {
    if (editingTaskId) {
      updateMutation.mutate({ id: editingTaskId, ...formData }, { onSuccess: closeTaskForm });
    } else {
      createMutation.mutate(formData, { onSuccess: closeTaskForm });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // 반응형: Dialog (desktop) vs Sheet (mobile)
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const Wrapper = isDesktop ? Dialog : Sheet;

  return (
    <Wrapper open={taskFormOpen} onOpenChange={(open) => !open && closeTaskForm()}>
      {/* 폼 내용 */}
      <form onSubmit={handleSubmit}>
        {/* ... fields ... */}
        {timeOverlapWarning && (
          <p className="text-sm text-amber-600">{timeOverlapWarning}</p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장 중...' : editingTaskId ? '수정' : '등록'}
        </Button>
      </form>
    </Wrapper>
  );
}
```

---

## Acceptance Criteria

- [ ] TaskForm 컴포넌트 구현 (등록 + 수정 모드)
- [ ] 9개 폼 필드 구현 (4개 필수, 5개 선택)
- [ ] 클라이언트 입력 검증 (필수, 범위, 형식)
- [ ] 시간 입력: HH:MM ↔ 분 변환 (timeStringToMinutes, minutesToTimeString)
- [ ] 시간 겹침 경고 (non-blocking, 경고 메시지만)
- [ ] 신규: useCreateTaskMutation 호출
- [ ] 수정: useUpdateTaskMutation 호출
- [ ] 삭제: 확인 다이얼로그 + DONE 추가 경고 + useDeleteTaskMutation
- [ ] isPending 동안 저장 버튼 비활성화
- [ ] 성공 시 closeTaskForm + Toast
- [ ] 반응형: Dialog (desktop) / Sheet (mobile)

---

## 테스트 전략

### 컴포넌트 테스트

```typescript
describe('TaskForm', () => {
  it('should open when taskFormOpen is true', () => {});
  it('should show empty form in create mode', () => {});
  it('should populate form in edit mode', () => {});
  it('should validate required fields', () => {});
  it('should validate start_time < end_time', () => {});
  it('should show time overlap warning', () => {});
  it('should call createMutation on new task submit', () => {});
  it('should call updateMutation on existing task submit', () => {});
  it('should disable submit button when isPending', () => {});
  it('should show delete confirmation for DONE tasks', () => {});
  it('should close form on successful submit', () => {});
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 등록/수정/삭제 모드 구현
- [ ] 클라이언트 검증 + 시간 겹침 경고
- [ ] Optimistic Update 연동
- [ ] 반응형 (Dialog/Sheet)
- [ ] isPending 비활성화
- [ ] 컴포넌트 테스트 통과

---

**다음 문서**: 2011_16_TeamCalendar_컴포넌트.md
