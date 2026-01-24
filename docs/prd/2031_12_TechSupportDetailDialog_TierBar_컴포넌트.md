<!-- Generated: 2026-01-25 05:10:00 KST -->

# TechSupportDetailDialog + TierBar 컴포넌트

**문서 번호**: 2031_12
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 — US-3, US-4' 및 'Section 6.3 — Tier Bar UI' 참조
**구현 범위**: 상세/수정 Dialog + 진행 단계 UI (TierBar)
**복잡도**: L
**의존성**: 2031_06, 2031_07, 2031_13

---

## 구현 목표

기술지원 건의 상세 조회/수정 Dialog와 진행 단계를 시각화하는 TierBar 컴포넌트를 구현한다. 상태 전이 매트릭스에 따른 상태 변경, 소유권 기반 편집 권한을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/support/
├── TechSupportDetailDialog.tsx    # 상세/수정 Dialog
└── TierBar.tsx                    # 진행 단계 UI
```

### 구현 상세

#### TierBar 컴포넌트

```
접수 ────── 진행 ────── 완료
 [●]        [●]        [○]     ← 현재 '진행' 상태
```

- 3단계 수평 바: RECEIVED → IN_PROGRESS → COMPLETED
- 단계별 색상: gray(접수), blue(진행), green(완료)
- 완료된 단계: 채워진 원 + 색상 바
- 현재 단계: 강조 원 + 활성 색상
- 미도달 단계: 빈 원 + 회색 바
- **클릭 가능**: 허용된 전이인 경우에만 클릭으로 상태 변경
  - `isValidStatusTransition(current, target, role)` 확인
  - 불가 시 클릭 무시 (cursor-not-allowed)

#### TechSupportDetailDialog

- **조회 모드**: 읽기 전용 (타인 건 조회 시)
- **수정 모드**: 본인 건 또는 ADMIN
- **상태 변경**: TierBar 클릭 또는 Select
- **삭제**: AlertDialog 확인 후 soft delete
- **완료일시 표시**: COMPLETED 상태에서 completed_at 표시

#### 수정 가능 필드

| 필드 | 수정 조건 |
|------|-----------|
| 제목 | 소유자/ADMIN |
| 고객사 | 소유자/ADMIN |
| 지원 유형 | 소유자/ADMIN |
| 지원일 | 소유자/ADMIN |
| 지원 방법 | 소유자/ADMIN |
| 시작/종료 시간 | 소유자/ADMIN |
| 설명 | 소유자/ADMIN |
| 상태 | 소유자/ADMIN (전이 규칙 준수) |
| 담당자 | ADMIN만 |

### 핵심 인터페이스

```typescript
// src/components/features/support/TierBar.tsx
interface TierBarProps {
  status: SupportStatus;
  canEdit: boolean;
  role: string;
  onStatusChange: (newStatus: SupportStatus) => void;
}

const STEPS: { value: SupportStatus; label: string; color: string; activeColor: string }[] = [
  { value: 'RECEIVED', label: '접수', color: 'bg-gray-200', activeColor: 'bg-gray-500' },
  { value: 'IN_PROGRESS', label: '진행', color: 'bg-blue-200', activeColor: 'bg-blue-500' },
  { value: 'COMPLETED', label: '완료', color: 'bg-green-200', activeColor: 'bg-green-500' },
];

export function TierBar({ status, canEdit, role, onStatusChange }: TierBarProps) {
  const currentIndex = STEPS.findIndex(s => s.value === status);

  const handleClick = (targetStatus: SupportStatus) => {
    if (!canEdit) return;
    if (!isValidStatusTransition(status, targetStatus, role)) return;
    onStatusChange(targetStatus);
  };

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const canTransition = canEdit && isValidStatusTransition(status, step.value, role);

        return (
          <React.Fragment key={step.value}>
            {idx > 0 && (
              <div className={cn('h-1 flex-1', isCompleted ? step.activeColor : 'bg-gray-200')} />
            )}
            <button
              onClick={() => handleClick(step.value)}
              disabled={!canTransition || isCurrent}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                isCurrent && step.activeColor + ' text-white',
                isCompleted && step.activeColor + ' text-white',
                !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                canTransition && !isCurrent && 'cursor-pointer hover:ring-2',
                !canTransition && !isCurrent && 'cursor-not-allowed',
              )}
            >
              {/* 단계 번호 또는 체크마크 */}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

