// Generated: 2026-01-25 18:05:00 KST

/**
 * Domain Types
 */

export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE' | null;
export type IssueHistoryChangeType =
  | 'STATUS_CHANGE'
  | 'ASSIGNEE_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'STATUS_ROLLBACK'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'COMMENT_ADDED';

/**
 * Entity Types
 */

export interface Employee {
  id: number;
  name: string;
  email?: string;
  department_id: number;
}

export interface Customer {
  id: number;
  name: string;
}

export interface Issue {
  id: number;
  customer_id: number;
  customer?: Customer;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  is_public: number; // 0 or 1
  created_by_id: number;
  created_by?: Employee;
  assigned_to_id: number | null;
  assigned_to?: Employee | null;
  treatment_method: TreatmentMethod;
  treatment_time_minutes: number | null;
  treatment_result: string | null;
  created_at: string | Date;
  completed_at: string | Date | null;
  updated_at: string | Date;
  deleted_at: string | Date | null;
}

export interface IssueAttachment {
  id: number;
  issue_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by_id: number;
  uploaded_by?: Employee;
  created_at: string | Date;
  deleted_at: string | Date | null;
}

export interface IssueHistory {
  id: number;
  issue_id: number;
  change_type: IssueHistoryChangeType;
  old_value: string | null;
  new_value: string | null;
  changed_by_id: number;
  changed_by?: Employee;
  changed_at: string | Date;
  remark: string | null;
}

/**
 * API Request/Response Types
 */

// Create Issue
export interface CreateIssueRequest {
  customer_id: number;
  title: string;
  severity: IssueSeverity;
  description: string;
  assigned_to_id?: number;
  treatment_method?: TreatmentMethod;
  treatment_time_minutes?: number;
  treatment_result?: string;
}

export interface CreateIssueResponse {
  message: string;
  data: Partial<Issue>;
}

// Get Issue List
export interface IssueListQueryParams {
  page?: number;
  page_size?: number;
  customer_id?: number;
  status?: string; // 'INTAKE,IN_PROGRESS,COMPLETED'
  severity?: string; // 'CRITICAL,HIGH,MEDIUM,LOW'
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  keyword?: string;
  sort_by?: 'created_at' | 'status' | 'severity' | 'assigned_to_id';
  sort_order?: 'ASC' | 'DESC';
}

export interface IssueListResponse {
  data: Issue[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

// Get Issue Detail
export interface IssueDetailResponse {
  data: Issue & {
    attachments: IssueAttachment[];
    histories: IssueHistory[];
  };
}

// Update Issue
export interface UpdateIssueRequest {
  status?: IssueStatus;
  assigned_to_id?: number | null;
  severity?: IssueSeverity;
  is_public?: number;
  treatment_method?: TreatmentMethod;
  treatment_time_minutes?: number;
  treatment_result?: string;
}

export interface UpdateIssueResponse {
  message: string;
  data: Partial<Issue>;
}

// Delete Issue
export interface DeleteIssueResponse {
  message: string;
  data: {
    id: number;
    deleted_at: string | Date;
  };
}

export interface DeleteConflictResponse {
  message: string;
  error_code: 'ATTACHMENTS_EXIST';
  attachments_count: number;
}

// Rollback Status
export interface RollbackStatusRequest {
  // No request body
}

export interface RollbackStatusResponse {
  message: string;
  data: {
    id: number;
    status: IssueStatus;
    completed_at: null;
  };
}

// Upload Attachment
export interface UploadAttachmentResponse {
  message: string;
  data: {
    id: number;
    file_name: string;
    file_size: number;
    created_at: string | Date;
  };
}

export interface UploadAttachmentError {
  message: string;
  error_code:
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FILE_TYPE'
    | 'UNSUPPORTED_EXTENSION'
    | 'MAX_FILES_EXCEEDED';
  file_size?: number;
  mime_type?: string;
  extension?: string;
}

// Delete Attachment
export interface DeleteAttachmentResponse {
  message: string;
  data: {
    id: number;
    deleted_at: string | Date;
  };
}

// Issue Summary
export interface IssueSummaryQueryParams {
  customer_id?: number;
  severity?: string;
}

export interface IssueSummaryResponse {
  data: {
    total: number;
    intake: number;
    in_progress: number;
    completed: number;
  };
}

/**
 * Common API Response
 */

export interface ApiError {
  message: string;
  error_code?: string;
  errors?: Record<string, string>;
}

/**
 * Filter & Pagination Types
 */

export interface IssueFilters {
  customer_id?: number;
  status?: IssueStatus[];
  severity?: IssueSeverity[];
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string;
  date_to?: string;
  keyword?: string;
}

export interface SortOptions {
  sort_by: 'created_at' | 'status' | 'severity' | 'assigned_to_id';
  sort_order: 'ASC' | 'DESC';
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

/**
 * Utility Functions for Formatting
 */

/**
 * 처리 시간 포맷팅 (분 → "X시간 Y분" 형식)
 * @example
 * formatTreatmentTime(150) // "약 2시간 30분"
 * formatTreatmentTime(60)  // "약 1시간"
 * formatTreatmentTime(45)  // "약 45분"
 */
export function formatTreatmentTime(
  minutes: number | null | undefined
): string {
  if (minutes === null || minutes === undefined || minutes === 0) {
    return '-';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `약 ${mins}분`;
  } else if (mins === 0) {
    return `약 ${hours}시간`;
  } else {
    return `약 ${hours}시간 ${mins}분`;
  }
}

/**
 * 상태 한글 이름
 */
export function getStatusLabel(status: IssueStatus): string {
  const labels: Record<IssueStatus, string> = {
    INTAKE: '접수',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
  };
  return labels[status] || status;
}

/**
 * 심각도 한글 이름
 */
export function getSeverityLabel(severity: IssueSeverity): string {
  const labels: Record<IssueSeverity, string> = {
    CRITICAL: '심각',
    HIGH: '높음',
    MEDIUM: '보통',
    LOW: '낮음',
  };
  return labels[severity] || severity;
}

/**
 * 처리 방법 한글 이름
 */
export function getTreatmentMethodLabel(method: TreatmentMethod): string {
  const labels: Record<string, string> = {
    REMOTE: '원격 지원',
    PHONE: '전화 지원',
    ONSITE: '현장 방문',
  };
  return labels[method || ''] || '-';
}
