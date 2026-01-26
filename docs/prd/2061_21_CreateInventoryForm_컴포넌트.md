<!-- Generated: 2026-01-26 17:00:00 KST -->

# CreateInventoryForm 컴포넌트 상세 스펙 (2061_21)

**문서 번호**: 2061_21
**컴포넌트명**: CreateInventoryForm
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 4)
**구현 상태**: ⏳ IN PROGRESS

---

## 1. 개요

**CreateInventoryForm**은 신규 장비를 시스템에 등록(입고)하는 폼 컴포넌트로, 사용자가 카테고리, 모델명, 시리얼번호, 구매일, 구매처, 초기 위치 등의 정보를 입력하여 장비를 등록할 수 있다.

**위치**: `src/components/features/inventory/CreateInventoryForm.tsx`

**특성**:
- Client Component ('use client' 선언)
- React Hook Form + Controller 기반
- shadcn/ui Form/Input/Select/Button/Dialog
- 시리얼번호 중복 검사 (서버 validation)
- 필드 검증 (클라이언트 + 서버)
- TanStack Query 뮤테이션 연동
- 모달 다이얼로그 형식
- 성공 시 토스트 알림 + 자동 새로고침

---

## 2. Props 인터페이스

```typescript
interface CreateInventoryFormProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## 3. 폼 필드 (7개)

| 필드명 | 타입 | 필수 | 검증 | 설명 |
|--------|------|------|------|------|
| category | Select | O | 미리정의 목록 | 모니터/노트북/라우터/프린터/기타 |
| model | Text | O | 1-100글자 | 제조사 + 모델명 |
| serial_number | Text | O | unique 서버검사 | 시리얼번호 (중복 금지) |
| purchase_date | Date | O | ISO 8601 | 구매일 |
| purchase_from | Text | O | 1-100글자 | 구매처/판매처명 |
| current_location | Text | O | 1-200글자 | 초기 위치 (창고/사무실 등) |
| notes | TextArea | X | 0-500글자 | 비고/메모 |

---

## 4. 검증 스키마

```typescript
const createInventorySchema = z.object({
  category: z.enum(INVENTORY_CATEGORIES),
  model: z.string().min(1, '모델명은 필수입니다').max(100),
  serial_number: z.string().min(1, '시리얼번호는 필수입니다').max(100),
  purchase_date: z.string().refine((date) => {
    const d = new Date(date);
    return !isNaN(d.getTime()) && d <= new Date();
  }, '유효한 날짜를 입력하세요'),
  purchase_from: z.string().min(1, '구매처는 필수입니다').max(100),
  current_location: z.string().min(1, '초기 위치는 필수입니다').max(200),
  notes: z.string().max(500).optional(),
});
```

---

## 5. 제출 로직

```typescript
async function onSubmit(data: CreateInventoryRequest) {
  // 1. 클라이언트 검증 (Zod)
  // 2. 시리얼번호 중복 검사
  // 3. POST /api/inventory
  // 4. 성공: 토스트 + 캐시 무효화 + 모달 닫기
  // 5. 실패: 토스트 + 에러 표시
}
```

---

## 6. 캐시 무효화

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
  queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
  toast.success('장비 입고 등록 완료');
  form.reset();
  onOpenChange?.(false);
}
```

---

## 7. 시리얼번호 중복 검사

- Debounce: 500ms
- 서버 검사: POST 제출 시
- 에러 표시: 에러 필드 위에

---

## 8. Acceptance Criteria

- [x] 모든 필드 렌더링
- [x] 클라이언트 검증
- [x] 시리얼번호 중복 검사
- [x] 제출 성공 시 캐시 무효화
- [x] 토스트 알림
- [x] 반응형 레이아웃
- [x] 접근성

---

**상태**: ⏳ IN PROGRESS
**생성일**: 2026-01-26
