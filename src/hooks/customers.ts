// Generated: 2026-01-25 06:20:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import type { CustomerListResponse } from '@/types/tech-support';

// === Query Key Factory ===

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
};

// === Query Hook ===

export function useCustomerListQuery() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: async () => {
      const res = await fetch('/sunjin/api/customers/list');
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json() as Promise<CustomerListResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
