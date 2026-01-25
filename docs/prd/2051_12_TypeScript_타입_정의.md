<!-- Generated: 2026-01-25 21:30:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2051_12
**원본 PRD**: 2051_재고_관리_prd_v2.md (Section 8.1)
**구현 범위**: `src/types/inventory.ts`
**복잡도**: S
**의존성**: 2051_03~11 (API 정의)

---

## 구현 목표

재고 관리 모듈에서 사용되는 모든 TypeScript 타입, 인터페이스, 상수를 하나의 파일에 정의한다. API 요청/응답, 컴포넌트 props, TanStack Query hooks에서 공통으로 참조하는 타입 시스템을 구축한다.

---

## 구현 내용

### 파일 구조

```
src/types/
└── inventory.ts          # 재고 관리 모듈 타입 정의
```

### 구현 상세

```typescript
// src/types/inventory.ts

// ============= Union Types =============

export type InventoryStatus = '재고' | '출고' | '고장' | '폐기';
export type ChangeType = '입고' | '출고' | '반납' | '위치변경' | '상태변경';

// ============= 한글 라벨 맵 =============

export const InventoryStatusLabel: Record<InventoryStatus, string> = {
  '재고': '재고',
  '출고': '출고',
  '고장': '고장',
  '폐기': '폐기',
};

export const ChangeTypeLabel: Record<ChangeType, string> = {
  '입고': '입고',
  '출고': '출고',
  '반납': '반납',
  '위치변경': '위치 변경',
  '상태변경': '상태 변경',
};

// ============= 상태별 색상 (UI) =============

export const InventoryStatusColor: Record<
  InventoryStatus,
  { bg: string; text: string; badge: string }
> = {
  '재고': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  '출고': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  '고장': { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
  '폐기': { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' },
};

// ============= 카테고리 목록 =============

export const INVENTORY_CATEGORIES = [
  '모니터',
  '노트북',
  '라우터',
  '프린터',
  '기타',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

// ============= 목록 아이템 인터페이스 =============

export interface InventoryListItem {
  id: number;
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string;        // ISO 8601 date
  purchase_from: string;
  current_location: string;
  current_status: InventoryStatus;
  created_at: string;           // ISO 8601 timestamp
  updated_at: string;
}

// ============= 상세 인터페이스 =============

export interface InventoryDetail {
  id: number;
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_from: string;
  current_location: string;
  current_status: InventoryStatus;
  notes: string | null;
  created_by: {
    id: number;
    name: string;
  };
  updated_by: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  
  // 과기 판정
  overdue_days: number | null;
  is_overdue: boolean;
  
  // 이력
  histories: InventoryHistoryItem[];
}

export interface InventoryHistoryItem {
  id: number;
  change_type: ChangeType;
  previous_location: string | null;
  new_location: string | null;
  previous_status: InventoryStatus | null;
  new_status: InventoryStatus | null;
  checkout_location: string | null;
  expected_checkin_date: string | null;
  reason: string | null;
  changed_by: {
    id: number;
    name: string;
  };
  changed_at: string;
}

// ============= 필터 파라미터 =============

export interface InventorySearchParams {
  page: number;                 // 1-based, default 1
  pageSize: number;             // default 20, max 100
  categories?: string[];        // 다중 선택
  status?: InventoryStatus[];   // 다중 선택
  location?: string;            // 자유 텍스트 검색
  search?: string;              // 시리얼번호, 모델명 접두사
  sortBy?: string;              // 정렬 컬럼
  order?: 'asc' | 'desc';       // 정렬 순서
}

// ============= 목록 응답 =============

export interface InventoryListResponse {
  data: InventoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  _links: {
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

// ============= 요청 인터페이스 =============

export interface CreateInventoryRequest {
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string;        // ISO 8601 date
  purchase_from: string;
  current_location: string;
  notes?: string;
}

export interface CheckoutRequest {
  checkout_location: string;
  checked_out_by: string;
  expected_checkin_date?: string;
}

export interface CheckinRequest {
  checkin_location: string;
  checked_in_by: string;
}

export interface RelocateRequest {
  new_location: string;
  reason?: string;
}

export interface StatusChangeRequest {
  new_status: '고장' | '폐기';
  reason: string;
}

// ============= 통계 =============

export interface InventoryStatistics {
  total: number;
  byStatus: Record<InventoryStatus, number>;
  byCategory: {
    category: string;
    total: number;
    statuses: Record<InventoryStatus, number>;
  }[];
  updated_at: string;
}

// ============= 필터 상태 =============

export interface InventoryFilters {
  categories: string[];
  statuses: InventoryStatus[];
  location: string;
  search: string;
  sortBy: string;
  order: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

// ============= 헬퍼 함수 =============

export function getStatusBadgeColor(status: InventoryStatus) {
  return InventoryStatusColor[status];
}

export function getStatusLabel(status: InventoryStatus): string {
  return InventoryStatusLabel[status];
}

export function getChangeTypeLabel(changeType: ChangeType): string {
  return ChangeTypeLabel[changeType];
}

// 과기 표시 텍스트
export function getOverdueText(overdue_days: number | null, is_overdue: boolean): string {
  if (!is_overdue || overdue_days === null) return '';
  return `과기 (${overdue_days}일)`;
}
```

---

## Acceptance Criteria

- [ ] `src/types/inventory.ts` 파일 생성
- [ ] InventoryStatus, ChangeType union type 정의
- [ ] INVENTORY_CATEGORIES 상수 정의
- [ ] InventoryStatusLabel, ChangeTypeLabel 라벨 맵
- [ ] InventoryStatusColor UI 색상 맵
- [ ] InventoryListItem 인터페이스
- [ ] InventoryDetail, InventoryHistoryItem 인터페이스
- [ ] InventorySearchParams, InventoryListResponse 인터페이스
- [ ] CreateInventoryRequest, CheckoutRequest, CheckinRequest, RelocateRequest, StatusChangeRequest 인터페이스
- [ ] InventoryStatistics 인터페이스
- [ ] InventoryFilters 인터페이스
- [ ] 헬퍼 함수 (getStatusBadgeColor, getStatusLabel, 등)
- [ ] TypeScript 컴파일 에러 없음 (`npm run type-check`)

---

**다음 문서**: 2051_13_Inventory_Service.md