```typescript
// src/components/features/support/TechSupportDetailDialog.tsx
interface TechSupportDetailDialogProps {
  supportId: number | null;
  onClose: () => void;
}

export function TechSupportDetailDialog({ supportId, onClose }: TechSupportDetailDialogProps) {
  const { data: session } = useSession();
  const { data: support, isLoading } = useTechSupportDetailQuery(supportId);
  const { mutateAsync: updateSupport, isPending: isUpdating } = useUpdateTechSupportMutation();
  const { mutateAsync: deleteSupport } = useDeleteTechSupportMutation();

  // 편집 권한
  const canEdit = session?.user?.role === 'ADMIN' || support?.employee_id === session?.user?.id;
  const isAdmin = session?.user?.role === 'ADMIN';

  // 폼 상태
  const [form, setForm] = useState({ /* ... */ });
  const [deleteOpen, setDeleteOpen] = useState(false);

  // support 데이터 로드 시 폼 동기화
  useEffect(() => {
    if (support) setForm(/* 변환 */);
  }, [support]);

  // 상태 변경 (TierBar에서)
  const handleStatusChange = async (newStatus: SupportStatus) => {
    try {
      await updateSupport({ id: supportId!, data: { status: newStatus } });
      toast.success('상태가 변경되었습니다.');
    } catch (e: any) {
      toast.error(e.message || '상태 변경에 실패했습니다.');
    }
  };

  // 저장
  const handleSave = async () => { /* ... */ };

  // 삭제
  const handleDelete = async () => {
    try {
      await deleteSupport(supportId!);
      toast.success('기술지원이 삭제되었습니다.');
      onClose();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <Dialog open={supportId !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {/* TierBar */}
        <TierBar
          status={form.status}
          canEdit={canEdit}
          role={session?.user?.role || 'USER'}
          onStatusChange={handleStatusChange}
        />

        {/* 폼 필드들 */}
        {/* 첨부 파일 영역 (AttachmentUpload) */}

        {/* Footer: 저장/삭제/취소 버튼 */}
        {canEdit && (
          <DialogFooter>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>삭제</Button>
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={isUpdating}>저장</Button>
          </DialogFooter>
        )}

        {/* 삭제 확인 AlertDialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          {/* ... */}
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Acceptance Criteria

### TierBar
- [ ] 3단계 수평 표시 (접수, 진행, 완료)
- [ ] 현재 단계 강조 (active 색상)
- [ ] 완료된 단계 채워진 표시
- [ ] 미도달 단계 회색 표시
- [ ] 클릭 가능 단계만 hover 효과
- [ ] 허용되지 않은 전이 클릭 불가 (cursor-not-allowed)
- [ ] canEdit=false일 때 전체 비활성

### DetailDialog
- [ ] 상세 데이터 표시 (모든 필드)
- [ ] 소유자/ADMIN만 수정 가능
- [ ] 타인 건: 읽기 전용
- [ ] TierBar 상태 변경 연동
- [ ] 상태 변경 성공/실패 toast
- [ ] 폼 수정 + 저장 동작
- [ ] 삭제 확인 AlertDialog
- [ ] 삭제 성공: toast + Dialog 닫기
- [ ] ADMIN: 담당자 변경 가능
- [ ] completed_at 표시 (COMPLETED 상태)
- [ ] 로딩 시 Skeleton
- [ ] max-h-[90vh] overflow-y-auto

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/support/TierBar.test.tsx`, `TechSupportDetailDialog.test.tsx`

```typescript
describe('TierBar', () => {
  it('should highlight current step');
  it('should show completed steps as filled');
  it('should allow valid transition click');
  it('should block invalid transition');
  it('should disable all when canEdit is false');
  it('should call onStatusChange on valid click');
});

describe('TechSupportDetailDialog', () => {
  it('should not render when supportId is null');
  it('should render detail when supportId provided');
  it('should show edit buttons for owner');
  it('should hide edit buttons for non-owner');
  it('should show TierBar with current status');
  it('should handle status change via TierBar');
  it('should save form changes');
  it('should show delete confirmation');
  it('should handle delete');
  it('should show loading skeleton');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] TierBar 시각적 정확성
- [ ] 상태 전이 규칙 준수
- [ ] RBAC 권한 UI 반영
- [ ] AlertDialog 삭제 확인

---

**다음 문서**: 2031_13_AttachmentUpload_컴포넌트.md
