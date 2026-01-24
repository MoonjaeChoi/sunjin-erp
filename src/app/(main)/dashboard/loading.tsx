// Generated: 2026-01-24 23:30:00 KST

import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8" />
        ))}
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={`cell-${i}`} className="h-[100px]" />
        ))}
      </div>
    </div>
  );
}
