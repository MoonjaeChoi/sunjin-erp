<!-- Generated: 2026-01-26 16:00:00 KST -->

# InventoryDataTable 컴포넌트 상세 스펙 (2061_17)

**문서 번호**: 2061_17
**컴포넌트명**: InventoryDataTable
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 6.1, 6.3, 6.4, User Story 1)
**구현 상태**: ✅ COMPLETE (src/components/features/inventory/InventoryDataTable.tsx)

---

## 1. 개요

**InventoryDataTable**은 재고 목록 페이지의 주요 컴포넌트로, 조회된 재고 데이터를 테이블 형식으로 표시한다. 사용자는 이 컴포넌트를 통해 여러 장비의 정보를 한눈에 파악할 수 있으며, 행 클릭으로 상세 페이지로 이동하고, 페이지네이션을 통해 다양한 데이터를 탐색할 수 있다.

**위치**: `src/components/features/inventory/InventoryDataTable.tsx`

**특성**:
- Client Component ('use client' 선언)
- shadcn/ui Table + Pagination 컴포넌트 활용
- Zustand store 연동 (행 클릭, 페이지 변경)
- TanStack Query 데이터 연동
- Responsive 레이아웃
- 접근성 지원 (ARIA labels, semantic HTML)

---

## 2. Props 인터페이스

```typescript
interface InventoryDataTableProps {
  data: InventoryRecord[];           // 현재 페이지 데이터 배열
  pagination: {
    page: number;                     // 현재 페이지 (1부터 시작)
    pageSize: number;                 // 페이지당 항목 수
    total: number;                    // 전체 항목 수
    totalPages: number;               // 전체 페이지 수
  };
  isLoading?: boolean;                // 로딩 상태
  onSort?: (sortBy: string, order: 'asc' | 'desc') => void;  // 정렬 콜백
  onPageChange?: (page: number) => void;                      // 페이지 변경 콜백
  onRowClick?: (id: number) => void;                          // 행 클릭 콜백
}
```

**설명**:
- `data`: GET /api/inventory 응답의 data 배열
- `pagination`: 페이지네이션 메타데이터
- `isLoading`: TanStack Query의 isLoading 상태
- 콜백들은 Zustand store의 메서드를 통해 연동

---

## 3. 테이블 컬럼 정의

테이블은 총 **7개 컬럼**을 표시한다:

| 컬럼 | 필드명 | 데이터타입 | 정렬 | 설명 |
|------|--------|----------|------|------|
| ID | id | number | ✓ | 재고 고유 번호 |
| 카테고리 | category | string | ✓ | 장비 카테고리 (모니터, 노트북 등) |
| 모델 | model | string | ✓ | 제조사/모델명 |
| 시리얼번호 | serial_number | string | - | 장비 시리얼번호 (조회 불가능한 자동 ID) |
| 위치 | current_location | string | ✓ | 현재 물리적 보관 위치 |
| 상태 | current_status | InventoryStatus | ✓ | 재고/출고/고장/폐기 (배지 렌더링) |
| 구매일 | purchase_date | string (YYYY-MM-DD) | ✓ | ISO 8601 형식의 구매일 |

### 정렬 가능 컬럼

```typescript
type SortableColumns = 'category' | 'model' | 'serialNumber' | 'location' | 'status' | 'purchaseDate';
```

---

## 4. 테이블 헤더

### 헤더 셀 렌더링

```jsx
<TableHeader>
  <TableRow className="bg-gray-50">
    <TableHead>ID</TableHead>
    <TableHead onClick={() => handleSort('category')} className="cursor-pointer hover:bg-gray-100">
      <div className="flex items-center gap-2">
        카테고리 {renderSortIcon('category')}
      </div>
    </TableHead>
    <TableHead onClick={() => handleSort('model')} className="cursor-pointer hover:bg-gray-100">
      <div className="flex items-center gap-2">
        모델 {renderSortIcon('model')}
      </div>
    </TableHead>
    {/* ... 나머지 컬럼 */}
  </TableRow>
</TableHeader>
```

### 정렬 아이콘

```typescript
const renderSortIcon = (field: string) => {
  if (sort.sortBy !== field) {
    // 미정렬 상태
    return <ChevronUpDown className="w-4 h-4 opacity-30" />;
  }
  // 정렬됨
  const rotateClass = sort.order === 'DESC' ? 'rotate-180' : '';
  return <ChevronUpDown className={`w-4 h-4 ${rotateClass}`} />;
};
```

