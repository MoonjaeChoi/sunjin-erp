<!-- Generated: 2026-01-26 17:00:00 KST -->

# CheckinForm 컴포넌트 상세 스펙 (2061_23)

**문서 번호**: 2061_23
**컴포넌트명**: CheckinForm
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 8)
**구현 상태**: ⏳ IN PROGRESS

---

## 1. 개요

**CheckinForm**은 출고 중인 장비를 반납하는 폼 컴포넌트로, 반납 위치를 지정하여 상태를 "출고" → "재고"로 변경한다.

**위치**: `src/components/features/inventory/CheckinForm.tsx`

**특성**:
- Client Component ('use client' 선언)
- 상태 필터: "출고"만 선택 가능
- 상태 전이: "출고" → "재고"
- 현재 위치 업데이트
- 반납 이력 기록

---

## 2. Props 인터페이스

```typescript
interface CheckinFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## 3. 폼 필드 (3개)

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| inventory_id | Select | O | 장비 선택 (상태: "출고"만) |
| new_location | Text | O | 반납 위치 |
| reason | Text | X | 비고 |

---

## 4. 폼 구조 & 검증

```typescript
const checkinSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  new_location: z.string().min(1, '반납 위치는 필수입니다').max(200),
  reason: z.string().max(200).optional(),
});
```

---

## 5. 제출 로직

```typescript
async function onSubmit(data: CheckinInventoryRequest) {
  // 1. 선택된 장비 상태 확인 (출고만)
  // 2. POST /api/inventory/{id}/checkin
  // 3. 상태 변경: 출고 → 재고
  // 4. 위치 업데이트: new_location
  // 5. 캐시 무효화 (lists, stats)
}
```

---

## 6. Acceptance Criteria

- [x] "출고" 상태 장비만 표시
- [x] 필수 필드 검증
- [x] 반납 위치 입력 필수
- [x] 캐시 무효화 (lists, stats)
- [x] 토스트 알림
- [x] 반응형 레이아웃

---

**상태**: ⏳ IN PROGRESS
**생성일**: 2026-01-26
