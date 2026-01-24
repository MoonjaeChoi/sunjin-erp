<!-- Generated: 2026-01-25 KST -->

# ProjectDetailDialog + ProjectChecklist 컴포넌트

**문서 번호**: 2041_15
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: 프로젝트 상세 Dialog (상태 변경, 수정, 삭제) + 8단계 체크리스트
**복잡도**: L
**의존성**: 2041_11

---

## 구현 목표

프로젝트 상세 정보 조회/수정 Dialog와 8단계 Sales Pipeline 체크리스트 컴포넌트를 구현한다. 상태 변경 Select, RBAC 기반 편집 권한, 비순차 체크 하이라이트를 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/projects/
├── ProjectDetailDialog.tsx    # 상세/수정/삭제 Dialog
└── ProjectChecklist.tsx       # 8단계 체크리스트 컴포넌트
```

### 구현 상세

#### ProjectDetailDialog

##### 기본 정보 표시

| 항목 | 표시 형식 |
|------|-----------|
| 프로젝트명 | 텍스트 |
| 프로젝트 코드 | 텍스트 (NULL이면 "-") |
| 고객사 | 고객사명 |
| 담당자 | 담당자명 |
| 상태 | 색상 Badge + 변경 Select |
| 계약 기간 | YYYY-MM-DD ~ YYYY-MM-DD (NULL이면 "-") |
| 계약 금액 | 콤마 포맷 + "원" (NULL이면 "-") |
| 설명 | 텍스트 (NULL이면 "-") |

##### 상태 변경

- Select 드롭다운으로 상태 변경
- 허용된 상태 전이만 옵션으로 표시:
  - PREPARING → IN_PROGRESS, ON_HOLD
  - IN_PROGRESS → PREPARING, COMPLETED, ON_HOLD
  - COMPLETED → IN_PROGRESS, ON_HOLD
  - ON_HOLD → PREPARING, IN_PROGRESS, COMPLETED (이전 상태 복귀)
  - ADMIN: 모든 상태 전이 허용
- 변경 시 `useUpdateProjectMutation` 호출
- 성공: `toast.success('상태가 변경되었습니다.')`
- 실패: `toast.error`

##### 수정/삭제 버튼

- **수정 버튼**: 별도 수정 모드 또는 ProjectCreateDialog 재활용 (향후 확장)
- **삭제 버튼**: AlertDialog 확인 후 `useDeleteProjectMutation` 호출
- 표시 조건 (RBAC):
  - ADMIN: 모든 프로젝트
  - MANAGER: 부서 내 프로젝트
  - USER: 본인 담당 프로젝트만

##### Dialog 구조

```
<Dialog open={open} onOpenChange>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>프로젝트 상세</DialogTitle>
      <div>{/* 수정/삭제 버튼 */}</div>
    </DialogHeader>

    {/* 기본 정보 영역 */}
    {/* 상태 Badge + 변경 Select */}
    {/* ProjectChecklist */}
    {/* 설명 */}
    {/* ProjectAttachments */}

    {/* 삭제 확인 AlertDialog */}
  </DialogContent>
