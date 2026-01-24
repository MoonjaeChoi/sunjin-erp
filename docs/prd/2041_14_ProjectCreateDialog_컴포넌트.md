<!-- Generated: 2026-01-25 KST -->

# ProjectCreateDialog 컴포넌트

**문서 번호**: 2041_14
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: 프로젝트 등록 Dialog (Combobox 고객사, 코드 생성 포함)
**복잡도**: M
**의존성**: 2041_11

---

## 구현 목표

신규 프로젝트를 등록하는 Dialog를 구현한다. 필수 필드 검증, 고객사 Combobox 선택, 담당자 Select 선택, 프로젝트 코드 자동 생성 기능을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/projects/
└── ProjectCreateDialog.tsx    # 프로젝트 등록 Dialog
```

### 구현 상세

#### 입력 필드

| 필드 | UI | Required | 기본값 | 제약 조건 |
|------|-----|----------|--------|-----------|
| 프로젝트명 | Input[text] | Y | - | max 200자 |
| 고객사 | Command (Combobox) | Y | - | useCustomerListQuery 데이터 |
| 담당자 | Select | Y | - | useEmployeeListQuery 데이터 |
| 프로젝트 코드 | Input[text] + Button | N | - | PJT-YYYYMMDD-NNN 형식 |
| 계약 시작일 | Input[date] | N | - | - |
| 계약 종료일 | Input[date] | N | - | >= 시작일 |
| 계약 금액 | Input[number] | N | - | 콤마 포맷팅 표시 |
| 설명 | Textarea | N | - | - |

#### 유효성 검증

- **프로젝트명**: 필수, 1~200자
- **고객사**: 필수 선택
- **담당자**: 필수 선택
- **프로젝트 코드**: 입력 시 `PJT-YYYYMMDD-NNN` 형식 검증 (정규식: `/^PJT-\d{8}-\d{3}$/`)
- **날짜 범위**: start_date와 end_date 모두 입력된 경우 start_date <= end_date
- **계약 금액**: 0 이상 정수

#### 프로젝트 코드 생성

- "코드 생성" 버튼 클릭 시 `useGenerateProjectCodeMutation` 호출
- API 응답의 code 값을 Input에 자동 입력
- 수동 입력도 가능 (형식 검증만 수행)
- 코드 미입력 허용 (초기 영업 단계에서는 코드 미부여)

#### 고객사 Combobox

- `useCustomerListQuery()` 데이터 활용
- 검색어 입력으로 고객사 필터링
- 선택 시 customer_id 설정

#### 담당자 Select

- `useEmployeeListQuery()` 데이터 활용
- 이름 + 부서명 표시 (예: "홍길동 (개발팀)")
- 선택 시 employee_id 설정

#### 계약 금액 표시

- 입력 시 숫자만 허용
- 표시 시 천 단위 콤마 포맷 (예: 50,000,000)

#### Dialog 동작

- 열릴 때 폼 초기화 (모든 필드 빈 값)
- 저장 성공 시: `toast.success('프로젝트가 등록되었습니다.')` + Dialog 닫기
- 저장 실패 시: `toast.error` + 에러 메시지
- 저장 중: 저장 버튼 disabled + 로딩 표시

### 핵심 인터페이스

```typescript
interface ProjectCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  project_name: string;
  customer_id: number | null;
  employee_id: number | null;
  project_code: string;
  start_date: string;
  end_date: string;
  contract_amount: string;
  description: string;
}

