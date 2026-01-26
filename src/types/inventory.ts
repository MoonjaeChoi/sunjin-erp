// Generated: 2026-01-26 13:00:00 KST

export type InventoryStatus = '재고' | '출고' | '고장' | '폐기';
export type ChangeType = '입고' | '출고' | '반납' | '위치변경' | '상태변경';

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
