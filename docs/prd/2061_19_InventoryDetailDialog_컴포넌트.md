<!-- Generated: 2026-01-26 16:30:00 KST -->

# InventoryDetailDialog 컴포넌트 상세 스펙 (2061_19)

**문서 번호**: 2061_19
**컴포넌트명**: InventoryDetailDialog
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 6.1, 6.2, User Story 3)
**구현 상태**: ✅ COMPLETE (src/components/features/inventory/InventoryDetailDialog.tsx)

---

## 1. 개요

**InventoryDetailDialog**는 재고 목록 페이지의 행 클릭 시 표시되는 모달 다이얼로그 컴포넌트로, 선택한 장비의 상세 정보와 변경 이력을 표시한다. 기본 정보 탭과 변경이력 탭으로 나뉘어 사용자가 장비의 전체 라이프사이클을 추적할 수 있다.

**위치**: `src/components/features/inventory/InventoryDetailDialog.tsx`

**특성**:
- Client Component ('use client' 선언)
- shadcn/ui Dialog + Tabs 컴포넌트 활용
- TanStack Query 데이터 연동 (useInventoryDetailQuery)
- Zustand store 연동 (모달 상태 관리)
- 과기 장비 판정 및 표시
- 로딩/에러 상태 처리

---

## 2. Props 인터페이스

```typescript
interface InventoryDetailDialogProps {
  open: boolean;                    // 모달 열림/닫힘 상태
  inventoryId: number | null;      // 선택된 재고 ID (null이면 조회 안 함)
}
```

**상태 관리**:

```typescript
// Zustand store에서 관리
const isDetailOpen = useInventoryFilterStore((state) => state.isDetailOpen);
const selectedInventoryId = useInventoryFilterStore((state) => state.selectedInventoryId);
const setDetailOpen = useInventoryFilterStore((state) => state.setDetailOpen);
```

---

## 3. 데이터 구조 (InventoryDetail)

```typescript
interface InventoryDetail extends InventoryRecord {
  notes: string | null;
  created_by: {
    id: number;
    name: string;
    department?: string;
  };
  updated_by: {
    id: number;
    name: string;
    department?: string;
  };
  histories: InventoryHistoryRecord[];
  isOverdue?: boolean;
  overdueDays?: number;
}
```

---

## 4. 다이얼로그 구조

### 4.1 다이얼로그 래퍼

```jsx
<Dialog open={open}>
  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>재고 상세정보</DialogTitle>
    </DialogHeader>

    {/* 탭 또는 콘텐츠 */}
  </DialogContent>
</Dialog>
```

**특성**:
- 최대 너비: max-w-3xl (3rem = 768px)
- 최대 높이: max-h-[80vh] (뷰포트의 80%)
- 오버플로우: overflow-y-auto (세로 스크롤)

---

## 5. 탭 구조 (Tabs)

```jsx
<Tabs defaultValue="detail" className="w-full">
  <TabsList>
    <TabsTrigger value="detail">기본정보</TabsTrigger>
    <TabsTrigger value="history">변경이력</TabsTrigger>
  </TabsList>

  <TabsContent value="detail">
    {/* 기본정보 탭 */}
  </TabsContent>

  <TabsContent value="history">
    {/* 변경이력 탭 */}
  </TabsContent>
</Tabs>
```

**탭 옵션**:
- 기본정보: 선택된 상태로 열기 (defaultValue="detail")
- 변경이력: 필요시 클릭으로 전환

---

## 6. 탭 1: 기본정보 (Detail Tab)

### 정보 그리드 레이아웃

```jsx
<div className="grid grid-cols-2 gap-4">
  {/* 각 정보 항목 */}
</div>
```

**특성**:
- 2개 컬럼
- 간격: gap-4
- 반응형: md에서 1개 컬럼으로 축소 가능

### 정보 항목들 (8개)

| 필드 | 값 | 설명 |
|------|-----|------|
| ID | id | 숫자 |
| 카테고리 | category | 텍스트 |
| 모델 | model | 텍스트 |
| 시리얼번호 | serial_number | 모노스페이스 폰트 |
| 현재위치 | current_location | 텍스트 |
| 상태 | current_status | StatusBadge 컴포넌트 |
| 구매일 | purchase_date | ISO 8601 형식 |
| 구매처 | purchase_from | 텍스트 |

### 기본정보 렌더링 예시

