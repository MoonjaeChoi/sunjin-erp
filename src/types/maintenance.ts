// Generated: 2026-01-27 00:20:00 KST

/**
 * Maintenance Contract Management - TypeScript Types
 *
 * 유지보수 계약 관리 모듈의 모든 타입 정의
 * - API Request/Response 타입
 * - Form 데이터 타입
 * - Filter 타입
 * - Enum 타입
 */

// ============================================================================
// Enum & Literal Types
// ============================================================================

export type ContractStatus = '활성' | '종료' | '갱신예정';
export type ChangeType = '갱신' | '상태변경' | '정보수정';

export enum ContractStatusEnum {
  ACTIVE = '활성',
  TERMINATED = '종료',
  RENEWAL_PENDING = '갱신예정',
}

export enum ChangeTypeEnum {
  RENEWAL = '갱신',
  STATUS_CHANGE = '상태변경',
  INFO_UPDATE = '정보수정',
}

export const ContractStatusLabel: Record<ContractStatus, string> = {
  '활성': '활성',
  '종료': '종료',
  '갱신예정': '갱신예정',
};

export const ChangeTypeLabel: Record<ChangeType, string> = {
  '갱신': '갱신',
  '상태변경': '상태변경',
  '정보수정': '정보수정',
};

// ============================================================================
// Base Entity Types
// ============================================================================

/**
 * 고객사 참조 정보
 */
export interface CustomerRef {
  id: number;
  name: string;
  category?: string;
}

/**
 * 직원 참조 정보
 */
export interface EmployeeRef {
  id: number;
  name: string;
  department?: string;
}

/**
 * 유지보수 계약 기본 정보
 */
