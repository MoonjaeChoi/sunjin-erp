<!-- Generated: 2026-01-26 15:40:00 KST -->

# InventoryFilters 컴포넌트 상세 스펙 (2061_16)

**문서 번호**: 2061_16
**컴포넌트명**: InventoryFilters
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 6.1, User Story 2)
**구현 상태**: ✅ COMPLETE (src/components/features/inventory/InventoryFilters.tsx)

---

## 1. 개요

**InventoryFilters**는 재고 목록 페이지의 상단에 위치하는 필터 패널 컴포넌트로, 사용자가 다양한 조건으로 재고를 검색하고 필터링할 수 있는 인터페이스를 제공한다.

**위치**: `src/components/features/inventory/InventoryFilters.tsx`

**특성**:
- Client Component ('use client' 선언)
- Zustand 상태 관리 연동 (inventoryFilterStore)
- shadcn/ui 컴포넌트 활용
- Responsive 레이아웃
- 접근성 지원 (ARIA labels)

---

## 2. Props 인터페이스

```typescript
interface InventoryFiltersProps {
  // 현재 필터 상태 (optional - Zustand store에서 자동 관리)
  // 컴포넌트 내부에서 store 접근으로 필요 없음
}
```

**설명**: 이 컴포넌트는 Zustand의 `inventoryFilterStore`를 직접 사용하므로 외부 Props가 필요하지 않다. 모든 필터 상태는 store에서 관리된다.

---

## 3. 상태 관리

### Zustand Store (inventoryFilterStore)

```typescript
// src/stores/inventoryFilterStore.ts 참조

interface InventoryFilterState {
  filters: {
    categories: string[];        // 선택된 카테고리 배열
    statuses: InventoryStatus[]; // 선택된 상태 배열
    location: string;            // 위치 검색어
    search: string;              // 시리얼/모델명 검색어
  };
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
}
```

### 상태 초기값

```typescript
const initialFilters = {
  categories: [],
  statuses: [],
  location: '',
  search: '',
};
```

---

## 4. 필터 항목 상세

### 4.1 카테고리 필터

**위치**: 필터 패널 상단
**유형**: 다중 선택 버튼 그룹
**옵션**: INVENTORY_CATEGORIES 상수에서 로드

```typescript
// src/types/inventory.ts
export const INVENTORY_CATEGORIES = [
  '모니터',
  '노트북',
  '라우터',
  '프린터',
  '기타',
] as const;
```

**렌더링**:
```jsx
<div>
  <p className="text-sm font-medium mb-2">카테고리</p>
  <div className="flex flex-wrap gap-2">
    {INVENTORY_CATEGORIES.map((category) => (
      <Button
        key={category}
        variant={filters.categories.includes(category) ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleCategory(category)}
      >
        {category}
      </Button>
    ))}
  </div>
</div>
```

**로직**:
```typescript
const toggleCategory = (category: string) => {
  const updated = filters.categories.includes(category)
    ? filters.categories.filter((c) => c !== category)
    : [...filters.categories, category];
  updateFilter('categories', updated);
};
```

**UX**:
- 선택된 카테고리: `variant="default"` (파란색 배경)
- 선택되지 않음: `variant="outline"` (테두리만)
- 토글 방식: 클릭하면 선택/해제

---

### 4.2 상태(Status) 필터

**위치**: 카테고리 필터 아래
**유형**: 다중 선택 버튼 그룹
**옵션**: 4가지 상태 (재고, 출고, 고장, 폐기)

```typescript
const INVENTORY_STATUSES: InventoryStatus[] = ['재고', '출고', '고장', '폐기'];
```

**렌더링**:
```jsx
<div>
  <p className="text-sm font-medium mb-2">상태</p>
  <div className="flex flex-wrap gap-2">
    {INVENTORY_STATUSES.map((status) => (
      <Button
        key={status}
        variant={filters.statuses.includes(status) ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleStatus(status)}
      >
        {status}
      </Button>
    ))}
  </div>
</div>
```

**로직**:
```typescript
const toggleStatus = (status: InventoryStatus) => {
  const updated = filters.statuses.includes(status)
    ? filters.statuses.filter((s) => s !== status)
    : [...filters.statuses, status];
  updateFilter('statuses', updated);
};
```

**색상 강화** (선택 시):
- 재고: 초록색 배경
- 출고: 파란색 배경
- 고장: 주황색 배경
- 폐기: 회색 배경

