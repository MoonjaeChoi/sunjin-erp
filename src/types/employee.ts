// Generated: 2026-01-27 23:30:00 KST

// ============================================================
// 1. 기본 Enum 및 상수
// ============================================================

// 시스템 역할
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export const USER_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'USER'];

export const UserRoleLabel: Record<UserRole, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  USER: '사용자',
};

export const UserRoleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-orange-100 text-orange-800',
  USER: 'bg-blue-100 text-blue-800',
};

// 이력 변경 유형
export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'DEACTIVATE';

export const ChangeTypeLabel: Record<ChangeType, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  DEACTIVATE: '비활성화',
};

// ============================================================
// 2. Department (부서) 타입
// ============================================================

// 부서 기본 타입
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: number;
  parentDepartment?: Department;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 부서 목록 응답 (계층 구조 포함)
export interface DepartmentWithChildren extends Department {
  children?: DepartmentWithChildren[];
  employeeCount?: number;
}

// 부서 생성 요청
export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: number;
}

// 부서 수정 요청
export interface UpdateDepartmentRequest {
  name?: string;
  code?: string;
  description?: string;
  parentDepartmentId?: number | null;
}

// 부서 목록 쿼리 파라미터
export interface DepartmentListQueryParams {
  includeDeleted?: boolean;
  includeChildren?: boolean;
}

// ============================================================
// 3. Position (직급) 타입
// ============================================================

// 직급 기본 타입
export interface Position {
  id: number;
  name: string;
  code: string; // POS-XXXXX (자동 생성)
  level: number; // 1-10
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// 직급 생성 요청 (code는 서버에서 자동 생성)
export interface CreatePositionRequest {
  name: string;
  level: number;
}

// 직급 수정 요청
export interface UpdatePositionRequest {
  name?: string;
  level?: number;
}

// 직급 목록 쿼리 파라미터
export interface PositionListQueryParams {
  includeDeleted?: boolean;
}

// ============================================================
// 4. Employee (직원) 타입
// ============================================================

// 직원 기본 타입
export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  departmentId: number;
  positionId: number;
  managerId?: number;
  hiredAt: string;
  birthday?: string;
  createdAt: string;
  createdById?: number;
  updatedAt: string;
  updatedById?: number;
  deletedAt?: string;
}

// 직원 상세 (관계 포함)
export interface EmployeeDetail extends Employee {
  department: Department;
  position: Position;
  manager?: Pick<Employee, 'id' | 'name' | 'email'>;
  createdBy?: Pick<Employee, 'id' | 'name'>;
  updatedBy?: Pick<Employee, 'id' | 'name'>;
  account?: AccountInfo; // ADMIN만 조회 가능
}

// 직원 목록 아이템 (간략 정보)
export interface EmployeeListItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  departmentId: number;
  departmentName: string;
  positionId: number;
  positionName: string;
  positionLevel: number;
  hiredAt: string;
  isActive?: boolean; // Account.is_active (ADMIN만 조회)
}

// 직원 생성 요청
export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  departmentId: number;
  positionId: number;
  managerId?: number;
  hiredAt: string;
  birthday?: string;
}

// 직원 수정 요청
export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  departmentId?: number;
  positionId?: number;
  managerId?: number | null;
  hiredAt?: string;
  birthday?: string | null;
}

// 직원 목록 쿼리 파라미터
export interface EmployeeListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  positionId?: number;
  isActive?: boolean;
  sortBy?: 'name' | 'hiredAt' | 'department';
  sortOrder?: 'ASC' | 'DESC';
}

// ============================================================
// 5. Account (계정) 타입
// ============================================================

// 계정 정보 (ADMIN 전용)
export interface AccountInfo {
  id: number;
  employeeId: number;
  username: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 계정 생성 요청
export interface CreateAccountRequest {
  username: string;
  password: string; // 임시 암호 (Phase 1: 수동 설정)
  role: UserRole;
}

// 계정 생성 응답 (임시 암호 일회 표시)
export interface CreateAccountResponse {
  account: AccountInfo;
  temporaryPassword?: string; // 일회 표시용
}

// 권한 변경 요청
export interface UpdateAccountRoleRequest {
  role: UserRole;
}

// 계정 활성화/비활성화 응답
export interface AccountStatusResponse {
  id: number;
  isActive: boolean;
  message: string;
}

// ============================================================
// 6. EmployeeHistory (이력) 타입
// ============================================================

// 변경 필드 정보
export interface ChangedField {
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

// 이력 기본 타입
export interface EmployeeHistory {
  id: number;
  employeeId: number;
  changeType: ChangeType;
  changedFields: Record<string, ChangedField>;
  changedById: number;
  changedByName?: string;
  changedAt: string;
}

// 이력 목록 쿼리 파라미터
export interface EmployeeHistoryQueryParams {
  page?: number;
  limit?: number;
  changeType?: ChangeType;
}

// ============================================================
// 7. API 응답 타입
// ============================================================

// 페이지네이션 정보
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 목록 응답 공통 타입
export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

// 단일 응답 공통 타입
export interface SingleResponse<T> {
  data: T;
}

// 직원 목록 응답
export type EmployeeListResponse = ListResponse<EmployeeListItem>;

// 직원 상세 응답
export type EmployeeDetailResponse = SingleResponse<EmployeeDetail>;

// 부서 목록 응답
export type DepartmentListResponse = SingleResponse<DepartmentWithChildren[]>;

// 직급 목록 응답
export type PositionListResponse = SingleResponse<Position[]>;

// 이력 목록 응답
export type EmployeeHistoryResponse = ListResponse<EmployeeHistory>;

// 에러 응답
export interface ErrorResponse {
  message: string;
  errors?: Record<string, string>;
  dependencies?: {
    type: string;
    count: number;
    details?: string;
  }[];
}

// ============================================================
// 8. 유효성 검증용 폼 타입
// ============================================================

// 직원 폼 유효성 검증용 타입
export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string; // Select는 string으로 처리
  positionId: string;
  managerId: string;
  hiredAt: string;
  birthday: string;
}

// 계정 폼 유효성 검증용 타입
export interface AccountFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

// 부서 폼 유효성 검증용 타입
export interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
  parentDepartmentId: string;
}

// 직급 폼 유효성 검증용 타입
export interface PositionFormData {
  name: string;
  level: string;
}
