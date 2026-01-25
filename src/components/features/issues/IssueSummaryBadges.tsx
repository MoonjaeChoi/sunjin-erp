'use client';

// Generated: 2026-01-25 18:05:00 KST

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
  return (
    <Card className="p-4">
      <div className="flex gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">전체</span>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {summary.total}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">접수</span>
          <Badge className="bg-gray-100 text-gray-800 text-base px-3 py-1">
            {summary.intake}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">진행중</span>
          <Badge className="bg-blue-100 text-blue-800 text-base px-3 py-1">
            {summary.in_progress}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">완료</span>
          <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
            {summary.completed}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
