// Generated: 2026-01-28 00:25:00 KST

// === Enum Types ===

export type CustomerClassification = 'RESELLER' | 'END_USER' | 'MAINTENANCE' | 'GENERAL';
export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'CONTACT_ADD' | 'CONTACT_DELETE';

// === Enum Labels ===

export const ClassificationLabel: Record<CustomerClassification, string> = {
  RESELLER: '리셀러',
  END_USER: '최종고객',
  MAINTENANCE: '유지보수',
  GENERAL: '일반',
};

export const ChangeTypeLabel: Record<ChangeType, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  CONTACT_ADD: '담당자 추가',
  CONTACT_DELETE: '담당자 삭제',
};

// === Enum Options (Select/Filter용) ===

export const CLASSIFICATION_OPTIONS: { value: CustomerClassification; label: string }[] = [
  { value: 'RESELLER', label: '리셀러' },
  { value: 'END_USER', label: '최종고객' },
  { value: 'MAINTENANCE', label: '유지보수' },
  { value: 'GENERAL', label: '일반' },
];

export const CHANGE_TYPE_OPTIONS: { value: ChangeType; label: string }[] = [
  { value: 'CREATE', label: '생성' },
  { value: 'UPDATE', label: '수정' },
  { value: 'DELETE', label: '삭제' },
  { value: 'CONTACT_ADD', label: '담당자 추가' },
  { value: 'CONTACT_DELETE', label: '담당자 삭제' },
];

// === Badge Color Maps ===

export const ClassificationColors: Record<CustomerClassification, string> = {
  RESELLER: 'bg-blue-100 text-blue-700',
  END_USER: 'bg-green-100 text-green-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  GENERAL: 'bg-gray-100 text-gray-600',
};

export const ChangeTypeColors: Record<ChangeType, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-yellow-100 text-yellow-700',
  DELETE: 'bg-red-100 text-red-700',
  CONTACT_ADD: 'bg-blue-100 text-blue-700',
  CONTACT_DELETE: 'bg-pink-100 text-pink-700',
};

// === Core Entity Types ===

export interface Customer {
  id: number;
  name: string;
  code: string;
  classification: CustomerClassification;
  address: string | null;
  phone: string | null;
  email: string | null;
  memo: string | null;
  createdAt: string;
  createdById: number | null;
  updatedAt: string;
  updatedById: number | null;
  deletedAt: string | null;
}

