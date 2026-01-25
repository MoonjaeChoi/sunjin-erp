// Generated: 2026-01-25 14:50:00 KST

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ProjectListResponse,
  ProjectDetail,
  ProjectSummary,
  ProjectSearchParams,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectChecklistToggleRequest,
  ProjectChecklistToggleResponse,
  GenerateProjectCodeResponse,
  ProjectAttachment,
  ProjectAttachmentResponse,
  ProjectStage,
} from '@/types/project';

/**
 * Project 관련 Query Key Factory
 * 일관된 캐싱 전략을 위해 key factory 패턴 사용
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params: ProjectSearchParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
  summaries: () => [...projectKeys.all, 'summary'] as const,
  summary: (params: Partial<ProjectSearchParams>) => [...projectKeys.summaries(), params] as const,
};

/**
 * 프로젝트 목록 조회 Hook
 * 페이지네이션, 필터링, 정렬 지원
 *
 * @param {ProjectSearchParams} params - 검색 파라미터
 * @returns {UseQueryResult<ProjectListResponse>} 프로젝트 목록
 */
export function useProjectListQuery(params: ProjectSearchParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: async (): Promise<ProjectListResponse> => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page));
      searchParams.set('page_size', String(params.page_size));
      searchParams.set('sort_by', params.sort_by);
      searchParams.set('sort_order', params.sort_order);
      if (params.customer_id) {
        searchParams.set('customer_id', String(params.customer_id));
      }
      if (params.status?.length) {
        searchParams.set('status', params.status.join(','));
      }
      if (params.employee_id) {
        searchParams.set('employee_id', String(params.employee_id));
      }
      if (params.keyword) {
        searchParams.set('keyword', params.keyword);
      }

      const res = await fetch(`/api/projects?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30초
  });
}

/**
 * 프로젝트 상세 조회 Hook
 * id가 null이면 쿼리 비활성화
 *
 * @param {number | null} id - 프로젝트 ID
 * @returns {UseQueryResult<ProjectDetail>} 프로젝트 상세 정보
 */
export function useProjectDetailQuery(id: number | null) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: async (): Promise<ProjectDetail> => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch project detail');
      }
      return res.json();
    },
    enabled: id !== null, // id가 없으면 비활성화
    staleTime: 30 * 1000,
  });
}

/**
 * 프로젝트 상태별 카운트 Summary 조회 Hook
 * 필터링된 범위 내 상태별 프로젝트 개수 반환
 *
 * @param {Partial<ProjectSearchParams>} params - 필터 파라미터 (customer_id, employee_id)
 * @returns {UseQueryResult<ProjectSummary>} 상태별 카운트
 */
export function useProjectSummaryQuery(params: Partial<ProjectSearchParams> = {}) {
  return useQuery({
    queryKey: projectKeys.summary(params),
    queryFn: async (): Promise<ProjectSummary> => {
      const searchParams = new URLSearchParams();
      if (params.customer_id) {
        searchParams.set('customer_id', String(params.customer_id));
      }
      if (params.employee_id) {
        searchParams.set('employee_id', String(params.employee_id));
      }

      const res = await fetch(`/api/projects/summary?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch project summary');
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1분
  });
}

/**
 * 프로젝트 생성 Mutation
 * 성공 시 목록 및 summary 캐시 무효화
 *
 * @returns {UseMutationResult<{id: number}, Error, CreateProjectRequest>}
 */
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
        throw new Error(error.error || 'Failed to create project');
      }
      return res.json();
    },
    onSuccess: () => {
      // 목록 및 summary 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.summaries() });
    },
  });
}

/**
 * 프로젝트 수정 Mutation
 * 성공 시 상세, 목록, summary 캐시 무효화
 *
 * @returns {UseMutationResult<void, Error, {id: number, data: UpdateProjectRequest}>}
 */
export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateProjectRequest;
    }): Promise<void> => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update project');
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

/**
 * 프로젝트 삭제 Mutation (소프트 삭제)
 * 성공 시 목록 및 summary 캐시 무효화
 *
 * @returns {UseMutationResult<void, Error, number>}
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete project');
      }
    },
    onSuccess: () => {
      // 목록 + summary 갱신
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.summaries() });
    },
  });
}

/**
 * 체크리스트 토글 Mutation (Optimistic Update)
 * 즉시 UI 반영 후 서버 확인, 실패 시 롤백
 *
 * @returns {UseMutationResult<ProjectChecklistToggleResponse, Error, {projectId: number, stage: ProjectStage, completed: boolean}>}
 */
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
      if (!res.ok) {
        throw new Error('Failed to toggle checklist');
      }
      return res.json();
    },

    // Optimistic Update: UI 즉시 업데이트
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
              ? {
                  ...item,
                  completed_at: completed ? new Date().toISOString() : null,
                }
              : item
          ),
        });
      }

      return { previousDetail };
    },

    // 에러 시 롤백
    onError: (err, { projectId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(projectKeys.detail(projectId), context.previousDetail);
      }
    },

    // 성공/실패 상관없이 서버 데이터로 동기화
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/**
 * 프로젝트 첨부파일 업로드 Mutation
 * 성공 시 상세 페이지 캐시 무효화
 *
 * @returns {UseMutationResult<ProjectAttachmentResponse, Error, {projectId: number, file: File, category: string}>}
 */
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
      category: string;
    }): Promise<ProjectAttachmentResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const res = await fetch(`/api/projects/${projectId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload attachment');
      }
      return res.json();
    },
    onSuccess: (_, { projectId }) => {
      // 상세 query 갱신 (첨부파일 목록 포함)
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/**
 * 프로젝트 첨부파일 삭제 Mutation
 * 성공 시 상세 페이지 캐시 무효화
 *
 * @returns {UseMutationResult<void, Error, {projectId: number, attachmentId: number}>}
 */
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
        throw new Error(error.error || 'Failed to delete attachment');
      }
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

/**
 * 프로젝트 코드 생성 Mutation
 * 1회성 값 반환으로 캐시 무효화 불필요
 *
 * @returns {UseMutationResult<GenerateProjectCodeResponse, Error, void>}
 */
export function useGenerateProjectCodeMutation() {
  return useMutation({
    mutationFn: async (): Promise<GenerateProjectCodeResponse> => {
      const res = await fetch('/api/projects/generate-code', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to generate project code');
      }
      return res.json();
    },
    // 코드 생성은 cache invalidation 불필요 (1회성 값 반환)
  });
}
