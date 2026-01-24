<!-- Generated: 2026-01-25 05:10:00 KST -->

# TechSupportCreateDialog 컴포넌트

**문서 번호**: 2031_11
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 3 — US-2' 및 'Section 6.2 — Component Library' 참조
**구현 범위**: 기술지원 등록 Dialog (Combobox 고객사 선택 포함)
**복잡도**: M
**의존성**: 2031_06, 2031_07

---

## 구현 목표

신규 기술지원 건을 등록하는 Dialog를 구현한다. 필수 필드 검증, 고객사 Combobox 선택, 시간 입력을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/components/features/support/
└── TechSupportCreateDialog.tsx    # 등록 Dialog
```

### 구현 상세

#### 입력 필드

| 필드 | UI | Required | 기본값 |
|------|-----|----------|--------|
| 제목 | Input[text] | Y | - |
| 고객사 | Command (Combobox) | Y | - |
| 지원 유형 | Select | Y | - |
| 지원일 | Input[date] | Y | 오늘 |
| 지원 방법 | Select | N | - |
| 시작 시간 | Input[time] | N | - |
| 종료 시간 | Input[time] | N | - |
| 설명 | Textarea | N | - |

#### 유효성 검증

- 제목: 1~200자 필수
- 고객사: 필수 선택
- 지원 유형: 필수 선택
- 지원일: 필수
- 시간: start_time < end_time (둘 다 입력된 경우)

#### 시간 입력 → 분 변환

- `"09:30"` → `570` (9*60 + 30)
- Input[type=time] 사용하여 HH:MM 형식 입력
- API 전송 시 분(number)으로 변환

#### Dialog 동작

- 열릴 때 폼 초기화 (지원일만 오늘로 기본 설정)
- 저장 성공 시: toast.success + Dialog 닫기
- 저장 실패 시: toast.error
- 저장 중: 버튼 disabled + 로딩 표시

### 핵심 인터페이스

```typescript
interface TechSupportCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TechSupportCreateDialog({ open, onClose }: TechSupportCreateDialogProps) {
  const { mutateAsync, isPending } = useCreateTechSupportMutation();
  const { data: customerData } = useCustomerListQuery();

  const [form, setForm] = useState<FormState>({
    title: '',
    customer_id: null,
    support_type: null,
    support_date: new Date().toISOString().split('T')[0],
    support_method: null,
    start_time: '',  // HH:MM string
    end_time: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // HH:MM → 분 변환
  const timeToMinutes = (time: string): number | undefined => {
    if (!time) return undefined;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const validate = (): boolean => { /* ... */ };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: CreateTechSupportRequest = {
      title: form.title,
      customer_id: form.customer_id!,
      support_type: form.support_type!,
      support_date: form.support_date,
      support_method: form.support_method || undefined,
      start_time: timeToMinutes(form.start_time),
      end_time: timeToMinutes(form.end_time),
      description: form.description || undefined,
    };

    try {
      await mutateAsync(data);
      toast.success('기술지원이 등록되었습니다.');
      onClose();
    } catch {
      toast.error('등록에 실패했습니다.');
    }
  };

  // 열릴 때 폼 초기화
  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* DialogContent with form fields */}
    </Dialog>
  );
}
```

---

## Acceptance Criteria

- [ ] Dialog 열기/닫기 동작
- [ ] 필수 필드 미입력 시 인라인 에러 메시지
- [ ] 고객사 Combobox: 목록 표시, 검색, 선택
- [ ] 지원 유형 Select: 5개 옵션
- [ ] 지원 방법 Select: 3개 옵션 + 미선택 허용
- [ ] 시간 입력: HH:MM → 분 변환
- [ ] 시간 검증: start_time < end_time
- [ ] 지원일 기본값: 오늘
- [ ] 저장 성공: toast + Dialog 닫기
- [ ] 저장 실패: toast.error
- [ ] 저장 중: 버튼 disabled
- [ ] Dialog 재열기 시 폼 초기화

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/components/features/support/TechSupportCreateDialog.test.tsx`

```typescript
describe('TechSupportCreateDialog', () => {
  it('should not render when open is false');
  it('should render form when open is true');
  it('should show error for empty required fields');
  it('should show customer combobox with options');
  it('should convert time HH:MM to minutes');
  it('should show time validation error');
  it('should call mutateAsync with correct data');
  it('should show success toast on save');
  it('should show error toast on failure');
  it('should disable save button while pending');
  it('should reset form on reopen');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] Combobox 동작 확인
- [ ] 유효성 검증 동작
- [ ] 시간 변환 정확성
- [ ] Toast 표시 확인

---

**다음 문서**: 2031_12_TechSupportDetailDialog_TierBar_컴포넌트.md
