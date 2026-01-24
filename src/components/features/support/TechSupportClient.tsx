// Generated: 2026-01-25 06:30:00 KST

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTechSupportSearchQuery } from '@/hooks/support';
import type { TechSupportSearchParams, SupportType, SupportMethod, SupportStatus } from '@/types/tech-support';
import { TechSupportFilters } from './TechSupportFilters';
import { TechSupportDataTable } from './TechSupportDataTable';
import { TechSupportCreateDialog } from './TechSupportCreateDialog';
import { TechSupportDetailDialog } from './TechSupportDetailDialog';

function parseSearchParams(sp: URLSearchParams): TechSupportSearchParams {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  return {
    date_from: sp.get('date_from') || monthAgo.toISOString().split('T')[0],
    date_to: sp.get('date_to') || today.toISOString().split('T')[0],
    customer_id: sp.get('customer_id') ? Number(sp.get('customer_id')) : undefined,
    support_type: (sp.get('support_type') as SupportType) || undefined,
    support_method: (sp.get('support_method') as SupportMethod) || undefined,
    status: (sp.get('status') as SupportStatus) || undefined,
    keyword: sp.get('keyword') || undefined,
    page: Number(sp.get('page') || '1'),
    page_size: Number(sp.get('page_size') || '20'),
    sort_by: sp.get('sort_by') || 'support_date',
    sort_order: (sp.get('sort_order') || 'DESC') as 'ASC' | 'DESC',
  };
}

export function TechSupportClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = parseSearchParams(searchParams);

  const { data, isLoading, isPlaceholderData } = useTechSupportSearchQuery(params);

  const detailId = searchParams.get('detail') ? Number(searchParams.get('detail')) : null;
  const isCreateOpen = searchParams.get('create') === 'true';

  const handleUpdate = (partial: Partial<TechSupportSearchParams> & { detail?: number | null; create?: boolean }) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if ('detail' in partial) {
      if (partial.detail === null) newParams.delete('detail');
      else newParams.set('detail', String(partial.detail));
    }
    if ('create' in partial) {
      if (!partial.create) newParams.delete('create');
      else newParams.set('create', 'true');
    }

    Object.entries(partial).forEach(([key, value]) => {
      if (key === 'detail' || key === 'create') return;
      if (value === undefined || value === '') newParams.delete(key);
      else newParams.set(key, String(value));
    });

    router.push(`/support?${newParams.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">기술지원 관리</h1>
        <Button onClick={() => handleUpdate({ create: true })}>
          <Plus className="h-4 w-4 mr-1" />
          등록
        </Button>
      </div>

      <TechSupportFilters params={params} onUpdate={handleUpdate} />
      <TechSupportDataTable
        data={data}
        isLoading={isLoading}
        isPlaceholderData={isPlaceholderData}
        params={params}
        onUpdate={handleUpdate}
      />

      <TechSupportCreateDialog
        open={isCreateOpen}
        onClose={() => handleUpdate({ create: false })}
      />
      <TechSupportDetailDialog
        supportId={detailId}
        onClose={() => handleUpdate({ detail: null })}
      />
    </div>
  );
}
