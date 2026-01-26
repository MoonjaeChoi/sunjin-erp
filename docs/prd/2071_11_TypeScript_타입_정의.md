<!-- Generated: 2026-01-26 21:30:00 KST -->

# TypeScript 타입 정의

**문서 번호**: 2071_11
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**개발 표준**: `CLAUDE.md` (TypeScript strict mode), `docs/standard/FRONTEND_CODING_STANDARDS_*.md`
**구현 범위**: Frontend에서 사용할 타입/인터페이스 정의 및 유틸리티 타입
**복잡도**: S (0.5-1일)
**의존성**: 2071_05~10 (API 응답 스키마 확정)

---

## 구현 목표

API 응답 및 Frontend 컴포넌트에서 사용할 모든 TypeScript 타입을 정의하여 다음을 제공합니다:
- Type-safe API 통신 (TanStack Query)
- Type-safe 폼 (React Hook Form)
- Type-safe 상태 관리 (Zustand)
- 완전한 TypeScript strict mode 호환성

---

## 구현 내용

### 파일 구조

```
src/types/
├── maintenance.ts           # Main types
├── common.ts               # Shared types (pagination, response)
└── index.ts                # Re-exports
```

### 1. maintenance.ts - 핵심 타입

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { z } from 'zod';

/**
 * 유지보수 계약 상태
 */
export enum ContractStatus {
  ACTIVE = '활성',
  ENDED = '종료',
  RENEWAL_PENDING = '갱신예정'
}

export const ContractStatusLabel: Record<ContractStatus, string> = {
  [ContractStatus.ACTIVE]: '활성',
  [ContractStatus.ENDED]: '종료',
  [ContractStatus.RENEWAL_PENDING]: '갱신예정'
};

/**
 * 이력 변경 타입
 */
export enum ChangeType {
  CREATE = '생성',
  UPDATE = '수정',
  STATUS_CHANGE = '상태변경',
  RENEWAL = '갱신',
  DELETE = '삭제'
}

export const ChangeTypeLabel: Record<ChangeType, string> = {
  [ChangeType.CREATE]: '생성',
  [ChangeType.UPDATE]: '수정',
  [ChangeType.STATUS_CHANGE]: '상태변경',
  [ChangeType.RENEWAL]: '갱신',
  [ChangeType.DELETE]: '삭제'
};

/**
 * 고객 정보 (관계)
 */
export interface Customer {
  id: number;
  name: string;
  customer_code?: string;
  department?: string;
}

/**
 * 직원 정보 (담당자)
 */
export interface Employee {
  id: number;
  name: string;
  email?: string;
  department?: string;
}

/**
 * 첨부 파일
 */
export interface MaintenanceAttachment {
  id: number;
  maintenance_contract_id: number;
  file_name: string;
  file_size: number;
  uploaded_by: Employee;
  uploaded_at: string; // ISO 8601
  deleted_at?: string | null;
}

/**
 * 계약 이력 기록
 */
export interface MaintenanceContractHistory {
  id: number;
  maintenance_contract_id: number;
  change_type: ChangeType;
  previous_value?: Record<string, any>;
  new_value?: Record<string, any>;
  reason?: string;
  changed_by: Employee;
  changed_at: string; // ISO 8601
}

/**
 * 유지보수 계약 (API 응답)
 */
export interface MaintenanceContract {
  id: number;
  customer: Customer;
  contract_name: string;
  contract_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  contract_status: ContractStatus;
  contract_amount?: number;
  assigned_employee: Employee;
  notes?: string;
  created_by: Employee;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at?: string | null;
}

/**
 * 유지보수 계약 상세 (관계 포함)
 */
export interface MaintenanceContractDetail extends MaintenanceContract {
  attachments: MaintenanceAttachment[];
  history: MaintenanceContractHistory[];
}

/**
 * 유지보수 계약 생성/수정 폼 데이터
 */
export interface MaintenanceContractFormData {
  customer_id: number;
  contract_name: string;
  contract_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  contract_amount?: number;
  assigned_employee_id: number;
  notes?: string;
}

/**
 * 상태 변경 요청
 */
export interface StatusChangeRequest {
  status: ContractStatus;
  reason: string;
}

/**
 * 통계 데이터
 */
export interface MaintenanceStats {
  byStatus: Record<ContractStatus, number>;
  expiringIn30Days: number;
  expiringIn60Days: number;
}

/**
 * 목록 필터 옵션
 */
