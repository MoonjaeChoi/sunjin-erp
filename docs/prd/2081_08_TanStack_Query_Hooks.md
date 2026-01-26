<!-- Generated: 2026-01-27 22:45:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2081_08
**원본 PRD**: docs/prd/2081_고객_등록_및_조회_prd_v2.md
**구현 범위**: `src/hooks/useCustomers*` (TanStack Query hooks)
**복잡도**: M (1~2일)
**의존성**: 2081_07 완료 (타입 정의)

---

## 구현 목표

TanStack Query (React Query) Hooks를 구현하여 모든 고객 관련 데이터 페칭과 뮤테이션을 관리합니다. Decision 7 (보수적 캐시 전략)를 적용하여 staleTime/gcTime을 설정합니다.

---

## 파일 구조

```
src/hooks/
├── useCustomers.ts (목록 조회)
├── useCustomer.ts (상세 조회)
├── useCustomerMutations.ts (생성, 수정, 삭제)
├── useCustomerContacts.ts (담당자 관리)
└── useCustomerHistory.ts (이력 조회)
```

---

## 핵심 Hooks

### 1. useCustomers (목록 조회)

```typescript
export const useCustomers = (filters: CustomerFilters = {}) => {
  return useQuery({
    queryKey: ['customers-list', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(filters.page ?? 1),
        limit: String(filters.limit ?? 20),
        ...(filters.search && { search: filters.search }),
        ...(filters.classification && { classification: filters.classification }),
        ...(filters.managerId && { managerId: String(filters.managerId) }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      });
      const res = await fetch(`/api/customers?${params}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json() as CustomersListResponse;
    },
    staleTime: 5 * 60 * 1000,  // 5분 (Decision 7: 보수적)
    gcTime: 30 * 60 * 1000,    // 30분
  });
};
```

### 2. useCustomer (상세 조회)

```typescript
export const useCustomer = (id: number | undefined) => {
  return useQuery({
    queryKey: ['customers-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      return res.json() as ApiResponse<CustomerDetail>;
    },
    staleTime: 10 * 60 * 1000,  // 10분
    gcTime: 30 * 60 * 1000,
    enabled: !!id
  });
};
```

### 3. useCreateCustomer (생성)

```typescript
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create customer');
      return res.json();
    },
    onSuccess: () => {
      // 캐시 무효화 (Decision 7: 보수적)
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-search'] });
    }
  });
};
```

### 4. useUpdateCustomer (수정)

```typescript
export const useUpdateCustomer = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCustomerRequest) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update customer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['customers-detail', customerId] });
    }
  });
};
```

### 5. useDeleteCustomer (삭제, ADMIN only)

```typescript
export const useDeleteCustomer = (customerId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
    }
  });
};
```

### 6. useCustomerContacts (담당자)

```typescript
export const useCustomerContacts = (customerId: number | undefined) => {
  return useQuery({
    queryKey: ['customers-contacts', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json() as CustomerContactsListResponse;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!customerId
  });
};
```

### 7. useCreateCustomerContact, useUpdateCustomerContact, useDeleteCustomerContact

각각 CREATE, UPDATE, DELETE 뮤테이션 구현. 모두 `customers-detail`, `customers-contacts` 캐시 무효화.

### 8. useCustomerHistory (이력)

```typescript
export const useCustomerHistory = (customerId: number | undefined) => {
  return useQuery({
    queryKey: ['customers-history', customerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${customerId}/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json() as CustomerHistoryListResponse;
    },
    staleTime: 30 * 60 * 1000,  // 30분 (변경 이력은 자주 변하지 않음)
    gcTime: 60 * 60 * 1000,
    enabled: !!customerId
  });
};
```

---

## Acceptance Criteria

- [ ] useCustomers 구현 (목록 조회, 필터 지원)
- [ ] useCustomer 구현 (상세 조회)
- [ ] useCreateCustomer, useUpdateCustomer, useDeleteCustomer 구현
- [ ] useCustomerContacts 구현
- [ ] useCreateCustomerContact, useUpdateCustomerContact, useDeleteCustomerContact 구현
- [ ] useCustomerHistory 구현
- [ ] 모든 뮤테이션에서 캐시 무효화 (Decision 7)
- [ ] RBAC 미처리 (Frontend 권한 숨김은 아님, API 레벨에서 권한 검증)

---

## 테스트 전략

```bash
npm run type-check
npm run lint
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] 모든 hooks 파일 생성
- [ ] QueryClient 설정 확인 (src/lib/queryClient.ts)

---

**다음 문서**: 2081_09_페이지_컴포넌트_Server_Components.md
