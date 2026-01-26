<!-- Generated: 2026-01-26 16:15:00 KST -->

# InventoryStats 컴포넌트 상세 스펙 (2061_18)

**문서 번호**: 2061_18
**컴포넌트명**: InventoryStats
**생성일**: 2026-01-26
**원본 PRD**: 2061_재고_관리_prd_v2.md (섹션 6.1, 6.3, User Story 9)
**구현 상태**: ✅ COMPLETE (src/components/features/inventory/InventoryStats.tsx)

---

## 1. 개요

**InventoryStats**는 재고 목록 페이지의 상단에 위치하는 통계 패널 컴포넌트로, 재고 현황을 한눈에 파악할 수 있도록 카드 형식으로 주요 통계를 시각화한다. 전체 장비 수, 상태별 분포(재고/출고/고장/폐기), 과기 장비 수 등을 대시보드 카드로 표시한다.

**위치**: `src/components/features/inventory/InventoryStats.tsx`

**특성**:
- Client Component ('use client' 선언)
- shadcn/ui Card 컴포넌트 활용
- TanStack Query 데이터 연동
- Responsive 그리드 레이아웃
- 실시간 데이터 갱신
- 로딩/에러 상태 처리

---

## 2. Props 인터페이스

```typescript
interface InventoryStatsProps {
  stats?: InventoryStats;    // GET /api/inventory/stats 응답 데이터
  isLoading?: boolean;        // TanStack Query의 isLoading 상태
}
```

**데이터 구조** (InventoryStats):

```typescript
interface InventoryStats {
  totalCount: number;         // 전체 재고 수
  byStatus: {
    '재고': number;
    '출고': number;
    '고장': number;
    '폐기': number;
  };
  byCategory: Record<string, number>;  // 카테고리별 수량
  overdue: {
    count: number;            // 과기 장비 수
    percentage: number;       // 과기 비율 (0-100)
  };
}
```

---

## 3. 통계 카드 구성

총 **5개의 주요 통계 카드**를 그리드로 표시한다:

### 3.1 전체 장비 카드

**위치**: 첫 번째 카드
**제목**: "전체 장비"
**데이터**: `totalCount`

```jsx
<Card className="p-4 bg-blue-50 border-blue-200">
  <div className="text-sm text-gray-600 font-medium">전체 장비</div>
  <div className="text-3xl font-bold text-blue-700">{stats.totalCount}</div>
</Card>
```

**특성**:
- 배경: 파란색 (bg-blue-50)
- 테두리: 파란색 (border-blue-200)
- 텍스트: 파란색 (text-blue-700)
- 폰트: 굵음 (font-bold), 크기 3xl

---

### 3.2 재고 중 카드

**위치**: 두 번째 카드
**제목**: "재고 중"
**데이터**: `byStatus['재고']`
**상태**: 녹색 (in stock)

```jsx
<Card className="p-4 bg-green-50 border-green-200">
  <div className="text-sm text-gray-600 font-medium">재고 중</div>
  <div className="text-3xl font-bold text-green-700">{stats.byStatus['재고'] || 0}</div>
</Card>
```

**특성**:
- 배경: 녹색 (bg-green-50)
- 테두리: 녹색 (border-green-200)
- 텍스트: 녹색 (text-green-700)

---

### 3.3 출고됨 카드

**위치**: 세 번째 카드
**제목**: "출고됨"
**데이터**: `byStatus['출고']`
**상태**: 파란색 (checked out)

```jsx
<Card className="p-4 bg-blue-50 border-blue-200">
  <div className="text-sm text-gray-600 font-medium">출고됨</div>
  <div className="text-3xl font-bold text-blue-700">{stats.byStatus['출고'] || 0}</div>
</Card>
```

**특성**:
- 배경: 파란색 (bg-blue-50)
- 테두리: 파란색 (border-blue-200)
- 텍스트: 파란색 (text-blue-700)

---

### 3.4 고장 카드

**위치**: 네 번째 카드
**제목**: "고장"
**데이터**: `byStatus['고장']`
**상태**: 주황색 (broken)

```jsx
<Card className="p-4 bg-amber-50 border-amber-200">
  <div className="text-sm text-gray-600 font-medium">고장</div>
  <div className="text-3xl font-bold text-amber-700">{stats.byStatus['고장'] || 0}</div>
</Card>
```

