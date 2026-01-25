'use client';

// Generated: 2026-01-25 23:00:00 KST

import { Badge } from '@/components/ui/badge';
import { IssueStatus } from '@/types/issue';

interface IssueStatusBadgeProps {
  status: IssueStatus;
}

export function IssueStatusBadge({ status }: IssueStatusBadgeProps) {
  const config: Record<IssueStatus, { label: string; className: string; icon: string }> = {
    INTAKE: {
      label: '접수',
      className: 'bg-slate-100 text-slate-800',
      icon: '○',
    },
    IN_PROGRESS: {
      label: '진행중',
      className: 'bg-blue-100 text-blue-800',
      icon: '⏳',
    },
    COMPLETED: {
      label: '완료',
      className: 'bg-green-100 text-green-800',
      icon: '✓',
    },
  };

  const config_value = config[status];

  return (
    <Badge className={config_value.className}>
      <span className="mr-1">{config_value.icon}</span>
      {config_value.label}
    </Badge>
  );
}
