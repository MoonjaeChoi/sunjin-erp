<!-- Generated: 2026-01-25 KST -->

# TanStack Query Hooks

**문서 번호**: 2041_10
**원본 PRD**: 2041_프로젝트_관리_prd_v2.md
**구현 범위**: src/hooks/projects.ts, src/hooks/employees.ts - TanStack Query hooks 정의
**복잡도**: M
**의존성**: 2041_09

---

## 구현 목표

프로젝트 관리 모듈의 서버 상태를 TanStack Query로 관리하는 custom hooks를 구현한다. 체크리스트 토글에는 optimistic update 패턴을 적용하여 즉각적인 UI 응답을 보장한다. 각 mutation은 적절한 query invalidation 전략을 가진다.

---

## 구현 내용

### 파일 구조

```
src/hooks/
├── projects.ts         # 프로젝트 관련 TanStack Query hooks
└── employees.ts        # Employee 목록 hook
```

### 구현 상세

#### 1. Query Key 구조

```typescript
// src/hooks/projects.ts

// Query Key Factory 패턴
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectSearchParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  summaries: () => [...projectKeys.all, 'summary'] as const,
  summary: (params: Partial<ProjectSearchParams>) => [...projectKeys.summaries(), params] as const,
};

export const employeeKeys = {
  all: ['employees'] as const,
  list: () => [...employeeKeys.all, 'list'] as const,
};
```

#### 2. useProjectListQuery