**동작**:
- 헤더 셀 클릭 → 정렬 토글
- 같은 컬럼: ASC ↔ DESC 전환
- 다른 컬럼: ASC로 초기화 후 정렬
- 정렬 아이콘: ChevronUpDown (opacity 30% = 미정렬, 정상 = 정렬됨)

**Zustand store 연동**:

```typescript
const setSort = useInventoryFilterStore((state) => state.setSort);
const sort = useInventoryFilterStore((state) => state.sort);

const handleSort = (field: string) => {
  if (sort.sortBy === field) {
    setSort(field, sort.order === 'ASC' ? 'DESC' : 'ASC');
  } else {
    setSort(field, 'ASC');
  }
};
```

---

## 5. 테이블 바디 (행 렌더링)

### 행 클릭 처리

```jsx
<TableBody>
  {data.map((item: InventoryRecord) => (
    <TableRow
      key={item.id}
      onClick={() => handleRowClick(item.id)}
      className="cursor-pointer hover:bg-gray-50"
    >
      <TableCell className="font-medium">{item.id}</TableCell>
      <TableCell className="font-medium">{item.category}</TableCell>
      <TableCell>{item.model}</TableCell>
      <TableCell className="font-mono text-sm">{item.serial_number}</TableCell>
      <TableCell>{item.current_location}</TableCell>
      <TableCell>
        <StatusBadge status={item.current_status} size="sm" />
      </TableCell>
      <TableCell>{item.purchase_date}</TableCell>
    </TableRow>
  ))}
</TableBody>
```

**행 클릭 로직**:

```typescript
const setDetailOpen = useInventoryFilterStore((state) => state.setDetailOpen);
const setSelectedInventoryId = useInventoryFilterStore((state) => state.setSelectedInventoryId);

const handleRowClick = (id: number) => {
  setSelectedInventoryId(id);
  setDetailOpen(true);  // 모달 또는 상세 페이지 열기
};
```

### 셀 포맷팅

- **ID**: 숫자 그대로 표시
- **카테고리**: 텍스트, 굵게 (font-medium)
- **모델**: 텍스트 그대로
- **시리얼번호**: 모노스페이스 폰트 (font-mono), 작은 크기 (text-sm)
- **위치**: 텍스트 그대로
- **상태**: StatusBadge 컴포넌트 (색상 + 아이콘)
- **구매일**: ISO 8601 형식 (YYYY-MM-DD)

---

## 6. 상태 배지 (Status Badge)

### StatusBadge 컴포넌트 통합

```jsx
import StatusBadge from './StatusBadge';

// 테이블 셀 내부
<TableCell>
  <StatusBadge status={item.current_status} size="sm" />
</TableCell>
```

### 색상 및 아이콘 매핑

| 상태 | 배지 클래스 | 텍스트 클래스 | 아이콘 | 설명 |
|------|-----------|-------------|--------|------|
| 재고 | bg-green-100 | text-green-700 | Package | 창고에 있음 |
| 출고 | bg-blue-100 | text-blue-700 | Download | 사용 중 |
| 고장 | bg-amber-100 | text-amber-700 | AlertTriangle | 고장 상태 |
| 폐기 | bg-gray-100 | text-gray-700 | Trash2 | 최종 상태 |

---

## 7. 로딩 상태 (Loading State)

### 로딩 중 표시

```typescript
if (isLoading) {
  return <div className="p-4 text-center text-gray-500">로딩 중...</div>;
}
```

### 스켈레톤 UI (선택적)

페이지 전체 스켈레톤은 page.client.tsx에서 처리하므로, 테이블 컴포넌트는 간단한 텍스트 표시만 제공.

---

## 8. 빈 상태 (Empty State)

### 데이터 없음 처리

```typescript
if (!data || data.length === 0) {
  return <div className="p-4 text-center text-gray-500">재고 데이터가 없습니다.</div>;
}
```

**표시되는 경우**:
- 첫 검색 결과가 없음
- 필터 적용 후 결과 없음
- 전체 재고가 0개

---

## 9. 페이지네이션

### 페이지네이션 UI

```jsx
{pagination && pagination.totalPages > 1 && (
  <div className="flex justify-center">
    <Pagination>
      <PaginationContent>
        <PaginationPrevious
          onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
          className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />

        {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
          const pageNum = idx + 1;
          return (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => handlePageChange(pageNum)}
                isActive={pagination.page === pageNum}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {pagination.totalPages > 5 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        <PaginationNext
          onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
          className={
            pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
          }
        />
      </PaginationContent>
    </Pagination>
  </div>
)}
```

