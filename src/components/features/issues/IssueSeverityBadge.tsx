'use client';

// Generated: 2026-01-25 23:00:00 KST

import { Badge } from '@/components/ui/badge';
import { IssueSeverity } from '@/types/issue';

interface IssueSeverityBadgeProps {
  severity: IssueSeverity;
}

export function IssueSeverityBadge({ severity }: IssueSeverityBadgeProps) {
  const config: Record<IssueSeverity, { label: string; className: string; icon: string }> = {
    CRITICAL: {
      label: '심각',
      className: 'bg-red-100 text-red-700',
      icon: '🔴',
    },
    HIGH: {
      label: '높음',
      className: 'bg-orange-100 text-orange-700',
      icon: '🟠',
    },
    MEDIUM: {
      label: '보통',
      className: 'bg-yellow-100 text-yellow-700',
      icon: '🟡',
    },
    LOW: {
      label: '낮음',
      className: 'bg-green-100 text-green-700',
      icon: '🟢',
    },
  };

  const config_value = config[severity];

  return (
    <Badge className={config_value.className}>
      <span className="mr-1">{config_value.icon}</span>
      {config_value.label}
    </Badge>
  );
}