export function ProjectCreateDialog({ open, onClose }: ProjectCreateDialogProps) {
  const { mutateAsync: createProject, isPending } = useCreateProjectMutation();
  const { mutateAsync: generateCode, isPending: isGenerating } = useGenerateProjectCodeMutation();
  const { data: customerData } = useCustomerListQuery();
  const { data: employeeData } = useEmployeeListQuery();

  const [form, setForm] = useState<FormState>({
    project_name: '',
    customer_id: null,
    employee_id: null,
    project_code: '',
    start_date: '',
    end_date: '',
    contract_amount: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 초기화
  useEffect(() => {
    if (open) {
      setForm({ project_name: '', customer_id: null, employee_id: null, project_code: '', start_date: '', end_date: '', contract_amount: '', description: '' });
      setErrors({});
    }
  }, [open]);

  // 유효성 검증
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.project_name.trim()) newErrors.project_name = '프로젝트명을 입력해주세요.';
    else if (form.project_name.length > 200) newErrors.project_name = '프로젝트명은 200자 이내로 입력해주세요.';
    if (!form.customer_id) newErrors.customer_id = '고객사를 선택해주세요.';
    if (!form.employee_id) newErrors.employee_id = '담당자를 선택해주세요.';
    if (form.project_code && !/^PJT-\d{8}-\d{3}$/.test(form.project_code)) {
      newErrors.project_code = '프로젝트 코드 형식이 올바르지 않습니다. (PJT-YYYYMMDD-NNN)';
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      newErrors.end_date = '종료일은 시작일 이후여야 합니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 코드 생성
  const handleGenerateCode = async () => {
    try {
      const result = await generateCode();
      setForm((prev) => ({ ...prev, project_code: result.code }));
    } catch {
      toast.error('코드 생성에 실패했습니다.');
    }
  };

  // 저장
  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateProjectRequest = {
      project_name: form.project_name,
      customer_id: form.customer_id!,
      employee_id: form.employee_id!,
      project_code: form.project_code || undefined,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      contract_amount: form.contract_amount ? Number(form.contract_amount.replace(/,/g, '')) : undefined,
      description: form.description || undefined,
    };

    try {
      await createProject(data);
      toast.success('프로젝트가 등록되었습니다.');
      onClose();
    } catch (e: any) {
      toast.error(e.message || '등록에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>신규 프로젝트 등록</DialogTitle>
        </DialogHeader>

        {/* 프로젝트명 */}
        {/* 고객사 Combobox */}
        {/* 담당자 Select */}
        {/* 프로젝트 코드 + 코드 생성 버튼 */}
        {/* 계약 시작일 / 종료일 */}
        {/* 계약 금액 */}
        {/* 설명 Textarea */}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Acceptance Criteria

- [ ] Dialog 열기/닫기 동작
- [ ] 필수 필드 미입력 시 인라인 에러 메시지 (프로젝트명, 고객사, 담당자)
- [ ] 프로젝트명 200자 초과 시 에러 메시지
- [ ] 고객사 Combobox: 목록 표시, 검색 필터링, 선택
- [ ] 담당자 Select: 이름(부서) 형식으로 목록 표시, 선택
- [ ] 프로젝트 코드 "코드 생성" 버튼 클릭 시 자동 생성
- [ ] 프로젝트 코드 수동 입력 시 형식 검증
- [ ] 프로젝트 코드 미입력 허용
- [ ] 계약 시작일 > 종료일 시 에러 메시지
- [ ] 계약 금액 콤마 포맷팅 표시
- [ ] 저장 성공: toast.success + Dialog 닫기
- [ ] 저장 실패: toast.error
- [ ] 저장 중: 버튼 disabled
- [ ] Dialog 재열기 시 폼 초기화

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/projects/ProjectCreateDialog.test.tsx`

```typescript
describe('ProjectCreateDialog', () => {
  it('should not render when open is false');
  it('should render form when open is true');
  it('should show error for empty required fields on submit');
  it('should show error for project_name exceeding 200 chars');
  it('should show customer combobox with searchable options');
  it('should show employee select with name and department');
  it('should generate project code on button click');
  it('should validate project_code format');
  it('should allow empty project_code');
  it('should show error when end_date is before start_date');
  it('should format contract_amount with commas');
  it('should call createProject mutation with correct data');
  it('should show success toast on save');
  it('should show error toast on failure');
  it('should disable save button while pending');
  it('should reset form on dialog reopen');
});
```

---

**다음 문서**: 2041_15_ProjectDetailDialog_Checklist_컴포넌트.md
