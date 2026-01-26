<!-- Generated: 2026-01-26 16:45:00 KST -->

# InventoryHistory 타임라인 컴포넌트 상세 스펙 (2061_20)

**문서 번호**: 2061_20
**컴포넌트명**: InventoryHistory (Timeline)
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 3, User Story 3)
**구현 상태**: ✅ COMPLETE (src/components/features/inventory/InventoryHistory.tsx)

---

## 1. 개요

**InventoryHistory**는 재고 상세 페이지(또는 모달 다이얼로그)의 "변경이력" 탭에 표시되는 타임라인 컴포넌트로, 선택한 장비의 모든 변경 이력을 시간순으로 역순(최신→과거) 정렬하여 시각적 타임라인 형식으로 표시한다.

**위치**: `src/components/features/inventory/InventoryHistory.tsx`

**특성**:
- Client Component ('use client' 선언)
- 타임라인 시각화 (세로 방향 레이아웃)
- 변경 유형별 아이콘 표시 (입고, 출고, 반납, 위치변경, 상태변경)
- 조건부 필드 렌더링 (상태/위치/출고/반납/이유)
- 반응형 디자인 (desktop/tablet/mobile)
- 접근성 지원 (ARIA labels, semantic HTML)

---

## 2. Props 인터페이스

```typescript
interface InventoryHistoryProps {
  histories: InventoryHistoryRecord[];  // 변경이력 배열 (최신순 DESC)
  isLoading?: boolean;                   // 데이터 로딩 중 여부
  isError?: boolean;                     // 에러 상태 여부
  errorMessage?: string;                 // 에러 메시지
}
```

**데이터 구조** (InventoryHistoryRecord):

```typescript
interface InventoryHistoryRecord {
  id: number;
  inventory_id: number;
  change_type: ChangeType;               // '입고' | '출고' | '반납' | '위치변경' | '상태변경'
  previous_status?: InventoryStatus;     // 상태 변경 시만
  new_status?: InventoryStatus;          // 상태 변경 시만
  previous_location?: string;            // 위치/반납 시만
  new_location?: string;                 // 위치 변경 시만
  checkout_location?: string;            // 출고 시만 (논리적 사용처)
  expected_checkin_date?: string;        // 출고 시만 (반납예정일)
  reason?: string;                       // 사유 (상태변경, 위치변경 시)
  changed_by: {
    id: number;
    name: string;
    department?: string;
  };
  changed_at: string;                    // ISO 8601 형식
  created_at: string;
  updated_at: string;
}
```

---

## 3. 변경 유형 (Change Type) 정의

| 유형 | 한글명 | 아이콘 | 색상 | 설명 |
|------|---------|--------|------|------|
| `inbound` | 입고 | 📦 Package | 파란색 | 신규 장비 등록 |
| `checkout` | 출고 | 📥 Download | 주황색 | 사용처로 출고 |
| `checkin` | 반납 | 📤 Upload | 초록색 | 사용처에서 반납 |
| `relocate` | 위치변경 | 🚚 Move | 보라색 | 보관 위치 이동 |
| `status_change` | 상태변경 | ⚠️ AlertCircle | 빨간색 | 상태 변경 (고장/폐기) |

---

## 4. 타임라인 컨테이너

### 4.1 전체 구조

```jsx
<div className="space-y-1">
  {/* 각 이력 항목 */}
</div>
```

**특성**:
- 세로 방향 레이아웃 (vertical stack)
- 아이템 간 간격: space-y-1 (0.25rem, tight)
- 배경: 투명
- 타임라인 연결 라인 (선택적)

### 4.2 타임라인 라인 (Optional)

```jsx
<div className="relative">
  {/* 중앙 세로 라인 */}
  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300" />

  {/* 이력 항목들 */}
</div>
```

**특성**:
- 위치: 절대 좌측 (left-6)
- 너비: w-0.5 (2px)
- 색상: 회색 (bg-gray-300)
- 높이: top-0 to bottom-0 (전체 컨테이너 높이)

---

## 5. 이력 항목 (History Item)

### 5.1 항목 구조

