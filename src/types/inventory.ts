// Generated: 2026-01-26 13:35:00 KST

export type InventoryStatus = '재고' | '출고' | '고장' | '폐기';
export type ChangeType = '입고' | '출고' | '반납' | '위치변경' | '상태변경';

// ============= UI Constants & Labels =============

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

// ============= UI Colors (Tailwind) =============

export const InventoryStatusColor: Record<
  InventoryStatus,
  { bg: string; text: string; badge: string }
> = {
  '재고': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  '출고': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  '고장': { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
  '폐기': { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100' },
};

// ============= Categories =============

export const INVENTORY_CATEGORIES = [
  '모니터',
  '노트북',
  '라우터',
  '프린터',
  '기타',
] as const;

export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

// Inventory 목록 조회 응답
export interface InventoryRecord {
  id: number;
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string; // ISO 8601 date (YYYY-MM-DD)
  purchase_from: string;
  current_location: string;
  current_status: InventoryStatus;
  created_at: string; // ISO 8601 timestamp
  updated_at: string;
}

// Inventory 상세 조회 응답
export interface InventoryDetail extends InventoryRecord {
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

// InventoryHistory 기록
export interface InventoryHistoryRecord {
  id: number;
  inventory_id: number;
  change_type: ChangeType;
  previous_location?: string | null;
  new_location?: string | null;
  previous_status?: InventoryStatus | null;
  new_status?: InventoryStatus | null;
  checkout_location?: string | null; // 논리적 사용처 (프로젝트, 사람)
  expected_checkin_date?: string | null; // ISO 8601 date
  reason?: string | null;
  changed_by: {
    id: number;
    name: string;
  };
  changed_at: string; // ISO 8601 timestamp
}

// 재고 목록 조회 응답
export interface InventoryListResponse {
  data: InventoryRecord[];
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

// 재고 통계 응답
export interface InventoryStats {
  totalCount: number;
  byStatus: Record<InventoryStatus, number>;
  byCategory: Record<string, number>;
  overdue: {
    count: number;
    percentage: number;
  };
  byLocation?: Record<string, number>;
}

// 재고 입고 요청
export interface CreateInventoryRequest {
  category: string;
  model: string;
  serial_number: string;
  purchase_date: string; // ISO 8601 date
  purchase_from: string;
  current_location: string;
  notes?: string;
}

// 재고 출고 요청
export interface CheckoutInventoryRequest {
  checkout_location: string; // 논리적 사용처
  expected_checkin_date?: string; // ISO 8601 date
  reason?: string;
}

// 재고 반납 요청
export interface CheckinInventoryRequest {
  current_location: string; // 반납 위치
  reason?: string;
}

// 재고 위치변경 요청
export interface RelocateInventoryRequest {
  current_location: string; // 새로운 물리적 위치
  reason?: string;
}

// 재고 상태변경 요청
export interface StatusChangeInventoryRequest {
  current_status: InventoryStatus;
  reason?: string;
}

// 재고 업데이트 요청
export interface UpdateInventoryRequest {
  category?: string;
  model?: string;
  purchase_from?: string;
  current_location?: string;
  notes?: string;
}

// Query parameters 파싱 결과
export interface InventoryQueryParams {
  page: number;
  pageSize: number;
  categories: string[];
  statuses: InventoryStatus[];
  location: string;
  search: string;
  sortBy: 'category' | 'model' | 'serialNumber' | 'location' | 'status' | 'purchaseDate';
  order: 'ASC' | 'DESC';
}

// ============= Component Props =============

export interface InventoryFiltersProps {
  categories?: string[];
  statuses?: InventoryStatus[];
  onCategoryChange: (categories: string[]) => void;
  onStatusChange: (statuses: InventoryStatus[]) => void;
  onSearchChange: (search: string) => void;
  onLocationChange: (location: string) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export interface InventoryDataTableProps {
  data: InventoryRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  onSort: (sortBy: string, order: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onRowClick: (id: number) => void;
}

export interface InventoryStatsProps {
  stats?: InventoryStats;
  isLoading?: boolean;
}

export interface StatusBadgeProps {
  status: InventoryStatus;
  size?: 'sm' | 'md' | 'lg';
}