---

### 4.3 검색 필터 (시리얼번호 + 모델명)

**위치**: 상태 필터 아래
**유형**: 텍스트 입력 필드
**플레이스홀더**: "모델명, 시리얼번호, 구매처로 검색..."
**동작**: 실시간 입력 (debounce 권장)

**렌더링**:
```jsx
<div>
  <Input
    placeholder="모델명, 시리얼번호, 구매처로 검색..."
    value={filters.search}
    onChange={(e) => updateFilter('search', e.target.value)}
    className="w-full"
  />
</div>
```

**API 매핑**:
- API에서 search 파라미터로 전달됨
- GET /api/inventory?search=SERIAL_PREFIX
- Phase 1: 접두사 기반 (LIKE 'term%')
- Phase 2: 전문검색 지원

**Debounce 구현**:
```typescript
const debouncedSearch = useDebounce(filters.search, 300); // 300ms 지연
// TanStack Query에서 debouncedSearch 사용
```

---

### 4.4 위치(Location) 필터

**위치**: 검색 필터 아래
**유형**: 텍스트 입력 필드
**플레이스홀더**: "위치로 검색..."
**동작**: 자유 텍스트 검색

**렌더링**:
```jsx
<div>
  <Input
    placeholder="위치로 검색..."
    value={filters.location}
    onChange={(e) => updateFilter('location', e.target.value)}
    className="w-full"
  />
</div>
```

**API 매핑**:
- GET /api/inventory?location=LOCATION_TEXT
- LIKE '%location%' 쿼리 (부분 일치)

---

## 5. 필터 초기화 버튼

**위치**: 필터 패널 최하단
**유형**: 버튼 (variant="outline", full width)
**라벨**: "필터 초기화"
**동작**: 모든 필터 초기값으로 리셋

**렌더링**:
```jsx
<Button
  variant="outline"
  onClick={clearFilters}
  className="w-full"
>
  필터 초기화
</Button>
```

**로직**:
```typescript
const clearFilters = useInventoryFilterStore((state) => state.clearFilters);

// clearFilters 호출 시:
// - categories → []
// - statuses → []
// - location → ''
// - search → ''
// - pagination.page → 1 (필터 변경 시 자동)
```

---

## 6. 레이아웃 & 스타일

### 컨테이너

```jsx
<div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
  {/* 필터 항목들 */}
</div>
```

**특성**:
- 배경: 밝은 회색 (bg-gray-50)
- 테두리: 1px 회색 (border)
- 패딩: p-4 (1rem)
- 아이템 간 거리: space-y-4 (1rem)

### 각 필터 섹션

```jsx
<div>
  <p className="text-sm font-medium mb-2">필터 이름</p>
  {/* 입력 요소 */}
</div>
```

**특성**:
- 라벨: text-sm font-medium
- 라벨 하단 여백: mb-2

### 버튼 그룹 (카테고리, 상태)

```jsx
<div className="flex flex-wrap gap-2">
  {/* 버튼 배열 */}
</div>
```

**특성**:
- flex wrap: 줄 바꿈
- 버튼 간격: gap-2 (0.5rem)
- 반응형: md 이상에서 자동 조정

---

## 7. Responsive 설계

### Desktop (1280px+)

- 필터 패널: 전체 너비, 수평 배치 (sidebar 없음)
- 버튼 그룹: 한 줄에 모두 표시

### Tablet (768px~1279px)

- 필터 패널: 전체 너비
- 버튼 그룹: 필요시 여러 줄로 wrap

### Mobile (<768px)

- 필터 패널: 전체 너비
- 버튼: 작은 크기 (size="sm" 유지)
- 검색/위치 입력: 전체 너비

---

## 8. 접근성 지원

### ARIA Labels

```jsx
<Input
  placeholder="시리얼번호로 검색..."
  aria-label="시리얼번호 또는 모델명 검색"
/>

<Button
  onClick={() => toggleCategory(category)}
  aria-pressed={filters.categories.includes(category)}
>
  {category}
</Button>
```

### 키보드 네비게이션

- Tab 키: 모든 인터랙티브 요소 포커스
- Space/Enter: 버튼 토글
- Type: 텍스트 입력

### 색상만으로 판단 금지

- 선택 상태: 색상 + 텍스트 라벨 + 시각적 변화

---

## 9. 통합 예시

### page.client.tsx에서의 사용