```jsx
<TabsContent value="detail" className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm font-medium text-gray-600">ID</p>
      <p className="text-lg">{inventory.id}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">카테고리</p>
      <p className="text-lg">{inventory.category}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">모델</p>
      <p className="text-lg">{inventory.model}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">시리얼번호</p>
      <p className="font-mono text-sm">{inventory.serial_number}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">현재위치</p>
      <p className="text-lg">{inventory.current_location}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">상태</p>
      <StatusBadge status={inventory.current_status} size="md" />
      {inventory.isOverdue && (
        <p className="text-xs text-red-600 mt-1">과기: {inventory.overdueDays}일</p>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">구매일</p>
      <p className="text-lg">{inventory.purchase_date}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">구매처</p>
      <p className="text-lg">{inventory.purchase_from}</p>
    </div>
  </div>

  {/* 비고 (전체 너비) */}
  <div className="col-span-2">
    <p className="text-sm font-medium text-gray-600">비고</p>
    <p className="text-lg">{inventory.notes || '-'}</p>
  </div>

  {/* 등록/수정 정보 */}
  <div className="border-t pt-4 space-y-2">
    <div>
      <p className="text-sm font-medium text-gray-600">등록자</p>
      <p className="text-sm">{inventory.created_by.name} ({inventory.created_by.department || '-'})</p>
      <p className="text-xs text-gray-500">{inventory.created_at}</p>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-600">수정자</p>
      <p className="text-sm">{inventory.updated_by.name} ({inventory.updated_by.department || '-'})</p>
      <p className="text-xs text-gray-500">{inventory.updated_at}</p>
    </div>
  </div>
</TabsContent>
```

### 과기 판정 표시

**조건**:
- current_status === '출고' AND expected_checkin_date < today

**표시 형식**:
```jsx
{inventory.isOverdue && (
  <p className="text-xs text-red-600 mt-1">
    과기: {inventory.overdueDays}일
  </p>
)}
```

**스타일**:
- 텍스트: text-red-600 (빨간색)
- 크기: text-xs (작은 글씨)
- 강조: 별도 줄에 표시

---

## 7. 탭 2: 변경이력 (History Tab)

### 이력 목록 구조

```jsx
<TabsContent value="history" className="space-y-4">
  <div className="space-y-3">
    {inventory.histories && inventory.histories.length > 0 ? (
      inventory.histories.map((history) => (
        <HistoryItem key={history.id} history={history} />
      ))
    ) : (
      <p className="text-center text-gray-500">변경이력이 없습니다.</p>
    )}
  </div>
</TabsContent>
```

### 이력 항목 렌더링

```jsx
<div key={history.id} className="border rounded-lg p-3 bg-gray-50">
  {/* 헤더: 변경 타입 + 시간 */}
  <div className="flex justify-between items-start mb-2">
    <p className="font-medium">{InventoryService.formatChangeTypeForDisplay(history.change_type)}</p>
    <p className="text-xs text-gray-500">{history.changed_at}</p>
  </div>

  {/* 상세 정보 */}
  <div className="text-sm space-y-1">
    {history.previous_status && history.new_status && (
      <p>상태: <span className="text-gray-600">{history.previous_status} → {history.new_status}</span></p>
    )}
    {history.previous_location && history.new_location && (
      <p>위치: <span className="text-gray-600">{history.previous_location} → {history.new_location}</span></p>
    )}
    {history.checkout_location && (
      <p>사용처: <span className="text-gray-600">{history.checkout_location}</span></p>
    )}
    {history.expected_checkin_date && (
      <p>반납예정일: <span className="text-gray-600">{history.expected_checkin_date}</span></p>
    )}
    {history.reason && (
      <p>사유: <span className="text-gray-600">{history.reason}</span></p>
    )}
    <p className="text-xs text-gray-500">변경자: {history.changed_by.name}</p>
  </div>
</div>
```

### 이력 항목 정보 매핑

| 필드 | 표시 조건 | 형식 |
|------|----------|------|
| 상태 변경 | previous_status && new_status | "상태: 재고 → 출고" |
| 위치 변경 | previous_location && new_location | "위치: 창고 → 사무실" |
| 출고 위치 | checkout_location | "사용처: 프로젝트명" |
| 반납예정일 | expected_checkin_date | "반납예정일: 2026-02-10" |
| 사유 | reason | "사유: 고장 발생" |
| 변경자 | 항상 | "변경자: 홍길동" |

---

## 8. 로딩 상태

### 로딩 중 표시

```jsx
{isLoading ? (
  <div className="p-4 text-center text-gray-500">로딩 중...</div>
) : (
  /* 정상 콘텐츠 */
)}
```