export interface MaintenanceListFilters {
  status?: ContractStatus;
  assignedEmployeeId?: number;
  customerId?: number;
  contractNameSearch?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?: 'created_at' | 'end_date' | 'contract_name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * API 응답: 계약 목록
 */
export interface GetMaintenanceContractsResponse {
  data: MaintenanceContract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

/**
 * API 응답: 단일 계약
 */
export interface GetMaintenanceContractResponse {
  data: MaintenanceContractDetail;
}

/**
 * API 응답: 생성/수정
 */
export interface CreateMaintenanceContractResponse {
  id: number;
  contract_name: string;
  created_at: string;
}

/**
 * API 응답: 상태 변경
 */
export interface StatusChangeResponse {
  id: number;
  contract_status: ContractStatus;
  message: string;
}

/**
 * API 응답: 통계
 */
export interface GetStatsResponse {
  data: MaintenanceStats;
}

/**
 * API 응답: 첨부 파일 목록
 */
export interface GetAttachmentsResponse {
  data: MaintenanceAttachment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

/**
 * API 응답: 이력 목록
 */
export interface GetHistoryResponse {
  data: MaintenanceContractHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNextPage: boolean;
  };
}

/**
 * 폼 검증 스키마 (Zod)
 */
export const maintenanceFormSchema = z.object({
  customer_id: z.number().min(1, '고객을 선택해주세요'),
  contract_name: z.string().min(1, '계약명을 입력해주세요').max(255),
  contract_type: z.string().min(1, '계약 유형을 입력해주세요'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '유효한 날짜를 입력해주세요'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '유효한 날짜를 입력해주세요'),
  contract_amount: z.number().optional(),
  assigned_employee_id: z.number().min(1, '담당자를 선택해주세요'),
  notes: z.string().optional()
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  { message: '시작일이 종료일보다 클 수 없습니다', path: ['end_date'] }
);

export type MaintenanceFormInput = z.infer<typeof maintenanceFormSchema>;

/**
 * UI 상태 타입
 */
export interface MaintenanceListState {
  filters: MaintenanceListFilters;
  selectedContractIds: number[];
  isDetailDialogOpen: boolean;
  selectedContractId?: number;
  isFormDialogOpen: boolean;
  formMode: 'create' | 'edit';
}

/**
 * 계약 배지 스타일 (상태별)
 */
export const contractStatusBadgeVariant: Record<ContractStatus, 'default' | 'secondary' | 'destructive'> = {
  [ContractStatus.ACTIVE]: 'default',
  [ContractStatus.RENEWAL_PENDING]: 'secondary',
  [ContractStatus.ENDED]: 'destructive'
};
```

### 2. common.ts - 공유 타입

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * API 성공 응답 래퍼
 */
export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
}

/**
 * 요청 상태
 */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * 로그인 사용자 세션
 */
export interface Session {
  user: {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
  };
  expires: string;
}
```

### 3. index.ts - Re-exports

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

export * from './maintenance';
export * from './common';
```

---

## 타입 사용 예시

### React Hook Form 통합

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { maintenanceFormSchema, MaintenanceFormInput } from '@/types/maintenance';

export function MaintenanceForm() {
  const form = useForm<MaintenanceFormInput>({
    resolver: zodResolver(maintenanceFormSchema)
  });
  // ...
}
```

### TanStack Query 통합

```typescript
import { useQuery } from '@tanstack/react-query';
import { GetMaintenanceContractsResponse } from '@/types/maintenance';

export function useMaintenanceContracts() {
  return useQuery<GetMaintenanceContractsResponse>({
    queryKey: ['maintenance', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/maintenance');
      return res.json();
    }
  });
}
```

### Zustand 통합

```typescript
import { create } from 'zustand';
import { MaintenanceListState } from '@/types/maintenance';

export const useMaintenanceStore = create<MaintenanceListState>((set) => ({
  filters: {},
  selectedContractIds: [],
  isDetailDialogOpen: false,
  isFormDialogOpen: false,
  formMode: 'create'
}));
```

---

## Acceptance Criteria

- [ ] maintenance.ts 완성 (모든 엔티티 및 응답 타입)
- [ ] common.ts 완성 (공유 타입)
- [ ] Zod 스키마 작성 및 검증
- [ ] 모든 컴포넌트에서 타입 사용
- [ ] npm run type-check 통과
- [ ] TypeScript strict mode 준수
- [ ] 순환 의존성 없음

---

## 테스트 전략

### TypeScript 검증

```bash
npm run type-check               # 타입 검증
npm run build                    # 빌드 검증
npm run lint -- --fix            # ESLint 자동 수정
```

### 검증 항목

- ✅ 모든 타입 정의 완료
- ✅ 순환 의존성 제거
- ✅ strict mode 호환성
- ✅ API 응답과 타입 일치

---

## 완료 체크리스트

- [ ] maintenance.ts 작성 (20+ types)
- [ ] common.ts 작성 (5+ types)
- [ ] index.ts 작성 (re-exports)
- [ ] Zod 스키마 작성
- [ ] BadgeVariant, Label enums 작성
- [ ] npm run type-check 통과
- [ ] npm run build 성공
- [ ] npm run lint 통과
- [ ] 모든 컴포넌트에서 타입 import 확인

---

**다음 문서**: `2071_12_TanStack_Query_Hooks.md`
