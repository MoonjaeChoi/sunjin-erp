// Generated: 2026-01-25 15:35:00 KST

'use client';

import { useMemo } from 'react';
import { useProjectSummaryQuery } from '@/hooks/projects';
import { ProjectStatus, ProjectStatusLabel, ProjectStatusColor } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectSummaryBadgesProps {
  selectedStatuses?: ProjectStatus[];
  onStatusChange?: (statuses: ProjectStatus[]) => void;
  filters?: {
    customer_id?: number;
    employee_id?: number;
  };
}

const STATUS_ORDER: ProjectStatus[] = ['PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

/**
 * 프로젝트 상태별 카운트를 배지로 표시하는 컴포넌트
 * 각 배지는 클릭 가능하며 필터링을 트리거
 */
export function ProjectSummaryBadges({
  selectedStatuses = [],
  onStatusChange,
  filters = {},
}: ProjectSummaryBadgesProps) {
  const { data: summary, isLoading } = useProjectSummaryQuery(filters);

  // 총합 계산
  const total = useMemo(() => {
    if (!summary) return 0;
    return summary.preparing + summary.in_progress + summary.completed + summary.on_hold;
  }, [summary]);

  const handleStatusClick = (status: ProjectStatus) => {
    if (!onStatusChange) return;

    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    onStatusChange(newStatuses);
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="h-10 w-20 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* 전체 */}
      <Badge
        variant={selectedStatuses.length === 0 ? 'default' : 'outline'}
        className={cn(
          'cursor-pointer px-3 py-2 text-sm font-semibold',
          selectedStatuses.length === 0 ? 'ring-2 ring-offset-1' : ''
        )}
      >
        전체 {total}
      </Badge>

      {/* 상태별 배지 */}
      {STATUS_ORDER.map((status) => {
        const count = summary[status.toLowerCase() as keyof typeof summary] ?? 0;
        const colors = ProjectStatusColor[status];
        const isSelected = selectedStatuses.includes(status);

        return (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all',
              isSelected
                ? `${colors.bg} ${colors.text} ring-2 ring-offset-1`
                : `${colors.bg} ${colors.text} hover:opacity-80`
            )}
          >
            {ProjectStatusLabel[status]}
            <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-xs font-bold">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