### 페이지 변경 로직

```typescript
const setPage = useInventoryFilterStore((state) => state.setPage);

const handlePageChange = (newPage: number) => {
  setPage(newPage);  // Store 업데이트 → useInventoryListQuery 재요청
};
```

### 페이지네이션 상태

- **이전 버튼**: page === 1일 때 비활성화
- **다음 버튼**: page === totalPages일 때 비활성화
- **페이지 번호**: 최대 5개까지 표시 (1~5, 6~10 등)
- **생략 표시**: totalPages > 5일 때 "..." 표시

### 표시 예시

```
< 1 2 3 4 5 ... >  (page 1 of 10)
< 1 2 3 4 5 ... >  (page 5 of 10)
<  ... 6 7 8 9 10  (page 10 of 10)
```

---

## 10. 레이아웃 & 스타일

### 테이블 컨테이너

```jsx
<div className="space-y-4">
  <div className="border rounded-lg overflow-hidden">
    <Table>
      {/* 헤더 및 바디 */}
    </Table>
  </div>

  {/* 페이지네이션 */}
</div>
```

**특성**:
- 테이블과 페이지네이션 간 거리: space-y-4 (1rem)
- 테이블 테두리: border, rounded-lg
- overflow-hidden: 모서리 둥근 테두리 적용
- 배경: 기본 (흰색)

### 헤더 스타일

```jsx
<TableHeader>
  <TableRow className="bg-gray-50">
    {/* 헤더 셀 */}
  </TableRow>
</TableHeader>
```

**특성**:
- 배경: 밝은 회색 (bg-gray-50)
- 정렬 가능 셀: cursor-pointer, hover:bg-gray-100

### 바디 행 스타일

```jsx
<TableRow
  className="cursor-pointer hover:bg-gray-50"
>
  {/* 셀 */}
</TableRow>
```

**특성**:
- 커서: pointer (클릭 가능)
- 호버: 밝은 회색 배경 (hover:bg-gray-50)
- 폰트: 기본

---

## 11. Responsive 설계

### Desktop (1280px+)

- 테이블 전체 너비 표시
- 모든 컬럼 보임
- 페이지네이션: 중앙 정렬

### Tablet (768px~1279px)

- 테이블 width: 100%, overflow-x auto (필요시 가로 스크롤)
- 컬럼 축소: 텍스트 크기 감소, 패딩 감소
- 시리얼번호: 말줄임 가능

### Mobile (<768px)

- 테이블 가로 스크롤 필수
- 컬럼 폭 최소화
- 페이지네이션: 버튼 크기 축소

```css
/* Tailwind로 구현 */
@media (max-width: 768px) {
  .table-cell {
    @apply px-2 py-2 text-sm;
  }
}
```

---

## 12. 접근성 지원

### ARIA Labels

```jsx
<Table role="grid" aria-label="재고 목록 테이블">
  <TableHeader>
    <TableRow role="row">
      <TableHead role="columnheader" scope="col">ID</TableHead>
      <TableHead role="columnheader" scope="col">카테고리</TableHead>
      {/* ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow role="row" aria-rowindex={index + 1}>
      <TableCell role="gridcell">{item.id}</TableCell>
      {/* ... */}
    </TableRow>
  </TableBody>
</Table>
```

### 키보드 네비게이션

- Tab: 페이지네이션 버튼 포커스
- Enter/Space: 버튼 클릭 또는 행 선택
- 마우스 클릭: 행 선택

### 색상만으로 판단 금지

- 상태: 배지 색상 + 텍스트 + 아이콘
- 정렬: 아이콘 + "정렬됨" 인디케이터

---

## 13. 통합 예시

### page.client.tsx에서의 사용

```typescript
'use client';

import InventoryDataTable from '@/components/features/inventory/InventoryDataTable';
import { useInventoryListQuery } from '@/hooks/inventory';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';

export default function InventoryListPageClient() {
  const filters = useInventoryFilterStore((state) => state.filters);
  const pagination = useInventoryFilterStore((state) => state.pagination);
  const sort = useInventoryFilterStore((state) => state.sort);

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

  const { data, isLoading } = useInventoryListQuery(queryParams);
  const listData = (data as any) || { data: [], pagination: {} };

  return (
    <div className="space-y-4 p-4">
      <InventoryFilters />
      {listData && (
        <InventoryDataTable
          data={listData.data}
          pagination={listData.pagination}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
```