```typescript
'use client';

import InventoryFilters from '@/components/features/inventory/InventoryFilters';
import { useInventoryListQuery } from '@/hooks/inventory';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';

export default function InventoryListPageClient() {
  const filters = useInventoryFilterStore((state) => state.filters);
  const pagination = useInventoryFilterStore((state) => state.pagination);
  const sort = useInventoryFilterStore((state) => state.sort);

  // 필터 객체를 쿼리 파라미터로 변환
  const queryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    categories: filters.categories,
    statuses: filters.statuses,
    location: filters.location,
    search: filters.search,
    sortBy: sort.sortBy,
    order: sort.order,
  };

  // 필터 변경 시 자동으로 쿼리 재실행
  const { data, isLoading } = useInventoryListQuery(queryParams);

  return (
    <div className="space-y-4 p-4">
      {/* 필터 패널 */}
      <InventoryFilters />

      {/* 데이터 테이블 */}
      {/* ... */}
    </div>
  );
}
```

---

## 10. 필터 적용 흐름 (Data Flow)

```
User Input (버튼/입력)
     ↓
InventoryFilters 컴포넌트
     ↓
Zustand store.updateFilter(key, value)
     ↓
React re-render (filters 상태 변경)
     ↓
page.client.tsx의 useInventoryListQuery 훅
     ↓
queryParams 변경 감지
     ↓
API 요청: GET /api/inventory?categories=...&statuses=...&search=...&location=...
     ↓
데이터 캐시 무효화 (TanStack Query)
     ↓
새로운 데이터 페칭 및 렌더링
```

---

## 11. 에러 처리

### 유효성 검증

- 카테고리: 미리정의된 옵션만 (select validation)
- 상태: 미리정의된 옵션만 (select validation)
- 검색/위치: 문자열 길이 제한 없음 (API에서 처리)

### 잘못된 입력

```typescript
// 예: 카테고리에 유효하지 않은 값
const toggleCategory = (category: string) => {
  if (!INVENTORY_CATEGORIES.includes(category)) {
    console.warn(`Invalid category: ${category}`);
    return;
  }
  // ... 정상 로직
};
```

---

## 12. 성능 고려사항

### Debouncing

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

- 검색/위치 입력: 300ms debounce
- API 요청 빈도 감소
- 사용자 경험 개선

### Memoization

```typescript
import { memo } from 'react';

export default memo(function InventoryFilters() {
  // ...
});
```

- 부모 컴포넌트 리렌더링 시 불필요한 재렌더링 방지

---

## 13. Acceptance Criteria

- [x] 모든 필터 입력 렌더링 (카테고리, 상태, 검색, 위치)
- [x] 필터 변경 시 store 업데이트 및 API 재요청
- [x] "필터 초기화" 버튼으로 기본값 복원
- [x] Responsive 레이아웃 (mobile, tablet, desktop)
- [x] 접근성 지원 (ARIA labels, semantic HTML)
- [x] 필터 상태 URL 동기화 (query params)
- [x] Debounce 적용 (검색/위치)
- [x] 로딩 상태 표시 (optional spinner)

---

## 14. 구현 체크리스트

**완료됨 (2026-01-26):**
- ✅ InventoryFilters.tsx 컴포넌트 작성
- ✅ inventoryFilterStore.ts Zustand 스토어 작성
- ✅ 카테고리 다중 선택 버튼 구현
- ✅ 상태 다중 선택 버튼 구현
- ✅ 검색 텍스트 입력 필드
- ✅ 위치 텍스트 입력 필드
- ✅ 필터 초기화 버튼
- ✅ Responsive 스타일링
- ✅ 접근성 속성 (aria-label 등)

**통합 테스트:**
- ✅ page.client.tsx와 통합 및 작동 확인
- ✅ useInventoryListQuery 훅과 연동
- ✅ TanStack Query 캐시 무효화 동작 확인

---

## 15. 참고 자료

- **PRD v2**: 섹션 3 (User Story 2: 필터링 및 검색)
- **Types**: src/types/inventory.ts (InventoryFiltersProps)
- **Store**: src/stores/inventoryFilterStore.ts
- **Hooks**: src/hooks/inventory.ts (useInventoryListQuery)
- **API Spec**: GET /api/inventory query parameters 섹션 5.2.1

---

**상태**: ✅ COMPLETE & DELIVERED
**배포일**: 2026-01-26
**마지막 수정**: 2026-01-26 15:40:00 KST