---

## 9. 에러 상태

### 데이터 없음 처리

```typescript
if (!inventory) {
  return null;  // 또는 에러 메시지
}
```

---

## 10. 레이아웃 & 반응형

### Desktop (1280px+)

- 다이얼로그: max-w-3xl (768px)
- 그리드: 2개 컬럼
- 모든 정보 표시

### Tablet (768px~1279px)

- 다이얼로그: max-w-2xl
- 그리드: 2개 컬럼 (축소)
- 스크롤 필요시 활성화

### Mobile (<768px)

- 다이얼로그: max-w-sm (전체 너비)
- 그리드: 1개 컬럼
- 모든 요소 스택 방식

---

## 11. 통합 예시

### page.client.tsx에서의 사용

```typescript
'use client';

import InventoryDetailDialog from '@/components/features/inventory/InventoryDetailDialog';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';

export default function InventoryListPageClient() {
  const isDetailOpen = useInventoryFilterStore((state) => state.isDetailOpen);
  const selectedInventoryId = useInventoryFilterStore((state) => state.selectedInventoryId);

  return (
    <div className="space-y-4 p-4">
      {/* ... 필터, 테이블 ... */}

      {/* 상세 모달 */}
      <InventoryDetailDialog
        open={isDetailOpen}
        inventoryId={selectedInventoryId}
      />
    </div>
  );
}
```

---

## 12. 데이터 흐름

```
사용자가 테이블 행 클릭
     ↓
InventoryDataTable의 handleRowClick()
     ↓
Zustand store 업데이트:
  - setSelectedInventoryId(id)
  - setDetailOpen(true)
     ↓
InventoryDetailDialog 수신:
  - open = true
  - inventoryId = id
     ↓
useInventoryDetailQuery(inventoryId) 자동 실행
     ↓
GET /api/inventory/{id} API 호출
     ↓
데이터 수신 → 모달 렌더링
```

---

## 13. 접근성 지원

### ARIA Labels

```jsx
<Dialog open={open} onOpenChange={setDetailOpen}>
  <DialogContent role="dialog" aria-labelledby="dialog-title">
    <DialogHeader>
      <DialogTitle id="dialog-title">재고 상세정보</DialogTitle>
    </DialogHeader>
    {/* ... */}
  </DialogContent>
</Dialog>
```

### 키보드 네비게이션

- Esc: 모달 닫기
- Tab: 탭 간 이동
- Enter: 탭 선택

---

## 14. Acceptance Criteria

- [x] 기본정보 탭에 8개 정보 항목 표시
- [x] 과기 장비 판정 및 표시 정확성
- [x] 변경이력 탭에 모든 이력 표시 (최신순)
- [x] 이력 항목별 상세 정보 표시
- [x] 로딩 상태 처리
- [x] 데이터 없음 처리
- [x] 반응형 레이아웃 (desktop/tablet/mobile)
- [x] 접근성 (ARIA labels, keyboard navigation)
- [x] 모달 열기/닫기 상태 관리

---

## 15. 구현 체크리스트

**완료됨 (2026-01-26):**
- ✅ InventoryDetailDialog.tsx 컴포넌트 작성
- ✅ Dialog 래퍼 및 Tabs 구조
- ✅ 기본정보 탭 (8개 정보 항목)
- ✅ 과기 장비 판정 및 표시
- ✅ 변경이력 탭 (이력 목록)
- ✅ 이력 항목 포맷팅
- ✅ 로딩/에러 상태 처리
- ✅ Zustand store 연동
- ✅ TanStack Query 훅 연동

**통합 테스트:**
- ✅ InventoryDataTable 행 클릭 시 모달 열기
- ✅ useInventoryDetailQuery 훅 작동 확인
- ✅ 탭 전환 동작 확인

---

## 16. 참고 자료

- **PRD v2**: 섹션 6.1 (Dialog), 섹션 6.2 (Responsive), User Story 3 (상세 조회)
- **Types**: src/types/inventory.ts (InventoryDetail, InventoryDetailDialogProps)
- **Store**: src/stores/inventoryFilterStore.ts
- **Hooks**: src/hooks/inventory.ts (useInventoryDetailQuery)
- **Components**: StatusBadge.tsx (상태 표시)
- **API Spec**: GET /api/inventory/[id]

---

**상태**: ✅ COMPLETE & DELIVERED
**배포일**: 2026-01-26
**마지막 수정**: 2026-01-26 16:30:00 KST
