// Generated: 2026-01-25 06:20:00 KST

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TechSupportSearchParams,
  TechSupportSearchResponse,
  TechSupportRecord,
  CreateTechSupportRequest,
  UpdateTechSupportRequest,
} from '@/types/tech-support';

// === Query Key Factory ===

export const techSupportKeys = {
  all: ['support'] as const,
  lists: () => [...techSupportKeys.all, 'list'] as const,
  list: (params: TechSupportSearchParams) => [...techSupportKeys.lists(), params] as const,
  details: () => [...techSupportKeys.all, 'detail'] as const,
  detail: (id: number) => [...techSupportKeys.details(), id] as const,
};

// === Query Hooks ===

export function useTechSupportSearchQuery(params: TechSupportSearchParams) {
  return useQuery({
    queryKey: techSupportKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const res = await fetch(`/sunjin/api/support?${searchParams}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<TechSupportSearchResponse>;
    },
    enabled: !!params.date_from && !!params.date_to,
    placeholderData: (prev) => prev,
  });
}

export function useTechSupportDetailQuery(id: number | null) {
  return useQuery({
    queryKey: techSupportKeys.detail(id!),
    queryFn: async () => {
      const res = await fetch(`/sunjin/api/support/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<TechSupportRecord>;
    },
    enabled: id !== null,
  });
}

// === Mutation Hooks ===

export function useCreateTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTechSupportRequest) => {
      const res = await fetch('/sunjin/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
    },
  });
}

export function useUpdateTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTechSupportRequest }) => {
      const res = await fetch(`/sunjin/api/support/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}

export function useDeleteTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/sunjin/api/support/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
    },
  });
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/sunjin/api/support/${id}/attachment`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/sunjin/api/support/${id}/attachment`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attachment');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}
