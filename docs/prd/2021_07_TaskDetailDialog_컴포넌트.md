<!-- Generated: 2026-01-25 03:00:00 KST -->

# TaskDetailDialog 컴포넌트

**문서 번호**: 2021_07
**원본 PRD**: 2021_업무_검색_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 US-5' 및 'Section 6.1 Component Library' 참조
**구현 범위**: 업무 상세 조회/수정 Dialog (URL param 동기화)
**복잡도**: M
**의존성**: 2021_03

---

## 구현 목표

테이블 행 클릭 시 열리는 Dialog에서 업무 상세 정보를 표시하고, 본인 업무인 경우 수정 기능을 제공한다. Dialog 열림 상태는 URL의 `detail` param과 동기화된다.

---

## 구현 내용

### 파일 구조

```
src/components/features/tasks/
└── TaskDetailDialog.tsx    # 'use client' - 상세/수정 Dialog
```

### 구현 상세

#### 1. Dialog 열림/닫힘 조건

- `taskId !== null` → Dialog 열림
- Dialog 닫기(X 버튼, 배경 클릭, ESC) → `onClose()` 호출 → URL에서 `detail` 제거

#### 2. 데이터 로딩

- `useTaskDetailQuery(taskId)`로 상세 데이터 fetch
- 로딩 중: Dialog 내부 Skeleton
- 에러: 에러 메시지 표시

#### 3. 표시 항목

| 필드 | 표시 형태 | 수정 가능 |
|------|----------|----------|
| 제목 | Input | Yes |
| 날짜 | DatePicker | Yes |
| 업무 유형 | Select | Yes |
| 근무 형태 | Select | Yes |
| 상태 | Select | Yes |
| 시작 시간 | TimePicker (시/분) | Yes |
| 종료 시간 | TimePicker (시/분) | Yes |
| 설명 | Textarea | Yes |

#### 4. 수정 권한

- `task.employee_id === session.user.id` → 수정 가능 (폼 활성화 + 저장 버튼 표시)
- 그 외 → 읽기 전용 (폼 비활성화, 저장 버튼 숨김)
- 세션 정보는 `useSession()` Hook으로 확인

#### 5. 수정 로직

- `useUpdateTaskMutation()` 사용
- 저장 버튼 클릭 시 mutation 실행
- 성공: Toast "업무가 수정되었습니다" + Dialog 유지 (갱신된 데이터 표시)
- 실패: Toast 에러 메시지

#### 6. 시간 입력 UI

- 시간과 분을 각각 Select로 입력 (시: 0~23, 분: 0~59)
- 내부적으로 분 단위 (0~1439)로 변환하여 저장
- start_time >= end_time 시 클라이언트 검증 에러

### 핵심 인터페이스

```typescript
interface TaskDetailDialogProps {
  taskId: number | null;
  onClose: () => void;
}

export function TaskDetailDialog({ taskId, onClose }: TaskDetailDialogProps) {
  const { data: session } = useSession();
  const { data: task, isLoading } = useTaskDetailQuery(taskId);
  const updateMutation = useUpdateTaskMutation();

  // 수정 가능 여부
  const canEdit = task && session?.user?.id === task.employee_id;

  // 폼 상태
  const [formData, setFormData] = useState<UpdateTaskDto>({});

  // task 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        task_date: task.task_date,
        start_time: task.start_time,
        end_time: task.end_time,
        task_type: task.task_type,
        work_type: task.work_type,
        status: task.status,
      });
    }
  }, [task]);

  const handleSave = async () => {
    if (!taskId || !canEdit) return;
    try {
      await updateMutation.mutateAsync({ id: taskId, data: formData });
      toast.success('업무가 수정되었습니다');
    } catch (error) {
      toast.error('수정에 실패했습니다');
    }
  };

  return (
    <Dialog open={taskId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>업무 상세</DialogTitle>
        </DialogHeader>
        {/* 폼 내용 */}
        {canEdit && (
          <DialogFooter>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              저장
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### shadcn/ui 컴포넌트 사용

| 컴포넌트 | 용도 |
|---------|------|
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` | Dialog 구조 |
| `Input` | 제목 입력 |
| `Textarea` | 설명 입력 |
| `Select` | 유형, 형태, 상태, 시간 |
| `Popover` + `Calendar` | 날짜 선택 |
| `Button` | 저장, 닫기 |
| `Skeleton` | 로딩 상태 |

### Toast 알림

- 수정 성공: `toast.success('업무가 수정되었습니다')`
- 수정 실패: `toast.error('수정에 실패했습니다')`
- 프로젝트에 toast 구현이 없으면 shadcn/ui의 `Sonner` 또는 `Toast` 추가 필요

---

## Acceptance Criteria

- [ ] `taskId !== null` 시 Dialog 열림
- [ ] Dialog 닫기 시 URL에서 `detail` param 제거
- [ ] 로딩 중 Skeleton 표시
- [ ] 업무 상세 정보 정상 표시 (전체 필드)
- [ ] 본인 업무: 폼 활성화 + 저장 버튼 표시
- [ ] 타인 업무: 폼 비활성화 + 저장 버튼 숨김
- [ ] 수정 후 Toast "업무가 수정되었습니다" 표시
- [ ] 수정 후 검색 목록 자동 갱신 (invalidateQueries)
- [ ] start_time >= end_time 클라이언트 검증
- [ ] 저장 중 버튼 disabled (중복 클릭 방지)
- [ ] 페이지 새로고침 시 `?detail=123` param으로 Dialog 자동 열림

---

## 테스트 전략

### TypeScript & Lint

```bash
npm run build
npm run type-check
npm run lint
```

### 단위 테스트

**테스트 파일 위치**: `src/__tests__/components/features/tasks/TaskDetailDialog.test.tsx`

```typescript
describe('TaskDetailDialog', () => {
  it('should open when taskId is not null', () => {});
  it('should close and call onClose when dialog closes', async () => {});
  it('should show skeleton while loading', () => {});
  it('should display task details when loaded', () => {});
  it('should enable form for own task', () => {});
  it('should disable form for other user task', () => {});
  it('should call update mutation on save', async () => {});
  it('should show success toast after update', async () => {});
  it('should validate time range', async () => {});
  it('should disable save button while saving', () => {});
});
```

### 검증 방법

1. `npm run build` 성공
2. `npm run dev` → 행 클릭 시 Dialog 열림 확인
3. 본인 업무 수정 동작 확인
4. URL `?detail=123` 직접 입력 시 Dialog 자동 열림 확인

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] Dialog 열림/닫힘 정상
- [ ] URL param 동기화 정상
- [ ] 수정 권한 검증 동작
- [ ] 수정 후 목록 갱신 동작
- [ ] Toast 알림 표시
- [ ] 스테이징 서버 검증

---

**다음 문서**: 2021_08_단위_테스트.md
