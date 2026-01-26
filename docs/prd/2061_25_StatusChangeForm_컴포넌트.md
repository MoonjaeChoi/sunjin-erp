<!-- Generated: 2026-01-26 17:00:00 KST -->

# StatusChangeForm 컴포넌트 상세 스펙 (2061_25)

**문서 번호**: 2061_25
**컴포넌트명**: StatusChangeForm
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 7)
**구현 상태**: ⏳ IN PROGRESS

---

## 1. 개요

**StatusChangeForm**은 장비의 상태를 변경하는 폼 컴포넌트로, 고장/폐기 상태로만 변경 가능하며 ADMIN 권한만 허용한다.

**위치**: `src/components/features/inventory/StatusChangeForm.tsx`

**특성**:
- ADMIN 권한만 허용 (권한 검증)
- 상태 전이 규칙 검증
- 사유는 필수 입력
- 이력 기록 (변경 유형: status_change)

---

## 2. Props 인터페이스

```typescript
interface StatusChangeFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## 3. 폼 필드 (3개)

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| inventory_id | Select | O | 장비 선택 |
| new_status | Select | O | 새 상태 (고장/폐기) |
| reason | Text | O | 사유 (필수) |

---

## 4. 상태 전이 규칙

```typescript
const transitions: Record<InventoryStatus, InventoryStatus[]> = {
  '재고': ['고장', '폐기'],
  '출고': ['고장'],  // 출고 → 폐기 불가
  '고장': ['폐기'],
  '폐기': [],        // 최종 상태
};
```

---

## 5. 검증 스키마

```typescript
const statusChangeSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_status: z.enum(['고장', '폐기'], {
    errorMap: () => ({ message: '유효한 상태를 선택하세요' }),
  }),
  reason: z.string().min(1, '사유는 필수입니다').max(200),
});
```

---

## 6. 권한 검증

```typescript
// 폼 로드 시
const { data: session } = useSession();
const isAdmin = session?.user?.role === 'ADMIN';

if (!isAdmin) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>권한 없음</AlertTitle>
      <AlertDescription>
        ADMIN 권한만 상태 변경이 가능합니다
      </AlertDescription>
    </Alert>
  );
}
```

---

## 7. 제출 로직

```typescript
async function onSubmit(data: StatusChangeInventoryRequest) {
  // 1. 권한 검증 (ADMIN)
  // 2. 상태 전이 규칙 검증
  // 3. POST /api/inventory/{id}/status-change
  // 4. 이력 기록 (유형: status_change)
  // 5. 캐시 무효화 (lists, stats)
}
```

---

## 8. Acceptance Criteria

- [x] ADMIN 권한만 접근
- [x] 상태 전이 규칙 검증
- [x] 사유 필수 입력
- [x] 캐시 무효화 (lists, stats)
- [x] 토스트 알림
- [x] 반응형 레이아웃

---

**상태**: ⏳ IN PROGRESS
**생성일**: 2026-01-26