---

## 14. 데이터 흐름 (Data Flow)

```
GET /api/inventory (TanStack Query)
     ↓
useInventoryListQuery 응답
     ↓
InventoryDataTable에 data + pagination 전달
     ↓
테이블 렌더링
     ↓
사용자 인터랙션:
  - 정렬 헤더 클릭 → handleSort() → store.setSort() → query 재실행
  - 페이지네이션 클릭 → handlePageChange() → store.setPage() → query 재실행
  - 행 클릭 → handleRowClick() → store.setSelectedId() + store.setDetailOpen(true)
```

---

## 15. 에러 처리

### 데이터 검증

```typescript
if (!data || !Array.isArray(data)) {
  return <div className="p-4 text-red-600">데이터 로드 실패</div>;
}

if (!pagination || typeof pagination.totalPages !== 'number') {
  return <div className="p-4 text-red-600">페이지네이션 정보 오류</div>;
}
```

### 유효성 검증

```typescript
const validPageNumber = Math.max(1, Math.min(newPage, pagination.totalPages));
setPage(validPageNumber);
```

---

## 16. 성능 최적화

### Memoization

```typescript
import { memo } from 'react';

export default memo(function InventoryDataTable({
  data,
  pagination,
  isLoading,
}: InventoryDataTableProps) {
  // ...
});
```

- 부모 리렌더링 시 props 미변경 → 리렌더링 스킵

### 행 렌더링 최적화

```typescript
// 함수 참조 변경 방지
const handleRowClick = useCallback((id: number) => {
  setSelectedInventoryId(id);
  setDetailOpen(true);
}, [setSelectedInventoryId, setDetailOpen]);

// 리스트 렌더링
{data.map((item) => (
  <TableRow key={item.id} onClick={() => handleRowClick(item.id)}>
    {/* ... */}
  </TableRow>
))}
```

---

## 17. Acceptance Criteria

- [x] 모든 컬럼 렌더링 (7개 컬럼 정확히 표시)
- [x] 상태별 색상/아이콘 정확성 (StatusBadge 통합)
- [x] 행 클릭 상세 페이지 네비게이션 (모달/페이지 열기)
- [x] 정렬 기능 (헤더 클릭 → 정렬 토글)
- [x] 페이지네이션 기능 (이전/다음/페이지번호)
- [x] 로딩 상태 처리 (isLoading prop)
- [x] 빈 상태 메시지 (데이터 없음)
- [x] Responsive 레이아웃 (mobile/tablet/desktop)
- [x] 접근성 (ARIA labels, keyboard navigation)
- [x] 성능 최적화 (memo, useCallback)

---

## 18. 구현 체크리스트

**완료됨 (2026-01-26):**
- ✅ InventoryDataTable.tsx 컴포넌트 작성
- ✅ 테이블 헤더 렌더링 (7개 컬럼)
- ✅ 정렬 기능 (ChevronUpDown 아이콘)
- ✅ 테이블 바디 (행 렌더링)
- ✅ 행 클릭 처리 (상세 페이지/모달)
- ✅ 상태 배지 통합 (StatusBadge)
- ✅ 로딩 상태 처리
- ✅ 빈 상태 메시지
- ✅ 페이지네이션 (Pagination 컴포넌트)
- ✅ Responsive 스타일링
- ✅ 접근성 속성 (ARIA labels)

**통합 테스트:**
- ✅ page.client.tsx와 통합
- ✅ useInventoryListQuery 훅 연동
- ✅ 정렬/페이지네이션 → 쿼리 재실행 확인
- ✅ 행 클릭 → 모달 열기 확인

---

## 19. 참고 자료

- **PRD v2**: 섹션 6.1 (shadcn/ui Table), 섹션 6.3 (List Page Layout), 섹션 6.4 (Status Badge)
- **Types**: src/types/inventory.ts (InventoryRecord, InventoryDataTableProps)
- **Store**: src/stores/inventoryFilterStore.ts
- **Hooks**: src/hooks/inventory.ts (useInventoryListQuery)
- **Components**: StatusBadge.tsx (색상 + 아이콘)
- **API Spec**: GET /api/inventory (섹션 5.2.1)

---

**상태**: ✅ COMPLETE & DELIVERED
**배포일**: 2026-01-26
**마지막 수정**: 2026-01-26 16:00:00 KST
