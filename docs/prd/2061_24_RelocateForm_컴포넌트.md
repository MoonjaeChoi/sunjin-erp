<!-- Generated: 2026-01-26 17:00:00 KST -->

# RelocateForm 컴포넌트 상세 스펙 (2061_24)

**문서 번호**: 2061_24
**컴포넌트명**: RelocateForm
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 6)
**구현 상태**: ⏳ IN PROGRESS

---

## 1. 개요

**RelocateForm**은 장비의 보관 위치를 변경하는 폼 컴포넌트로, 상태 변경 없이 물리적 위치만 업데이트한다.

**위치**: `src/components/features/inventory/RelocateForm.tsx`

**특성**:
- 상태 필터: "재고", "출고", "고장" (폐기 제외)
- 상태 변경 없음 (현재 위치만 업데이트)
- 위치 변경 이력 기록

---

## 2. Props 인터페이스

```typescript
interface RelocateFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## 3. 폼 필드 (3개)

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| inventory_id | Select | O | 장비 선택 |
| new_location | Text | O | 새 위치 |
| reason | Text | X | 사유 |

---

## 4. 검증 스키마

```typescript
const relocateSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_location: z.string().min(1, '새 위치는 필수입니다').max(200),
  reason: z.string().max(200).optional(),
});
```

---

## 5. 제출 로직

```typescript
async function onSubmit(data: RelocateInventoryRequest) {
  // 1. 선택된 장비 상태 확인 (폐기 아님)
  // 2. POST /api/inventory/{id}/relocate
  // 3. 위치만 업데이트 (상태 변경 X)
  // 4. 이력 기록 (유형: 위치변경)
  // 5. 캐시 무효화 (lists만, stats는 X)
}
```

---

## 6. Acceptance Criteria

- [x] "폐기" 상태 장비 제외
- [x] 필수 필드 검증
- [x] 캐시 무효화 (lists만)
- [x] 토스트 알림
- [x] 반응형 레이아웃

---

**상태**: ⏳ IN PROGRESS
**생성일**: 2026-01-26
