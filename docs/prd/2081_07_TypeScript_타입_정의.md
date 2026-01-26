<!-- Generated: 2026-01-27 22:45:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2081_07
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**구현 범위**: `src/types/customer.ts` (공유 타입 정의)
**복잡도**: S (0.5~1일)
**의존성**: 2081_06 완료 (API 응답 구조 확정)

---

## 구현 목표

모든 고객 관련 API 요청/응답 타입을 정의합니다. Frontend/Backend에서 공유하는 단일 소스입니다.

---

## 파일 구조

```
src/types/
└── customer.ts (새 파일 - 고객 타입 정의)
```

---

## 구현 상세

### `src/types/customer.ts`

```typescript
// Generated: 2026-01-27 22:45:00 KST

/**
 * 고객 관리 (CRM) 모듈의 공유 타입 정의
 * API 요청/응답, 컴포넌트 props 등에서 사용
 */

// ==================== Enum Types ====================

export enum CustomerClassification {
  RESELLER = 'RESELLER',
  END_USER = 'END_USER',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL'
}

export const CLASSIFICATION_LABELS: Record<CustomerClassification, string> = {
  [CustomerClassification.RESELLER]: '리셀러',
  [CustomerClassification.END_USER]: '최종고객',
  [CustomerClassification.MAINTENANCE]: '유지보수',
  [CustomerClassification.GENERAL]: '일반'
};

export enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CONTACT_ADD = 'CONTACT_ADD',
  CONTACT_DELETE = 'CONTACT_DELETE'
}

// ==================== Entity Types ====================

export interface Customer {
  id: number;
  name: string;
  code: string;
  classification: CustomerClassification;
  address?: string;
  phone?: string;
  email?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CustomerDetail extends Customer {
  managerId: number;
  managerName: string;
  createdByName: string;
  updatedByName: string;
}

export interface CustomerContact {
  id: number;
  customerId: number;
  name: string;
  title: string;
  department?: string;
  email: string;
  phone: string;
  description?: string;
  primaryContact: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
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

// ==================== API Request Types ====================

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

export interface DeleteCustomerRequest {
  reason?: string;
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
  department?: string;
  email?: string;
  phone?: string;
  description?: string;
  primaryContact?: boolean;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomersListResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerContactsListResponse {
  data: CustomerContact[];
}

export interface CustomerHistoryListResponse {
  data: CustomerHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DependencyError {
  error: string;
  message: string;
  details: {
    projects?: number;
    techSupports?: number;
    maintenanceContracts?: number;
  };
}

// ==================== Filter/Search Types ====================

export interface CustomerFilters {
  search?: string;
  classification?: CustomerClassification | CustomerClassification[];
  managerId?: number;
  includeDeleted?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'manager';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

// ==================== Component Props Types ====================

export interface CustomerListProps {
  onSelectCustomer?: (customer: Customer) => void;
  onCreateCustomer?: () => void;
}

export interface CustomerFormProps {
  customer?: Customer;
  isLoading?: boolean;
  onSubmit: (data: CreateCustomerRequest | UpdateCustomerRequest) => Promise<void>;
  onCancel?: () => void;
}

export interface CustomerDetailProps {
  customerId: number;
  isLoading?: boolean;
}

export interface CustomerContactFormProps {
  customerId: number;
  contact?: CustomerContact;
  isLoading?: boolean;
  onSubmit: (data: CreateCustomerContactRequest | UpdateCustomerContactRequest) => Promise<void>;
  onCancel?: () => void;
}

export interface CustomerSearchProps {
  onSelectCustomer: (customer: Customer) => void;
  onCreateCustomer?: (name: string) => void;
  placeholder?: string;
}

// ==================== Error Types ====================

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

// ==================== Pagination ====================

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== Utility Types ====================

export type CustomerWithContacts = Customer & {
  contacts: CustomerContact[];
  histories: CustomerHistory[];
};

export type CustomerFormData = CreateCustomerRequest | UpdateCustomerRequest;
export type ContactFormData = CreateCustomerContactRequest | UpdateCustomerContactRequest;
```

---

## Acceptance Criteria

- [ ] `src/types/customer.ts` 생성 완료
  - [ ] Entity 타입 (Customer, CustomerContact, CustomerHistory)
  - [ ] API 요청/응답 타입
  - [ ] Filter/Search 타입
  - [ ] Component Props 타입
  - [ ] Enum 타입 (Classification, ChangeType)
  - [ ] Utility 타입

- [ ] TypeScript 검증 통과
  ```bash
  npm run type-check
  ✅ (에러 없음)
  ```

- [ ] ESLint 통과
  ```bash
  npm run lint
  ✅ (경고 없음)
  ```

---

## 완료 체크리스트

- [ ] 타입 파일 생성
- [ ] TypeScript 빌드 성공
- [ ] 타입 검증 통과

---

**다음 문서**: 2081_08_TanStack_Query_Hooks.md