```jsx
<div className="relative flex gap-4 pb-4">
  {/* 왼쪽: 아이콘 + 타임라인 포인트 */}
  <div className="flex flex-col items-center">
    <div className="w-12 h-12 rounded-full bg-{color}-100 border-2 border-{color}-500 flex items-center justify-center z-10 relative">
      {/* 변경 유형 아이콘 */}
    </div>
  </div>

  {/* 오른쪽: 콘텐츠 */}
  <div className="flex-1 pt-1">
    {/* 헤더: 변경 유형 + 시간 */}
    {/* 상세 정보 */}
    {/* 하단: 변경자 정보 */}
  </div>
</div>
```

**특성**:
- Flexbox 레이아웃: 좌측 아이콘 + 우측 콘텐츠
- 아이콘 컨테이너: 12x12 (3rem), 둥근 배경, 상태별 색상 테두리
- 콘텐츠 영역: flex-1 (확장)
- 간격: gap-4 (1rem)

### 5.2 아이콘 구현

```typescript
// 변경 유형별 아이콘 매핑
const changeTypeIcons: Record<ChangeType, { icon: ReactNode; color: string; bgColor: string }> = {
  'inbound': {
    icon: <Package className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-500'
  },
  'checkout': {
    icon: <Download className="w-6 h-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-500'
  },
  'checkin': {
    icon: <Upload className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-500'
  },
  'relocate': {
    icon: <Truck className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-500'
  },
  'status_change': {
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-500'
  },
};
```

**아이콘 선택**:
- lucide-react 라이브러리 사용
- Package, Download, Upload, Truck, AlertCircle 등

---

## 6. 이력 항목 콘텐츠

### 6.1 헤더 (타입 + 시간)

```jsx
<div className="flex justify-between items-start mb-2">
  <p className="font-semibold text-gray-800">
    {InventoryService.formatChangeTypeForDisplay(history.change_type)}
  </p>
  <p className="text-xs text-gray-500 ml-2">
    {formatDateTime(history.changed_at)}
  </p>
</div>
```

**특성**:
- 좌측: 변경 유형 (한글 이름, 굵음)
- 우측: 변경 시간 (작은 글씨, 회색)
- 레이아웃: flex justify-between
- 마진: mb-2 (0.5rem)

**시간 포맷팅**:
```typescript
// 예시:
// 2026-01-26 14:30:00 → "2026-01-26 14:30"
// 또는 상대 시간: "5시간 전"
function formatDateTime(dateString: string): string {
  // ISO 8601 → "2026-01-26 14:30" 형식
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

### 6.2 상세 정보 (조건부 렌더링)

```jsx
<div className="text-sm space-y-1 text-gray-700">
  {/* 상태 변경 */}
  {history.previous_status && history.new_status && (
    <div>
      <span className="font-medium">상태:</span>
      <span className="ml-2">
        <StatusBadge status={history.previous_status} size="sm" />
        <span className="mx-1 text-gray-400">→</span>
        <StatusBadge status={history.new_status} size="sm" />
      </span>
    </div>
  )}

  {/* 위치 변경 */}
  {history.previous_location && history.new_location && (
    <div>
      <span className="font-medium">위치:</span>
      <span className="ml-2 text-gray-600">
        {history.previous_location} → {history.new_location}
      </span>
    </div>
  )}

  {/* 출고 정보 */}
  {history.checkout_location && (
    <div>
      <span className="font-medium">사용처:</span>
      <span className="ml-2 text-gray-600">{history.checkout_location}</span>
    </div>
  )}

  {/* 반납예정일 */}
  {history.expected_checkin_date && (
    <div>
      <span className="font-medium">반납예정일:</span>
      <span className="ml-2 text-gray-600">{history.expected_checkin_date}</span>
    </div>
  )}

  {/* 사유 */}
  {history.reason && (
    <div>
      <span className="font-medium">사유:</span>
      <span className="ml-2 text-gray-600">{history.reason}</span>
    </div>
  )}
</div>
```

**조건부 렌더링 맵핑**:

| 필드 | 표시 조건 | 포맷 |
|------|----------|------|
| Status | `previous_status && new_status` | "상태: [OLD] → [NEW]" |
| Location | `previous_location && new_location` | "위치: 창고 → 사무실" |
| Checkout | `checkout_location` | "사용처: 프로젝트명" |
| Expected Checkin | `expected_checkin_date` | "반납예정일: 2026-02-10" |
| Reason | `reason` | "사유: 고장 발생" |

### 6.3 하단 (변경자)

```jsx
<div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
  <p>
    변경자: <span className="font-medium text-gray-700">{history.changed_by.name}</span>
    {history.changed_by.department && (
      <span> ({history.changed_by.department})</span>
    )}
  </p>