export interface MaintenanceContract {
  id: number;
  contract_name: string;
  contract_type: string;
  start_date: Date | string;
  end_date: Date | string;
  contract_status: ContractStatus;
  contract_amount: number | null;
  customer_id: number;
  assigned_employee_id: number;
  notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

/**
 * 유지보수 계약 상세 정보 (관계 데이터 포함)
 */
export interface MaintenanceContractDetail extends MaintenanceContract {
  customer: CustomerRef;
  assignedEmployee: EmployeeRef;
  createdBy: EmployeeRef;
  updatedBy?: EmployeeRef;
  attachments?: MaintenanceContractAttachment[];
  histories?: MaintenanceContractHistory[];
}

/**
 * 계약 첨부파일
 */
export interface MaintenanceContractAttachment {
  id: number;
  maintenance_contract_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by_id: number;
  uploadedBy?: EmployeeRef;
  created_at: Date | string;
  deleted_at: Date | string | null;
}

/**
 * 계약 변경 이력
 */
export interface MaintenanceContractHistory {
  id: number;
  maintenance_contract_id: number;
  change_type: ChangeType;
  previous_end_date?: Date | string | null;
  new_end_date?: Date | string | null;
  reason?: string;
  changed_by_id: number;
  changed_by: EmployeeRef;
  changed_at: Date | string;
  deleted_at: Date | string | null;
}

// ============================================================================
// API Request Types
// ============================================================================

/**
 * 계약 생성 요청
 */
export interface CreateMaintenanceContractRequest {
  customer_id: number;
  contract_name: string;
  contract_type: string;
  start_date: Date | string;
  end_date: Date | string;
  assigned_employee_id: number;
  contract_amount?: number | null;
  notes?: string | null;
}

/**
 * 계약 수정 요청
 */
export interface UpdateMaintenanceContractRequest {
  contract_name?: string;
  end_date?: Date | string;
  contract_amount?: number | null;
  assigned_employee_id?: number;
  contract_status?: ContractStatus;
  notes?: string | null;
}

/**
 * 계약 상태 변경 요청
 */
export interface ChangeStatusRequest {
  status: ContractStatus;
  reason: string;
}

/**
 * 파일 업로드 요청 (FormData)
 */
export interface AttachmentUploadRequest {
  file: File;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * 목록 조회 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 단일 데이터 응답
 */
export interface SingleResponse<T> {
  data: T;
  message?: string;
}

/**
 * 메시지 응답
 */
export interface MessageResponse {
  message: string;
}

/**
 * 에러 응답
 */
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * 계약 목록 조회 응답
 */
export type ContractListResponse = PaginatedResponse<MaintenanceContractDetail>;

/**
 * 계약 상세 조회 응답
 */
export type ContractDetailResponse = SingleResponse<MaintenanceContractDetail>;

/**
 * 첨부파일 목록 조회 응답
 */
export type AttachmentListResponse = PaginatedResponse<MaintenanceContractAttachment>;

/**
 * 첨부파일 업로드 응답
 */
export interface AttachmentUploadResponse {
  id: number;
  file_name: string;
  file_size: number;
  created_at: Date | string;
  message: string;
}

/**
 * 변경 이력 목록 조회 응답
 */
export type HistoryListResponse = PaginatedResponse<MaintenanceContractHistory>;

/**
 * 통계 응답
 */
export interface ContractStatsResponse {
  data: {
    byStatus: Record<ContractStatus, number>;
    expiringIn30Days: number;
    expiringIn60Days: number;
    total: number;
  };
}

// ============================================================================
// Form & UI Types
// ============================================================================

/**
 * 계약 폼 데이터
 */
export interface MaintenanceContractFormData {
  customer_id: number;
  contract_name: string;
  contract_type: string;
  start_date: Date | string;
  end_date: Date | string;
  assigned_employee_id: number;
  contract_amount: number | null;
  notes: string | null;
}

/**
 * 생성 폼 데이터
 */
export type CreateFormData = MaintenanceContractFormData;

/**
 * 수정 폼 데이터
 */
export type UpdateFormData = Partial<MaintenanceContractFormData>;

/**
 * 상태 변경 폼 데이터
 */
export interface StatusChangeFormData {
  status: ContractStatus;
  reason: string;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

/**
 * 계약 목록 필터
 */
export interface ContractFilters {
  status?: ContractStatus;
  customerId?: number;
  assignedEmployeeId?: number;
  contractNameSearch?: string;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
}

/**
 * 정렬 옵션
 */
export type SortField = 'mc.created_at' | 'mc.end_date' | 'mc.contract_name' | 'customer.name' | 'mc.contract_status';
export type SortOrder = 'ASC' | 'DESC';

/**
 * 쿼리 파라미터
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: SortField;
  order?: SortOrder;
}

/**
 * 목록 조회 쿼리 옵션
 */
export interface ListQueryOptions extends QueryParams {
  filters?: ContractFilters;
}

// ============================================================================
// UI Component Types
// ============================================================================

/**
 * 상태 배지 속성
 */
export interface StatusBadgeProps {
  status: ContractStatus;
  label: string;
  color: 'default' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
}

/**
 * 만료 경고 속성
 */
export interface ExpiryWarningProps {
  endDate: Date | string;
  daysUntilExpiry: number;
  level: 'safe' | 'soon' | 'warning' | 'danger';
  message: string;
}

/**
 * 파일 업로드 상태
 */
export interface FileUploadState {
  uploading: boolean;
  progress: number;
  error?: Error;
  success?: boolean;
}

/**
 * 테이블 행 액션
 */
export interface RowAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * useMaintenanceContractList 반환 타입
 */
export interface UseMaintenanceContractListReturn {
  contracts: MaintenanceContractDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useMaintenanceContractDetail 반환 타입
 */
export interface UseMaintenanceContractDetailReturn {
  contract: MaintenanceContractDetail | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useMaintenanceContractStats 반환 타입
 */
export interface UseMaintenanceContractStatsReturn {
  stats: ContractStatsResponse['data'] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * 뮤테이션 반환 타입
 */
export interface UseMutationReturn<TData = any, TError = any> {
  mutate: (variables: any) => void;
  mutateAsync: (variables: any) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: TError | null;
  data: TData | null;
  reset: () => void;
}

/**
 * useMaintenanceContractMutations 반환 타입
 */
export interface UseMaintenanceContractMutationsReturn {
  createMutation: UseMutationReturn<MaintenanceContractDetail>;
  updateMutation: UseMutationReturn<MaintenanceContractDetail>;
  deleteMutation: UseMutationReturn<void>;
  changeStatusMutation: UseMutationReturn<MaintenanceContractDetail>;
  uploadAttachmentMutation: UseMutationReturn<AttachmentUploadResponse>;
  deleteAttachmentMutation: UseMutationReturn<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  details?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 양식 에러
 */
export interface FormError {
  field: string;
  message: string;
}

/**
 * 비동기 작업 상태
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
