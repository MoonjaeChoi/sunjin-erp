// Generated: 2026-01-26 15:10:00 KST

import { Badge } from '@/components/ui/badge';
import { StatusBadgeProps } from '@/types/inventory';
import { InventoryService } from '@/lib/inventory-service';

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = InventoryService.getStatusBadgeColor(status);
  const label = InventoryService.formatStatusForDisplay(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-block ${colors.badge} ${colors.text} rounded-full ${sizeClasses[size]} font-medium`} style={{ textRendering: 'geometricPrecision' }}>
      {label}
    </span>
  );
}
