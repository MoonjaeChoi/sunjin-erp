// Generated: 2026-01-26 15:12:00 KST

'use client';

import { InventoryStatsProps, InventoryStatus } from '@/types/inventory';
import { Card } from '@/components/ui/card';

const STATUS_LABELS: Record<InventoryStatus, string> = {
  '재고': '재고 중',
  '출고': '출고됨',
  '고장': '고장',
  '폐기': '폐기됨',
};

export default function InventoryStats({ stats, isLoading }: InventoryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {/* 전체 장비 */}
      <Card className="p-4 bg-blue-50 border-blue-200" data-testid="stat-card-total">
        <div className="text-sm text-gray-600 font-medium">전체 장비</div>
        <div className="text-3xl font-bold text-blue-700">{stats.totalCount}</div>
      </Card>

      {/* 재고 */}
      <Card className="p-4 bg-green-50 border-green-200" data-testid="stat-card-stock">
        <div className="text-sm text-gray-600 font-medium">재고 중</div>
        <div className="text-3xl font-bold text-green-700">{stats.byStatus['재고'] || 0}</div>
      </Card>

      {/* 출고 */}
      <Card className="p-4 bg-blue-50 border-blue-200" data-testid="stat-card-checkout">
        <div className="text-sm text-gray-600 font-medium">출고됨</div>
        <div className="text-3xl font-bold text-blue-700">{stats.byStatus['출고'] || 0}</div>
      </Card>

      {/* 고장 */}
      <Card className="p-4 bg-amber-50 border-amber-200" data-testid="stat-card-broken">
        <div className="text-sm text-gray-600 font-medium">고장</div>
        <div className="text-3xl font-bold text-amber-700">{stats.byStatus['고장'] || 0}</div>
      </Card>

      {/* 과기 장비 */}
      <Card className="p-4 bg-red-50 border-red-200" data-testid="stat-card-overdue">
        <div className="text-sm text-gray-600 font-medium">과기 장비</div>
        <div className="text-3xl font-bold text-red-700">{stats.overdue.count || 0}</div>
        <div className="text-xs text-gray-500 mt-1">{stats.overdue.percentage}%</div>
      </Card>
    </div>
  );
}
