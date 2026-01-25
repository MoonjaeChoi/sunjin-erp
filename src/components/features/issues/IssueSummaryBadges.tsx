'use client';

// Generated: 2026-01-25 22:20:00 KST

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIssueFilterStore } from '@/stores/issueFilterStore';

interface IssueSummaryBadgesProps {
  summary: {
    total: number;
    intake: number;
    in_progress: number;
    completed: number;
  };
}

export default function IssueSummaryBadges({
  summary,
}: IssueSummaryBadgesProps) {
  const filters = useIssueFilterStore((state) => state.filters);
  const updateFilter = useIssueFilterStore((state) => state.updateFilter);

  // 현재 선택된 상태 필터 확인
  const selectedStatuses = filters.status || [];
  const isIntakeSelected = selectedStatuses.includes('INTAKE');
  const isInProgressSelected = selectedStatuses.includes('IN_PROGRESS');
  const isCompletedSelected = selectedStatuses.includes('COMPLETED');
  const isAllSelected =
    selectedStatuses.length === 0 ||
    (isIntakeSelected && isInProgressSelected && isCompletedSelected);

  // 배지 클릭 핸들러
  const handleBadgeClick = (status: string) => {
    if (status === 'ALL') {
      // "전체" 클릭 시 모든 상태 필터 제거
      updateFilter('status', undefined);
    } else {
      // 해당 상태 토글
      const updated = selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status];

      updateFilter('status', updated.length > 0 ? (updated as any) : undefined);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3 flex-wrap">
        {/* 전체 */}
        <Button
          variant={isAllSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleBadgeClick('ALL')}
          className="flex items-center gap-2"
        >
          <span>전체</span>
          <Badge
            variant={isAllSelected ? 'secondary' : 'outline'}
            className={`text-sm px-2 py-0 ${
              isAllSelected ? 'bg-white text-black' : ''
            }`}
          >
            {summary.total}
          </Badge>
        </Button>

        {/* 접수 */}
        <Button
          variant={isIntakeSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleBadgeClick('INTAKE')}
          className="flex items-center gap-2"
        >
          <span>접수</span>
          <Badge
            className={`text-sm px-2 py-0 ${
              isIntakeSelected
                ? 'bg-white text-gray-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {summary.intake}
          </Badge>
        </Button>

        {/* 진행중 */}
        <Button
          variant={isInProgressSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleBadgeClick('IN_PROGRESS')}
          className="flex items-center gap-2"
        >
          <span>진행중</span>
          <Badge
            className={`text-sm px-2 py-0 ${
              isInProgressSelected
                ? 'bg-white text-blue-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {summary.in_progress}
          </Badge>
        </Button>

        {/* 완료 */}
        <Button
          variant={isCompletedSelected ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleBadgeClick('COMPLETED')}
          className="flex items-center gap-2"
        >
          <span>완료</span>
          <Badge
            className={`text-sm px-2 py-0 ${
              isCompletedSelected
                ? 'bg-white text-green-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {summary.completed}
          </Badge>
        </Button>
      </div>
    </Card>
  );
}