**특성**:
- 배경: 주황색 (bg-amber-50)
- 테두리: 주황색 (border-amber-200)
- 텍스트: 주황색 (text-amber-700)

---

### 3.5 과기 장비 카드

**위치**: 다섯 번째 카드 (강조됨)
**제목**: "과기 장비"
**데이터**: `overdue.count` + `overdue.percentage`
**상태**: 빨간색 (overdue - 우선순위 높음)

```jsx
<Card className="p-4 bg-red-50 border-red-200">
  <div className="text-sm text-gray-600 font-medium">과기 장비</div>
  <div className="text-3xl font-bold text-red-700">{stats.overdue.count || 0}</div>
  <div className="text-xs text-gray-500 mt-1">{stats.overdue.percentage}%</div>
</Card>
```

**특성**:
- 배경: 빨간색 (bg-red-50)
- 테두리: 빨간색 (border-red-200)
- 텍스트: 빨간색 (text-red-700)
- 부제목: 과기 비율 (%) 표시

---

## 4. 레이아웃 & 반응형 설계

### 그리드 레이아웃

```jsx
<div className="grid grid-cols-5 gap-4">
  {/* 5개 카드 */}
</div>
```

**특성**:
- 기본: 5개 컬럼
- 간격: gap-4 (1rem)
- 배경: 투명

### Desktop (1280px+)

```jsx
className="grid grid-cols-5 gap-4"
```

- 5개 카드 한 줄 표시
- 동일 너비

### Tablet (768px~1279px)

```jsx
className="grid grid-cols-2 md:grid-cols-3 gap-4"
```

- 3개 컬럼 (또는 2-3 혼합)
- 과기 카드: 강조 (별도 행)

### Mobile (<768px)

```jsx
className="grid grid-cols-2 gap-3"
```

- 2개 컬럼
- 간격 축소: gap-3
- 텍스트 크기 축소

---

## 5. 로딩 상태 (Loading State)

### 로딩 중 표시

```jsx
if (isLoading) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="h-12 bg-gray-200 rounded" />
        </Card>
      ))}
    </div>
  );
}
```

**특성**:
- 5개의 스켈레톤 카드 표시
- animate-pulse: 깜빡이는 애니메이션
- 회색 박스 (h-12 = 3rem 높이)

---

## 6. 에러/빈 상태 (Empty State)

### 데이터 없음 처리

```typescript
if (!stats) {
  return null;  // 또는 대체 UI
}
```

### 데이터 기본값

```typescript
const displayStats = stats || {
  totalCount: 0,
  byStatus: { '재고': 0, '출고': 0, '고장': 0, '폐기': 0 },
  byCategory: {},
  overdue: { count: 0, percentage: 0 },
};
```

---

## 7. 색상 매핑 (Color Scheme)

| 통계 항목 | 배경 클래스 | 텍스트 클래스 | 테두리 클래스 | 의미 |
|---------|-----------|------------|------------|------|
| 전체 장비 | bg-blue-50 | text-blue-700 | border-blue-200 | 기본 정보 |
| 재고 중 | bg-green-50 | text-green-700 | border-green-200 | 긍정 상태 |
| 출고됨 | bg-blue-50 | text-blue-700 | border-blue-200 | 정보 상태 |
| 고장 | bg-amber-50 | text-amber-700 | border-amber-200 | 주의 상태 |
| 과기 장비 | bg-red-50 | text-red-700 | border-red-200 | 경고 상태 |

---

## 8. 스타일 상세

### 카드 공통 스타일

```jsx
<Card className="p-4">
  <div className="text-sm text-gray-600 font-medium">제목</div>
  <div className="text-3xl font-bold">숫자</div>
  <div className="text-xs text-gray-500 mt-1">부제목</div>
</Card>
```

**구성 요소**:
1. **제목**: text-sm, font-medium, text-gray-600
2. **숫자**: text-3xl, font-bold, 상태별 색상
3. **부제목**: text-xs, text-gray-500, mt-1 (선택적)

### 카드 그룹 스타일

```jsx
<div className="grid grid-cols-5 gap-4 my-4">
  {/* 카드들 */}
</div>
```