```typescript
export function useProjectListQuery(params: ProjectSearchParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async (): Promise<ProjectListResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page));
      searchParams.set('page_size', String(params.page_size));
      searchParams.set('sort_by', params.sort_by);
      searchParams.set('sort_order', params.sort_order);
      if (params.customer_id) searchParams.set('customer_id', String(params.customer_id));
      if (params.status?.length) searchParams.set('status', params.status.join(','));
      if (params.employee_id) searchParams.set('employee_id', String(params.employee_id));
      if (params.keyword) searchParams.set('keyword', params.keyword);

      const res = await fetch(`/api/projects?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
    staleTime: 30 * 1000, // 30초
  });
}
```

#### 3. useProjectDetailQuery

```typescript
export function useProjectDetailQuery(id: number | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: async (): Promise<ProjectDetail> => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project detail');
      return res.json();
    },
    enabled: id !== null, // id가 없으면 비활성화
    staleTime: 30 * 1000,
  });
}
```

#### 4. useProjectSummaryQuery

```typescript
export function useProjectSummaryQuery(params: Partial<ProjectSearchParams> = {}) {
  return useQuery({
    queryKey: projectKeys.summary(params),
    queryFn: async (): Promise<ProjectSummary> => {
      const searchParams = new URLSearchParams();
      if (params.customer_id) searchParams.set('customer_id', String(params.customer_id));
      if (params.employee_id) searchParams.set('employee_id', String(params.employee_id));

      const res = await fetch(`/api/projects/summary?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch project summary');
      return res.json();
    },
    staleTime: 60 * 1000, // 1분
  });
}
```

#### 5. useCreateProjectMutation

```typescript
export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectRequest): Promise<{ id: number }> => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create project');
      }
      return res.json();
    },
    onSuccess: () => {
      // 목록 + summary 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.summaries() });
    },
  });
}
```

#### 6. useUpdateProjectMutation

```typescript
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProjectRequest }): Promise<void> => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update project');
      }
    },
    onSuccess: (_, { id }) => {
      // 상세 + 목록 + summary 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.summaries() });
    },
  });
}
```

#### 7. useDeleteProjectMutation

```typescript
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete project');
      }
    },
    onSuccess: () => {
      // 목록 + summary 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.summaries() });
    },
  });
}
```

#### 8. useToggleChecklistMutation (Optimistic Update)

```typescript
export function useToggleChecklistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      stage,
      completed,
    }: {
      projectId: number;
      stage: ProjectStage;
      completed: boolean;
    }): Promise<ProjectChecklistToggleResponse> => {
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, completed }),
      });
      if (!res.ok) throw new Error('Failed to toggle checklist');
      return res.json();
    },

    // Optimistic Update
    onMutate: async ({ projectId, stage, completed }) => {
      // 진행 중인 detail query 취소
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) });

      // 이전 데이터 스냅샷
      const previousDetail = queryClient.getQueryData<ProjectDetail>(
        projectKeys.detail(projectId)
      );

      // Optimistic 업데이트
      if (previousDetail) {
        queryClient.setQueryData<ProjectDetail>(projectKeys.detail(projectId), {
          ...previousDetail,
          checklist: previousDetail.checklist.map((item) =>
            item.stage === stage
              ? { ...item, completed_at: completed ? new Date().toISOString() : null }
              : item
          ),
        });
      }

      return { previousDetail };
    },

    onError: (err, { projectId }, context) => {
      // 에러 시 롤백
      if (context?.previousDetail) {
        queryClient.setQueryData(projectKeys.detail(projectId), context.previousDetail);
      }
    },

    onSettled: (_, __, { projectId }) => {
      // 성공/실패 상관없이 서버 데이터로 동기화
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
```

#### 9. useUploadProjectAttachmentMutation

```typescript
export function useUploadProjectAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      category,
    }: {
      projectId: number;
      file: File;
      category: AttachmentCategory;
    }): Promise<ProjectAttachment> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload attachment');
      }
      return res.json();
    },
    onSuccess: (_, { projectId }) => {
      // 상세 query 갱신 (첨부파일 목록 포함)
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
```

#### 10. useDeleteProjectAttachmentMutation

```typescript
export function useDeleteProjectAttachmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      attachmentId,
    }: {
      projectId: number;
      attachmentId: number;
    }): Promise<void> => {
      const res = await fetch(`/api/projects/${projectId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete attachment');
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
```

#### 11. useGenerateProjectCodeMutation

```typescript
export function useGenerateProjectCodeMutation() {
  return useMutation({
    mutationFn: async (): Promise<GenerateProjectCodeResponse> => {
      const res = await fetch('/api/projects/generate-code', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate project code');
      return res.json();
    },
    // 코드 생성은 cache invalidation 불필요 (1회성 값 반환)
  });
}
```

#### 12. useEmployeeListQuery (src/hooks/employees.ts)

```typescript
// src/hooks/employees.ts

interface EmployeeListItem {
  id: number;
  name: string;
  department_name: string;
}

export const employeeKeys = {
  all: ['employees'] as const,
  list: () => [...employeeKeys.all, 'list'] as const,
};

export function useEmployeeListQuery() {
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: async (): Promise<{ employees: EmployeeListItem[] }> => {
      const res = await fetch('/api/employees/list');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5분 (직원 목록은 자주 변경되지 않음)
  });
}
```

### 핵심 인터페이스

```typescript
// Query Key Factory
export const projectKeys: {
  all: readonly ['projects'];
  lists: () => readonly ['projects', 'list'];
  list: (params: ProjectSearchParams) => readonly ['projects', 'list', ProjectSearchParams];
  details: () => readonly ['projects', 'detail'];
  detail: (id: number) => readonly ['projects', 'detail', number];
  summaries: () => readonly ['projects', 'summary'];
  summary: (params: Partial<ProjectSearchParams>) => readonly ['projects', 'summary', Partial<ProjectSearchParams>];
};

// Invalidation 전략 요약
// Create  → lists() + summaries()
// Update  → detail(id) + lists() + summaries()
// Delete  → lists() + summaries()
// Checklist → detail(id) (optimistic update + settle)
// Upload Attachment → detail(id)
// Delete Attachment → detail(id)
```

---

## Acceptance Criteria

- [ ] src/hooks/projects.ts에 모든 프로젝트 관련 hooks가 정의된다
- [ ] src/hooks/employees.ts에 useEmployeeListQuery가 정의된다
- [ ] projectKeys factory가 올바른 query key 구조를 생성한다
- [ ] useProjectListQuery가 검색 파라미터를 query string으로 변환한다
- [ ] useProjectDetailQuery가 id=null일 때 비활성화된다 (enabled: false)
- [ ] useProjectSummaryQuery가 필터 파라미터를 전달한다
- [ ] useCreateProjectMutation 성공 시 lists + summaries를 invalidate한다
- [ ] useUpdateProjectMutation 성공 시 detail + lists + summaries를 invalidate한다
- [ ] useDeleteProjectMutation 성공 시 lists + summaries를 invalidate한다
- [ ] useToggleChecklistMutation이 optimistic update를 수행한다
- [ ] useToggleChecklistMutation 에러 시 이전 데이터로 롤백한다
- [ ] useToggleChecklistMutation settled 시 서버 데이터로 동기화한다
- [ ] useUploadProjectAttachmentMutation이 FormData를 전송한다
- [ ] useDeleteProjectAttachmentMutation 성공 시 detail을 invalidate한다
- [ ] useGenerateProjectCodeMutation이 POST 요청으로 코드를 생성한다
- [ ] useEmployeeListQuery의 staleTime이 5분으로 설정된다
- [ ] 모든 hooks에서 API 에러 시 적절한 Error를 throw한다

---

## 테스트 전략

**단위 테스트 (Mock Service Worker 활용):**
- 각 query hook의 정상 데이터 fetching 확인
- query key 구조 검증
- mutation 성공 시 invalidation 호출 확인
- useToggleChecklistMutation optimistic update 동작 검증
  - mutate 호출 시 즉시 UI 데이터 변경 확인
  - 에러 발생 시 롤백 확인
  - settled 시 invalidate 호출 확인
- useProjectDetailQuery enabled 조건 검증 (id=null)
- API 에러 응답 시 Error throw 확인

**통합 테스트:**
- 실제 API 호출과 cache 동기화 검증
- mutation 후 query refetch 타이밍 검증
- staleTime 동작 확인

---

**다음 문서**: 2041_11_프로젝트_목록_페이지.md
