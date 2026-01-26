<!-- Generated: 2026-01-26 17:00:00 KST -->

# CheckoutForm 컴포넌트 상세 스펙 (2061_22)

**문서 번호**: 2061_22
**컴포넌트명**: CheckoutForm
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 5)
**구현 상태**: ⏳ IN PROGRESS

---

## 1. 개요

**CheckoutForm**은 상태가 "재고"인 장비를 사용처로 출고 처리하는 폼 컴포넌트로, 출고 위치(프로젝트명 또는 사용처), 예상 반납일 등을 기록하여 상태를 "출고"로 변경한다.

**위치**: `src/components/features/inventory/CheckoutForm.tsx`

**특성**:
- Client Component ('use client' 선언)
- React Hook Form + Controller 기반
- 장비 선택 (상태: "재고"만)
- 상태 전이: "재고" → "출고"
- TanStack Query 뮤테이션 연동
- 모달 다이얼로그 형식
- 성공 시 목록 새로고침 + 토스트 알림

---

## 2. Props 인터페이스

```typescript
interface CheckoutFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedInventoryId?: number | null;  // 미리 선택된 장비 ID (선택적)
}
```

---

## 3. 폼 필드 (4개)

| 필드명 | 타입 | 필수 | 검증 | 설명 |
|--------|------|------|------|------|
| inventory_id | Select | O | 상태 = "재고"만 | 장비 선택 |
| checkout_location | Text | O | 1-200글자 | 출고 위치/프로젝트명 |
| expected_checkin_date | Date | X | ISO 8601 | 예상 반납일 |
| reason | Text | X | 0-200글자 | 비고 |

---

## 4. 폼 구조

### 장비 Select (상태 필터링)

```typescript
// GET /api/inventory?statuses=["재고"] 또는 로컬에서 필터
const availableInventory = inventory.filter(item => item.current_status === '재고');
```

### 폼 필드

```jsx
<FormField
  control={form.control}
  name="inventory_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>장비 선택 *</FormLabel>
      <Select onValueChange={(val) => field.onChange(Number(val))}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="장비 선택" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {availableInventory.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {item.category} - {item.model} (SN: {item.serial_number})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="checkout_location"
  render={({ field }) => (
    <FormItem>
      <FormLabel>출고 위치 *</FormLabel>
      <FormControl>
        <Input placeholder="예: 프로젝트 A, 홍길동" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="expected_checkin_date"
  render={({ field }) => (
    <FormItem>
      <FormLabel>예상 반납일 (선택)</FormLabel>
      <FormControl>
        <DatePicker value={field.value} onChange={field.onChange} />
      </FormControl>
      <FormDescription>
        지정하지 않으면 반납일이 없는 상태로 등록됩니다
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="reason"
  render={({ field }) => (
    <FormItem>
      <FormLabel>비고 (선택)</FormLabel>
      <FormControl>
        <Textarea placeholder="추가 정보..." className="h-16" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 5. 검증 스키마

```typescript
const checkoutSchema = z.object({
  inventory_id: z.number().min(1, '장비를 선택하세요'),
  checkout_location: z.string().min(1, '출고 위치는 필수입니다').max(200),
  expected_checkin_date: z.string().optional().refine(
    (date) => {
      if (!date) return true;
      const d = new Date(date);
      return !isNaN(d.getTime()) && d >= new Date();
    },
    '반납일은 미래 날짜여야 합니다'
  ),
  reason: z.string().max(200).optional(),
});
```

---

## 6. 제출 로직

```typescript
async function onSubmit(data: CheckoutInventoryRequest) {
  // 1. 선택된 장비 상태 확인 (재고만)
  // 2. POST /api/inventory/{id}/checkout
  // 3. 상태 변경: 재고 → 출고
  // 4. 이력 기록
  // 5. 성공: 캐시 무효화 + 토스트 + 모달 닫기
}
```

---

## 7. 캐시 무효화

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
  toast.success('장비 출고가 완료되었습니다');
  form.reset();
  onOpenChange?.(false);
}
```

---

## 8. 접근성 지원

- ARIA labels: aria-label, aria-required
- Semantic HTML: Select, DatePicker
- Keyboard navigation: Tab, Enter, Escape

---

## 9. Acceptance Criteria

- [x] "재고" 상태 장비만 표시
- [x] 필수 필드 검증
- [x] 예상 반납일은 미래 날짜만 허용
- [x] 제출 성공 시 캐시 무효화 (lists, stats)
- [x] 토스트 알림 표시
- [x] 반응형 레이아웃
- [x] 접근성 지원

---

## 10. 참고 자료

- **PRD v2**: 섹션 3 (User Story 5: 출고 처리)
- **Types**: src/types/inventory.ts (CheckoutInventoryRequest)
- **Hooks**: src/hooks/inventory.ts (useCheckoutInventoryMutation)

---

**상태**: ⏳ IN PROGRESS
**생성일**: 2026-01-26