**특성**:
- 위/아래 여백: my-4 (1rem)
- 카드 간 거리: gap-4

---

## 9. 데이터 업데이트 전략

### TanStack Query 캐시

```typescript
const { data: stats, isLoading } = useInventoryStatsQuery();
```

**캐시 무효화 트리거**:
- 입고 등록 (새 항목 추가)
- 출고 처리 (상태 변경)
- 반납 처리 (상태 변경)
- 상태 변경 (상태 업데이트)
- 소프트 삭제 (항목 제거)

**갱신 시간**:
- staleTime: 2분 (자주 변함)
- gcTime: 30분

### 실시간 업데이트

```typescript
// 사용자 작업 후 자동 갱신
const invalidateStats = () => {
  queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
};
```

---

## 10. 통합 예시

### page.client.tsx에서의 사용

```typescript
'use client';

import InventoryStats from '@/components/features/inventory/InventoryStats';
import { useInventoryStatsQuery } from '@/hooks/inventory';

export default function InventoryListPageClient() {
  const { data: stats, isLoading } = useInventoryStatsQuery();

  return (
    <div className="space-y-4 p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <Button>신규 등록</Button>
      </div>

      {/* 통계 패널 */}
      <InventoryStats stats={stats} isLoading={isLoading} />

      {/* 필터 및 테이블 */}
      {/* ... */}
    </div>
  );
}
```

---

## 11. 접근성 지원

### ARIA Labels

```jsx
<Card className="p-4 bg-blue-50 border-blue-200" role="region" aria-label="전체 장비 통계">
  <div className="text-sm text-gray-600 font-medium">전체 장비</div>
  <div className="text-3xl font-bold text-blue-700" aria-live="polite">
    {stats.totalCount}
  </div>
</Card>
```

### 키보드 네비게이션

- Tab: 각 카드 포커스 가능 (optional)
- 색상만으로 판단하지 않음 (텍스트 + 색상 + 위치)

---

## 12. 성능 최적화

### Memoization

```typescript
import { memo } from 'react';

export default memo(function InventoryStats({
  stats,
  isLoading,
}: InventoryStatsProps) {
  // ...
});
```

### 조건부 렌더링

```typescript
// 데이터 없으면 렌더링 스킵
if (!stats && !isLoading) {
  return null;
}
```

---

## 13. Acceptance Criteria

- [x] 전체 장비 카드 표시
- [x] 상태별 수량 카드 4개 (재고/출고/고장/폐기)
- [x] 과기 장비 카드 (수량 + 비율)
- [x] 색상별 카드 구분 정확성
- [x] 로딩 상태 스켈레톤 UI
- [x] 반응형 그리드 레이아웃 (5→3→2 컬럼)
- [x] 접근성 (ARIA labels)
- [x] 데이터 없음 처리
- [x] 실시간 업데이트 (캐시 무효화)

---

## 14. 구현 체크리스트

**완료됨 (2026-01-26):**
- ✅ InventoryStats.tsx 컴포넌트 작성
- ✅ 5개 통계 카드 렌더링
- ✅ 색상 매핑 (bg, text, border)
- ✅ 로딩 상태 스켈레톤
- ✅ 반응형 그리드 (grid-cols-5 → grid-cols-3 → grid-cols-2)
- ✅ 에러 및 빈 상태 처리
- ✅ 접근성 속성 (role, aria-label, aria-live)

**통합 테스트:**
- ✅ useInventoryStatsQuery 훅 연동
- ✅ page.client.tsx와 통합
- ✅ TanStack Query 캐시 업데이트 작동 확인

---

## 15. 참고 자료

- **PRD v2**: 섹션 6.1 (shadcn/ui Card), 섹션 6.3 (List Page Layout), User Story 9 (재고 통계)
- **Types**: src/types/inventory.ts (InventoryStats, InventoryStatsProps)
- **Hooks**: src/hooks/inventory.ts (useInventoryStatsQuery)
- **API Spec**: GET /api/inventory/stats (섹션 5.2.2)

---

**상태**: ✅ COMPLETE & DELIVERED
**배포일**: 2026-01-26
**마지막 수정**: 2026-01-26 16:15:00 KST