</div>
```

**특성**:
- 위쪽 선: 회색 (border-t)
- 패딩: pt-2 (0.5rem)
- 텍스트: 작은 글씨, 회색
- 이름: 굵음 (font-medium)

---

## 7. 로딩 상태

### 로딩 중 표시

```jsx
if (isLoading) {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**특성**:
- 3개의 스켈레톤 항목
- animate-pulse: 깜빡이는 애니메이션
- 회색 박스 (bg-gray-200)

---

## 8. 에러/빈 상태

### 데이터 없음

```jsx
if (!histories || histories.length === 0) {
  return (
    <div className="text-center py-8 text-gray-500">
      <p>변경이력이 없습니다.</p>
    </div>
  );
}
```

**특성**:
- 중앙 정렬 (text-center)
- 상하 패딩: py-8 (2rem)
- 회색 텍스트 (text-gray-500)

### 에러 상태

```jsx
if (isError) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
      <p>이력을 불러올 수 없습니다.</p>
      {errorMessage && <p className="text-xs mt-1">{errorMessage}</p>}
    </div>
  );
}
```

---

## 9. 레이아웃 & 반응형

### Desktop (1280px+)

```jsx
className="space-y-1 max-w-full"
```

- 타임라인 아이콘: 12x12 (3rem)
- 항목 간 간격: space-y-1
- 텍스트: 정상 크기

### Tablet (768px~1279px)

```jsx
className="space-y-1"
```

- 타임라인 아이콘: 10x10 (2.5rem)
- 간격 유지: space-y-1
- 텍스트: 정상 크기

### Mobile (<768px)

```jsx
className="space-y-2"
```

- 타임라인 아이콘: 10x10 (2.5rem)
- 항목 간 간격: space-y-2 (0.5rem, 더 벌어짐)
- 텍스트: text-sm (작은 글씨)
- 헤더 레이아웃: 세로 방향 (시간을 아래에)

```jsx
// Mobile에서의 헤더
<div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2">
  <p className="font-semibold text-gray-800">
    {InventoryService.formatChangeTypeForDisplay(history.change_type)}
  </p>
  <p className="text-xs text-gray-500 mt-1 md:mt-0">
    {formatDateTime(history.changed_at)}
  </p>
</div>
```

---

## 10. 색상 매핑 (Color Scheme)

| Change Type | Icon Color | Icon BG | Border | Hex Color |
|------------|-----------|---------|--------|-----------|
| inbound (입고) | text-blue-600 | bg-blue-50 | border-blue-500 | #2563EB |
| checkout (출고) | text-amber-600 | bg-amber-50 | border-amber-500 | #D97706 |
| checkin (반납) | text-green-600 | bg-green-50 | border-green-500 | #16A34A |
| relocate (위치변경) | text-purple-600 | bg-purple-50 | border-purple-500 | #7C3AED |
| status_change (상태변경) | text-red-600 | bg-red-50 | border-red-500 | #DC2626 |

---

## 11. 통합 예시

### InventoryDetailDialog에서의 사용

```jsx
'use client';

import InventoryHistory from '@/components/features/inventory/InventoryHistory';
import { useInventoryDetailQuery } from '@/hooks/inventory';

export default function InventoryDetailDialog({ open, inventoryId }) {
  const { data: inventory, isLoading } = useInventoryDetailQuery(inventoryId);

  if (!inventory) return null;

  return (
    <Dialog open={open}>
      <DialogContent>
        <Tabs defaultValue="detail">
          <TabsList>
            <TabsTrigger value="detail">기본정보</TabsTrigger>
            <TabsTrigger value="history">변경이력</TabsTrigger>
          </TabsList>

          {/* ... detail tab ... */}

          <TabsContent value="history">
            <InventoryHistory
              histories={inventory.histories}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 12. 데이터 흐름

```
InventoryDetailDialog (열음)
     ↓
useInventoryDetailQuery(inventoryId) 실행
     ↓
GET /api/inventory/{id} API 호출
     ↓
응답 데이터에 histories: InventoryHistoryRecord[] 포함
     ↓
<InventoryHistory histories={inventory.histories} /> 렌더링
     ↓
각 history를 역순(최신→과거)으로 타임라인 표시
```

---

## 13. 접근성 지원

### ARIA Labels

```jsx
<div
  role="region"
  aria-label="장비 변경이력 타임라인"
  aria-live="polite"
>
  {/* 타임라인 */}
</div>
```

### 의미론적 HTML

```jsx
<article className="relative flex gap-4">
  <aside className="flex flex-col items-center">
    {/* 아이콘 */}
  </aside>

  <section className="flex-1">
    {/* 콘텐츠 */}
  </section>
</article>
```

### 키보드 네비게이션

- Tab: 각 항목을 순차적으로 포커스
- 포커스 표시: outline-2 outline-offset-2

---

## 14. 성능 최적화

### Memoization

```typescript
import { memo } from 'react';

export default memo(function InventoryHistory({
  histories,
  isLoading,
  isError,
  errorMessage,
}: InventoryHistoryProps) {
  // ...
});
```

### 대규모 이력 처리

```typescript
// 초기 표시: 10개, "더보기" 버튼으로 확장
const [visibleCount, setVisibleCount] = useState(10);

const visibleHistories = histories?.slice(0, visibleCount) ?? [];
const hasMore = (histories?.length ?? 0) > visibleCount;

return (
  <>
    {/* 타임라인 */}
    {visibleHistories.map((history) => (
      <HistoryItem key={history.id} history={history} />
    ))}

    {hasMore && (
      <Button
        variant="outline"
        onClick={() => setVisibleCount(prev => prev + 10)}
        className="w-full"
      >
        더보기 ({visibleCount}/{histories?.length})
      </Button>
    )}
  </>
);
```

---

## 15. Acceptance Criteria

- [x] 모든 이력 항목이 역순(최신→과거)으로 정렬되어 표시됨
- [x] 각 항목에 변경 유형 아이콘이 올바르게 표시됨
- [x] 조건부 필드 렌더링 정확성 (상태/위치/출고/반납/이유)
- [x] 타임라인 시각화 (좌측 아이콘 + 우측 콘텐츠)
- [x] 로딩 상태 스켈레톤 UI
- [x] 데이터 없음 / 에러 상태 처리
- [x] 반응형 레이아웃 (desktop/tablet/mobile)
- [x] 접근성 (ARIA labels, semantic HTML, keyboard navigation)
- [x] 성능 최적화 (memoization, 대규모 데이터 처리)

---

## 16. 구현 체크리스트

**완료됨 (2026-01-26):**
- ✅ InventoryHistory.tsx 컴포넌트 작성
- ✅ Props 인터페이스 정의
- ✅ 타임라인 컨테이너 및 항목 구조
- ✅ 변경 유형별 아이콘 매핑
- ✅ 조건부 필드 렌더링 (상태/위치/출고/반납/이유)
- ✅ 로딩/에러/빈 상태 처리
- ✅ 반응형 스타일링 (desktop → tablet → mobile)
- ✅ 접근성 속성 (role, aria-label, aria-live)
- ✅ 성능 최적화 (memoization, 대규모 데이터)

**통합 테스트:**
- ✅ InventoryDetailDialog 내 InventoryHistory 컴포넌트 연동
- ✅ useInventoryDetailQuery 훅과 연동
- ✅ 타임라인 렌더링 확인

---

## 17. 참고 자료

- **PRD v2**: 섹션 3 (User Story 3: 장비 상세 조회), 섹션 3.2 (History Item Details)
- **Types**: src/types/inventory.ts (InventoryHistoryRecord, ChangeType)
- **Service**: src/lib/inventory-service.ts (formatChangeTypeForDisplay)
- **Icons**: lucide-react (Package, Download, Upload, Truck, AlertCircle)
- **Components**: StatusBadge.tsx (상태 표시용 재사용)
- **API Spec**: GET /api/inventory/[id] (histories 응답)

---

**상태**: ✅ COMPLETE & DELIVERED
**배포일**: 2026-01-26
**마지막 수정**: 2026-01-26 16:45:00 KST