export interface CustomerContact {
  id: number;
  customerId: number;
  name: string;
  title: string;
  department: string | null;
  email: string;
  phone: string;
  description: string | null;
  primaryContact: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerHistory {
  id: number;
  customerId: number;
  changeType: ChangeType;
  changedFields: Record<string, { before: any; after: any }>;
  changedBy: {
    id: number;
    name: string;
  };
  changedAt: string;
}

// === Employee Reference Type ===

export interface EmployeeRef {
  id: number;
  name: string;
}

// === API Request Types ===

export interface CreateCustomerRequest {
  name: string;
  classification: CustomerClassification;
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
}

export interface UpdateCustomerRequest {
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  classification?: CustomerClassification;
}

export interface CreateCustomerContactRequest {
  name: string;
  title: string;
  department?: string;
  email: string;
  phone: string;
  description?: string;
  primaryContact?: boolean;
}

export interface UpdateCustomerContactRequest {
  name?: string;
  title?: string;
  department?: string | null;
  email?: string;
  phone?: string;
  description?: string | null;
  primaryContact?: boolean;
}

// === API Response Types ===

export interface CustomerResponse extends Customer {
  createdByName?: string;
  updatedByName?: string;
}

export interface CustomerListResponse {
  data: CustomerListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerListItem {
  id: number;
  name: string;
  code: string;
  classification: CustomerClassification;
  phone: string | null;
  email: string | null;
  managerId?: number;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerDetailResponse extends Customer {
  createdBy?: EmployeeRef;
  updatedBy?: EmployeeRef;
  contactCount?: number;
  relatedProjects?: number;
  relatedTechSupports?: number;
  relatedMaintenanceContracts?: number;
}

export interface CustomerContactResponse extends CustomerContact {}

export interface CustomerContactListResponse {
  data: CustomerContactResponse[];
}

export interface CustomerHistoryResponse {
  id: number;
  customerId: number;
  changeType: ChangeType;
  changedFields: Record<string, { before: any; after: any }>;
  changedBy: EmployeeRef;
  changedAt: string;
}

export interface CustomerHistoryListResponse {
  data: CustomerHistoryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerDeleteResponse {
  id: number;
  name: string;
  code: string;
  deletedAt: string;
}

export interface CustomerContactDeleteResponse {
  id: number;
  customerId: number;
  name: string;
  deletedAt: string;
}

// === Query Parameter Types ===

export interface CustomerListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  classification?: string[];
  managerId?: number;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'manager';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CustomerHistoryQueryParams {
  page?: number;
  limit?: number;
  changeType?: ChangeType;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'changed_at' | 'change_type';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CustomerSearchParams {
  query: string;
  limit?: number;
}

// === Error Response Types ===

export interface DeleteDependencyError {
  projects?: number;
  techSupports?: number;
  maintenanceContracts?: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

// === Form State Types ===

export interface CustomerFormState {
  name: string;
  classification: CustomerClassification;
  address: string;
  phone: string;
  email: string;
  memo: string;
}

export interface CustomerContactFormState {
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  description: string;
  primaryContact: boolean;
}

// === Filter State Types (for Zustand) ===

export interface CustomerFilterState {
  searchText: string;
  classificationFilter: CustomerClassification[];
  managerFilter: number | null;
  includeDeleted: boolean;
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'manager';
  sortOrder: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

export interface CustomerHistoryFilterState {
  changeTypeFilter: ChangeType | null;
  fromDate: string | null;
  toDate: string | null;
  sortBy: 'changed_at' | 'change_type';
  sortOrder: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

// === Utility Functions ===

export function isValidClassification(value: string): value is CustomerClassification {
  return ['RESELLER', 'END_USER', 'MAINTENANCE', 'GENERAL'].includes(value);
}

export function isValidChangeType(value: string): value is ChangeType {
  return ['CREATE', 'UPDATE', 'DELETE', 'CONTACT_ADD', 'CONTACT_DELETE'].includes(value);
}

export function getClassificationLabel(classification: CustomerClassification): string {
  return ClassificationLabel[classification];
}

export function getChangeTypeLabel(changeType: ChangeType): string {
  return ChangeTypeLabel[changeType];
}

export function getClassificationColor(classification: CustomerClassification): string {
  return ClassificationColors[classification];
}

export function getChangeTypeColor(changeType: ChangeType): string {
  return ChangeTypeColors[changeType];
}

// === Validation Helpers ===

export const CUSTOMER_VALIDATION = {
  NAME_MAX_LENGTH: 200,
  ADDRESS_MAX_LENGTH: 500,
  PHONE_PATTERN: /^[0-9\-()]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MEMO_MAX_LENGTH: 1000,

  CONTACT_NAME_MAX_LENGTH: 100,
  CONTACT_TITLE_MAX_LENGTH: 50,
  CONTACT_DEPARTMENT_MAX_LENGTH: 50,
  CONTACT_DESCRIPTION_MAX_LENGTH: 200,
} as const;

// === Type Guards ===

export function isCustomer(obj: unknown): obj is Customer {
  if (typeof obj !== 'object' || obj === null) return false;
  const customer = obj as Record<string, unknown>;
  return (
    typeof customer.id === 'number' &&
    typeof customer.name === 'string' &&
    typeof customer.code === 'string' &&
    isValidClassification(customer.classification as string)
  );
}

export function isCustomerContact(obj: unknown): obj is CustomerContact {
  if (typeof obj !== 'object' || obj === null) return false;
  const contact = obj as Record<string, unknown>;
  return (
    typeof contact.id === 'number' &&
    typeof contact.customerId === 'number' &&
    typeof contact.name === 'string' &&
    typeof contact.email === 'string' &&
    typeof contact.phone === 'string'
  );
}

export function isCustomerHistory(obj: unknown): obj is CustomerHistory {
  if (typeof obj !== 'object' || obj === null) return false;
  const history = obj as Record<string, unknown>;
  return (
    typeof history.id === 'number' &&
    typeof history.customerId === 'number' &&
    isValidChangeType(history.changeType as string) &&
    typeof history.changedFields === 'object' &&
    typeof history.changedAt === 'string'
  );
}

// === Backward Compatibility ===

/**
 * @deprecated Use `CustomerClassification` instead
 */
export type CustomerCategory = CustomerClassification;

// === Constants ===

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_HISTORY_PAGE_SIZE = 20;
export const CUSTOMER_CODE_PREFIX = 'CUST-';
