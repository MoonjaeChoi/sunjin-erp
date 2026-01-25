// Generated: 2026-01-25 14:45:00 KST

/**
 * Project Management Module - TypeScript Type Definitions
 * 프로젝트 관리 모듈 전체에서 사용되는 타입 및 상수 정의
 */

// ============================================================================
// 1. Union Types - 열거형 타입 정의
// ============================================================================

/**
 * 프로젝트 상태
 * - PREPARING: 준비 (초기 상태)
 * - IN_PROGRESS: 진행중
 * - COMPLETED: 완료
 * - ON_HOLD: 보류
 */
export type ProjectStatus = 'PREPARING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

/**
 * Sales Pipeline 8단계
 */
export type ProjectStage =
  | 'MEETING'
  | 'PROPOSAL'
  | 'QUOTATION'
  | 'CONTRACT'
  | 'KICKOFF'
  | 'DEVELOPMENT'
  | 'DELIVERY'
  | 'HANDOVER';

/**
 * 첨부파일 카테고리
 */
export type AttachmentCategory = 'CONTRACT' | 'PROPOSAL' | 'QUOTATION' | 'REPORT' | 'OTHER';

// ============================================================================
// 2. Label Records - 사용자 인터페이스용 한글 라벨
// ============================================================================

/**
 * 프로젝트 상태 한글 라벨
 */
export const ProjectStatusLabel: Record<ProjectStatus, string> = {
  PREPARING: '준비',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  ON_HOLD: '보류',
};

/**
 * Sales Pipeline 단계 한글 라벨
 */
export const ProjectStageLabel: Record<ProjectStage, string> = {
  MEETING: '회의',
  PROPOSAL: '제안',
  QUOTATION: '견적',
  CONTRACT: '계약',
  KICKOFF: '착수',
  DEVELOPMENT: '진행',
  DELIVERY: '납품',
  HANDOVER: '인수인계',
};

/**
 * 첨부파일 카테고리 한글 라벨
 */
export const AttachmentCategoryLabel: Record<AttachmentCategory, string> = {
  CONTRACT: '계약서',
  PROPOSAL: '제안서',
  QUOTATION: '견적서',
  REPORT: '보고서',
  OTHER: '기타',
};

// ============================================================================
// 3. Maps - 매핑 및 스타일 정의
// ============================================================================

/**
 * ProjectStage → Database 컬럼명 매핑
 * 체크리스트 상태 저장할 때 사용
 */
export const ProjectStageColumnMap: Record<ProjectStage, string> = {
  MEETING: 'stage_meeting_at',
  PROPOSAL: 'stage_proposal_at',
  QUOTATION: 'stage_quotation_at',
  CONTRACT: 'stage_contract_at',
  KICKOFF: 'stage_kickoff_at',
  DEVELOPMENT: 'stage_development_at',
  DELIVERY: 'stage_delivery_at',
  HANDOVER: 'stage_handover_at',
};

/**
 * 프로젝트 상태별 Tailwind CSS 색상
 * UI에서 Badge, 배경색 등에 사용
 */
export const ProjectStatusColor: Record<
  ProjectStatus,
  { bg: string; text: string; border?: string }
