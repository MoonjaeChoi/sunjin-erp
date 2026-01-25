// Generated: 2026-01-25 21:55:00 KST

// === Enum Types ===

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'INTAKE' | 'IN_PROGRESS' | 'COMPLETED';
export type TreatmentMethod = 'REMOTE' | 'PHONE' | 'ONSITE';
export type HistoryChangeType =
  | 'STATUS_CHANGE'
  | 'ASSIGNEE_CHANGE'
  | 'SEVERITY_CHANGE'
  | 'STATUS_ROLLBACK'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'IS_PUBLIC_CHANGE';

// === Enum Labels ===

export const SeverityLabel: Record<IssueSeverity, string> = {
  CRITICAL: '심각',
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
};

export const StatusLabel: Record<IssueStatus, string> = {
  INTAKE: '접수',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
};

export const TreatmentMethodLabel: Record<TreatmentMethod, string> = {
  REMOTE: '원격 지원',
  PHONE: '전화 지원',
  ONSITE: '현장 방문',
};

// === Enum Options (Select용) ===

export const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: '심각' },
  { value: 'HIGH', label: '높음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'LOW', label: '낮음' },
];

export const STATUS_OPTIONS = [
  { value: 'INTAKE', label: '접수' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'COMPLETED', label: '완료' },
];

export const TREATMENT_METHOD_OPTIONS = [
  { value: 'REMOTE', label: '원격 지원' },
  { value: 'PHONE', label: '전화 지원' },
  { value: 'ONSITE', label: '현장 방문' },
];

// === Status Transition Matrix ===

export const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  INTAKE: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: ['IN_PROGRESS'], // ADMIN만 가능
};

export function isValidStatusTransition(
  from: IssueStatus,
  to: IssueStatus,
  role: string
): boolean {
  if (role === 'ADMIN') return true;
  if (from === to) return true;
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// === API Request/Response Types ===

export interface IssueListParams {
  page?: number;
  page_size?: number;
  customer_id?: number;
  status?: string;
  severity?: string;
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string;
  date_to?: string;
  keyword?: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface IssueRecord {
  id: number;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  is_public: number;
  customer_id: number;
  customer_name?: string;
  created_by_id: number;
  created_by_name?: string;
  assigned_to_id: number | null;
  assigned_to_name?: string;
  treatment_method: TreatmentMethod | null;
  treatment_time_minutes: number | null;
  treatment_result: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Issue extends IssueRecord {
  customer?: {
    id: number;
    name: string;
  } | null;
  created_by?: {
    id: number;
    name: string;
  } | null;
  assigned_to?: {
    id: number;
    name: string;
    department_id: number | null;
  } | null;
  attachments?: IssueAttachmentRecord[];
  histories?: IssueHistoryRecord[];
}

export interface IssueListResponse {
  data: IssueRecord[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateIssueRequest {
  customer_id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  assigned_to_id?: number;
  treatment_method?: TreatmentMethod;
  treatment_time_minutes?: number;
  treatment_result?: string;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  severity?: IssueSeverity;
  status?: IssueStatus;
  assigned_to_id?: number | null;
  is_public?: number;
  treatment_method?: TreatmentMethod | null;
  treatment_time_minutes?: number | null;
  treatment_result?: string | null;
}

export interface IssueDetailResponse {
  data: {
    id: number;
    title: string;
    description: string;
    severity: IssueSeverity;
    status: IssueStatus;
    is_public: number;
    customer_id: number;
    customer: {
      id: number;
      name: string;
    } | null;
    created_by_id: number;
    created_by: {
      id: number;
      name: string;
    } | null;
    assigned_to_id: number | null;
    assigned_to: {
      id: number;
      name: string;
      department_id: number | null;
    } | null;
    treatment_method: TreatmentMethod | null;
    treatment_time_minutes: number | null;
    treatment_result: string | null;
    created_at: Date;
    completed_at: Date | null;
    updated_at: Date;
    attachments: IssueAttachmentRecord[];
    histories: IssueHistoryRecord[];
  };
}

export interface IssueSummaryResponse {
  data: {
    total: number;
    intake: number;
    in_progress: number;
    completed: number;
  };
}

export interface IssueHistoryRecord {
  id: number;
  issue_id: number;
  change_type: HistoryChangeType;
  old_value: string | null;
  new_value: string | null;
  changed_by_id: number;
  changed_by_name?: string;
  changed_by?: {
    id: number;
    name: string;
  } | null;
  changed_at: Date;
  remark: string | null;
}

export interface IssueAttachmentRecord {
  id: number;
  issue_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by_id: number;
  uploaded_by_name?: string;
  created_at: Date;
}

// === Type Aliases ===

export type IssueHistory = IssueHistoryRecord;
export type IssueListQueryParams = IssueListParams;

export interface IssueSummaryQueryParams {
  customer_id?: number;
  status?: string;
  severity?: string;
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string;
  date_to?: string;
  keyword?: string;
}

// === Filter/Pagination/Sort Types ===

export interface IssueFilters {
  customer_id?: number;
  status?: string[];
  severity?: string[];
  assignee_id?: number;
  created_by_id?: number;
  date_from?: string;
  date_to?: string;
  keyword?: string;
}

export interface SortOptions {
  sort_by: string;
  sort_order: 'ASC' | 'DESC';
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

// === Helper Functions ===

export function getStatusLabel(status: IssueStatus): string {
  return StatusLabel[status] || status;
}

export function getSeverityLabel(severity: IssueSeverity): string {
  return SeverityLabel[severity] || severity;
}

export function getTreatmentMethodLabel(method: TreatmentMethod): string {
  return TreatmentMethodLabel[method] || method;
}

export function formatTreatmentTime(minutes: number | null): string {
  if (minutes === null) return '-';
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}시간`;
  return `${hours}시간 ${remainingMinutes}분`;
}