</Dialog>
```

---

#### ProjectChecklist

##### 8단계 정의

| 순서 | Stage Key | 한글명 | 컬럼명 |
|------|-----------|--------|--------|
| 1 | MEETING | 회의 | stage_meeting_at |
| 2 | PROPOSAL | 제안 | stage_proposal_at |
| 3 | QUOTATION | 견적 | stage_quotation_at |
| 4 | CONTRACT | 계약 | stage_contract_at |
| 5 | KICKOFF | 착수 | stage_kickoff_at |
| 6 | DEVELOPMENT | 진행 | stage_development_at |
| 7 | DELIVERY | 납품 | stage_delivery_at |
| 8 | HANDOVER | 인수인계 | stage_handover_at |

##### UI 상태

| 상태 | 표시 | 배경 | 설명 |
|------|------|------|------|
| 미완료 (정상) | `[ ]` 빈 체크박스 | 기본 | 이전 단계도 미완료 |
| 미완료 (하이라이트) | `[ ]` 빈 체크박스 | `bg-orange-50 border-orange-200` | 이후 단계가 완료인데 이 단계가 미완료 |
| 완료 | `[v]` 체크 완료 | 기본 | 완료 일시 텍스트 표시 |

##### 하이라이트 로직

```typescript
// 현재 단계가 미완료이고, 이후 단계 중 하나라도 완료된 경우 → 주황 하이라이트
const shouldHighlight = (stageIndex: number, stages: StageData[]) => {
  const currentStage = stages[stageIndex];
  if (currentStage.completed_at) return false; // 이미 완료됨
  // 이후 단계 중 완료된 것이 있는지 확인
  return stages.slice(stageIndex + 1).some(s => s.completed_at !== null);
};
```

##### 체크 동작

- 체크박스 클릭 시 `useToggleChecklistMutation` 호출
- Optimistic update: UI 즉시 반영 후 서버 응답으로 확정
- 완료 → 미완료: timestamp null로 변경
- 미완료 → 완료: 서버에서 현재 timestamp 기록
- 비순차적 체크 허용 (순서 무관하게 토글 가능)
- 모든 단계 완료 시: `toast('모든 단계가 완료되었습니다. 상태를 완료로 변경하시겠습니까?')` 표시
- `canEdit=false`일 때 체크박스 disabled

### 핵심 인터페이스

```typescript
// ProjectDetailDialog
interface ProjectDetailDialogProps {
  projectId: number | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectDetailDialog({ projectId, open, onClose }: ProjectDetailDialogProps) {
  const { data: session } = useSession();
  const { data: project, isLoading } = useProjectDetailQuery(projectId);
  const { mutateAsync: updateProject } = useUpdateProjectMutation();
  const { mutateAsync: deleteProject } = useDeleteProjectMutation();

  const [deleteOpen, setDeleteOpen] = useState(false);

  // 편집 권한
  const canEdit = useMemo(() => {
    if (!session?.user || !project) return false;
    if (session.user.role === 'ADMIN') return true;
    if (session.user.role === 'MANAGER') {
      return project.employee_department_id === session.user.department_id;
    }
    return project.employee_id === session.user.id;
  }, [session, project]);

  // 상태 변경
  const handleStatusChange = async (newStatus: ProjectStatus) => {
    try {
      await updateProject({ id: projectId!, data: { status: newStatus } });
      toast.success('상태가 변경되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '상태 변경에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async () => {
    try {
      await deleteProject(projectId!);
      toast.success('프로젝트가 삭제되었습니다.');
      onClose();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  // ...렌더링
}

// ProjectChecklist
interface ProjectChecklistProps {
  projectId: number;
  stages: Record<ProjectStage, string | null>;  // stage → completed_at timestamp or null
  canEdit: boolean;
}

const STAGE_LIST: { key: ProjectStage; label: string }[] = [
  { key: 'MEETING', label: '회의' },
  { key: 'PROPOSAL', label: '제안' },
  { key: 'QUOTATION', label: '견적' },
  { key: 'CONTRACT', label: '계약' },
  { key: 'KICKOFF', label: '착수' },
  { key: 'DEVELOPMENT', label: '진행' },
  { key: 'DELIVERY', label: '납품' },
  { key: 'HANDOVER', label: '인수인계' },
];

export function ProjectChecklist({ projectId, stages, canEdit }: ProjectChecklistProps) {
  const { mutate: toggleChecklist } = useToggleChecklistMutation();

  const handleToggle = (stage: ProjectStage, currentCompleted: boolean) => {
    toggleChecklist(
      { projectId, stage, completed: !currentCompleted },
      {
        // optimistic update via TanStack Query onMutate
      }
    );
  };

  // 모든 단계 완료 체크
  useEffect(() => {
    const allCompleted = STAGE_LIST.every(s => stages[s.key] !== null);
    if (allCompleted) {
      toast('모든 단계가 완료되었습니다. 상태를 완료로 변경하시겠습니까?');
    }
  }, [stages]);

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">Sales Pipeline</h3>
      {STAGE_LIST.map((stage, idx) => {
        const completedAt = stages[stage.key];
        const isCompleted = completedAt !== null;
        const highlight = shouldHighlight(idx, STAGE_LIST, stages);

        return (
          <div
            key={stage.key}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md',
              highlight && 'bg-orange-50 border border-orange-200'
            )}
          >
            <Checkbox
              checked={isCompleted}
              disabled={!canEdit}
              onCheckedChange={() => handleToggle(stage.key, isCompleted)}
            />
            <span className="text-sm flex-1">{stage.label}</span>
            {completedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(completedAt).toLocaleString('ko-KR')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Acceptance Criteria

### ProjectDetailDialog

- [ ] projectId null일 때 Dialog 미표시
- [ ] 프로젝트 상세 데이터 정확 표시 (모든 필드)
- [ ] project_code NULL이면 "-" 표시
- [ ] 상태 Badge 색상 정확 표시
- [ ] 상태 변경 Select: 허용된 전이만 옵션 표시
- [ ] ADMIN: 모든 상태 전이 허용
- [ ] 상태 변경 성공/실패 toast
- [ ] 수정/삭제 버튼 RBAC 조건 표시 (ADMIN: 전체, MANAGER: 부서 내, USER: 본인)
- [ ] 삭제 확인 AlertDialog 표시
- [ ] 삭제 성공: toast + Dialog 닫기
- [ ] 로딩 시 Skeleton 표시
- [ ] max-h-[90vh] overflow-y-auto 스크롤

### ProjectChecklist

- [ ] 8단계 체크리스트 순서대로 표시
- [ ] 각 단계 한글명 정확 표시
- [ ] 완료된 단계: 체크 + 완료 일시 표시
- [ ] 미완료 단계: 빈 체크박스
- [ ] 비순차 하이라이트: 이후 단계 완료 + 이 단계 미완료 시 주황 배경
- [ ] 체크박스 토글 시 useToggleChecklistMutation 호출
- [ ] Optimistic update 적용
- [ ] 모든 단계 완료 시 toast 알림
- [ ] canEdit=false일 때 체크박스 disabled
- [ ] 상태와 독립적으로 동작 (어떤 상태에서든 체크/해제 가능)

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/projects/ProjectDetailDialog.test.tsx`, `src/__tests__/components/features/projects/ProjectChecklist.test.tsx`

```typescript
describe('ProjectDetailDialog', () => {
  it('should not render when projectId is null');
  it('should render project detail when projectId provided');
  it('should show "-" for null project_code');
  it('should display status badge with correct color');
  it('should show allowed status transitions in select');
  it('should allow all transitions for ADMIN');
  it('should handle status change');
  it('should show edit/delete buttons for owner');
  it('should hide edit/delete buttons for non-owner');
  it('should show delete confirmation dialog');
  it('should handle delete');
  it('should show loading skeleton');
  it('should render ProjectChecklist');
  it('should render ProjectAttachments');
});

describe('ProjectChecklist', () => {
  it('should render 8 stages in order');
  it('should show completed stages with check and timestamp');
  it('should show uncompleted stages with empty checkbox');
  it('should highlight uncompleted stage when later stage is completed');
  it('should not highlight when all previous stages are also uncompleted');
  it('should call toggleChecklist on checkbox click');
  it('should apply optimistic update');
  it('should show toast when all stages completed');
  it('should disable checkboxes when canEdit is false');
  it('should allow non-sequential checking');
});
```

---

**다음 문서**: 2041_16_ProjectAttachments_컴포넌트.md