> = {
  PREPARING: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  ON_HOLD: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

/**
 * 첨부파일 카테고리별 Tailwind CSS 색상
 */
export const AttachmentCategoryColor: Record<
  AttachmentCategory,
  { bg: string; text: string }
> = {
  CONTRACT: { bg: 'bg-purple-100', text: 'text-purple-800' },
  PROPOSAL: { bg: 'bg-blue-100', text: 'text-blue-800' },
  QUOTATION: { bg: 'bg-amber-100', text: 'text-amber-800' },
  REPORT: { bg: 'bg-green-100', text: 'text-green-800' },
  OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

// ============================================================================
// 4. Constants - 상수
// ============================================================================

/**
 * Sales Pipeline 단계 순서 배열
 * UI 렌더링 및 하이라이트 계산에 사용
 */
export const PROJECT_STAGES_ORDER: ProjectStage[] = [
  'MEETING',
  'PROPOSAL',
  'QUOTATION',
  'CONTRACT',
  'KICKOFF',
  'DEVELOPMENT',
  'DELIVERY',
  'HANDOVER',
];

/**
 * 프로젝트 코드 형식 정규식
 * 형식: PJT-YYYYMMDD-NNN (예: PJT-20260125-001)
 */
export const PROJECT_CODE_REGEX = /^PJT-\d{8}-\d{3}$/;

/**
 * 파일 업로드 제약사항
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_EXTENSIONS: ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'],
} as const;

// ============================================================================
// 5. Interfaces - 데이터 인터페이스
// ============================================================================

/**
 * 프로젝트 목록 테이블 표시용 항목
 */
export interface ProjectListItem {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  status: ProjectStatus;
  start_date: string | null; // ISO 8601 date
  end_date: string | null; // ISO 8601 date
  contract_amount: number | null;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * 체크리스트 항목 (프로젝트 상세에서 사용)
 */
export interface ProjectChecklistItem {
  stage: ProjectStage;
  label: string; // 한글 라벨
  completed_at: string | null; // ISO 8601 timestamp or null
}

/**
 * 프로젝트 상세 정보
 * 체크리스트 및 첨부파일 포함
 */
export interface ProjectDetail {
  id: number;
  project_code: string | null;
  project_name: string;
  customer_id: number;
  customer_name: string;
  employee_id: number;
  employee_name: string;
  department_name: string;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  contract_amount: number | null;
  description: string | null;
  checklist: ProjectChecklistItem[]; // 8개 항목 배열
  attachments: ProjectAttachment[];
  created_at: string;
  updated_at: string;
}

/**
 * 프로젝트 첨부파일
 */
export interface ProjectAttachment {
  id: number;
  file_name: string; // 원본 파일명
  file_size: number; // bytes
  category: AttachmentCategory;
  created_at: string; // ISO 8601 timestamp
}

/**
 * 프로젝트 검색 파라미터
 */
export interface ProjectSearchParams {
  page: number; // 1-based
  page_size: number; // default 20
  sort_by: string; // default 'created_at'
  sort_order: 'ASC' | 'DESC'; // default 'DESC'
  customer_id?: number;
  status?: ProjectStatus[]; // 복수 선택 가능
  employee_id?: number;
  keyword?: string; // 프로젝트명, 코드 검색 (2자 이상)
}

// ============================================================================
// 6. Request/Response Interfaces - API 통신용
// ============================================================================

/**
 * 프로젝트 등록 요청
 */
export interface CreateProjectRequest {
  project_name: string; // 필수, max 200
  customer_id: number; // 필수
  employee_id: number; // 필수
  project_code?: string | null; // 선택
  start_date?: string | null; // ISO 8601 date
  end_date?: string | null; // ISO 8601 date
  contract_amount?: number | null;
  description?: string | null;
}

/**
 * 프로젝트 수정 요청
 * 모든 필드가 선택적 (partial update 지원)
 */
export interface UpdateProjectRequest {
  project_name?: string;
  project_code?: string | null;
  customer_id?: number;
  employee_id?: number;
  status?: ProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  contract_amount?: number | null;
  description?: string | null;
}

/**
 * 체크리스트 토글 요청
 */
export interface ProjectChecklistToggleRequest {
  stage: ProjectStage;
  completed: boolean;
}

/**
 * 체크리스트 토글 응답
 */
export interface ProjectChecklistToggleResponse {
  stage: string;
  completed_at: string | null;
}

/**
 * 프로젝트 상태별 카운트 Summary
 */
export interface ProjectSummary {
  preparing: number;
  in_progress: number;
  completed: number;
  on_hold: number;
}

/**
 * 프로젝트 목록 조회 응답
 */
export interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 프로젝트 코드 생성 응답
 */
export interface GenerateProjectCodeResponse {
  code: string;
}

/**
 * 첨부파일 업로드 응답
 */
export interface ProjectAttachmentResponse {
  id: number;
  file_name: string;
  category: AttachmentCategory;
  file_size: number;
  created_at: string;
}

// ============================================================================
// 7. Employee Related (프로젝트에서 사용)
// ============================================================================

/**
 * Employee 목록 항목 (프로젝트 담당자 선택용)
 */
export interface EmployeeListItem {
  id: number;
  name: string;
  department_name: string;
}

/**
 * Employee 목록 조회 응답
 */
export interface EmployeeListResponse {
  employees: EmployeeListItem[];
}

// ============================================================================
// 8. Customer Related (프로젝트에서 사용)
// ============================================================================

/**
 * Customer 목록 항목 (프로젝트 고객사 선택용)
 */
export interface CustomerListItem {
  id: number;
  name: string;
}

/**
 * Customer 목록 조회 응답
 */
export interface CustomerListResponse {
  customers: CustomerListItem[];
}
