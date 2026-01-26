// Generated: 2026-01-27 02:10:00 KST

'use client';

import type { MaintenanceContractHistory } from '@/types/maintenance';
import { useChangeTypeIcon } from '@/hooks/useMaintenanceUtils';
import { Button } from '@/components/ui/button';
import { History as HistoryIcon } from 'lucide-react';

interface MaintenanceContractHistoryProps {
  contractId: number;
  histories: MaintenanceContractHistory[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
}

/**
 * 유지보수 계약 변경 이력 컴포넌트
 * - Timeline 형식으로 변경 이력 표시
 * - 변경 타입별 아이콘 (갱신, 상태변경, 정보수정)
 * - 변경자, 변경 일시, 변경 사유
 * - 이전값 → 새로운값 (선택적)
 * - 페이지네이션
 */
export default function MaintenanceContractHistory({
  contractId,
  histories,
  pagination,
  isLoading = false,
  onPageChange,
}: MaintenanceContractHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (histories.length === 0) {
    return (
      <div className="text-center py-12">
        <HistoryIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">변경 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* History Items */}
        <div className="space-y-6">
          {histories.map((history) => (
            <MaintenanceContractHistoryItem key={history.id} history={history} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 mt-6">
          <p className="text-sm text-gray-500">
            총 {pagination.total}개 ({pagination.page} / {pagination.totalPages})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => onPageChange?.(Math.max(1, pagination.page - 1))}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 변경 이력 항목 (Timeline Item)
 * 변경 타입별 아이콘, 색상, 변경자 정보 표시
 */
function MaintenanceContractHistoryItem({
  history,
}: {
  history: MaintenanceContractHistory;
}) {
  const IconComponent = useChangeTypeIcon(history.change_type);

  const changeTypeColors: Record<string, { bg: string; icon: string }> = {
    갱신: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    상태변경: { bg: 'bg-purple-100', icon: 'text-purple-600' },
    정보수정: { bg: 'bg-green-100', icon: 'text-green-600' },
  };

  const colors = changeTypeColors[history.change_type] || {
    bg: 'bg-gray-100',
    icon: 'text-gray-600',
  };

  return (
    <div className="flex gap-4 relative">
      {/* Icon Circle */}
      <div
        className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}
      >
        <IconComponent className={`h-6 w-6 ${colors.icon}`} />
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        {/* Header: Change Type & Date */}
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-gray-900">
            {history.change_type}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(history.changed_at).toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Changed By */}
        <p className="text-sm text-gray-600 mb-2">{history.changed_by?.name}</p>

        {/* Reason */}
        {history.reason && (
          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 mb-2">
            {history.reason}
          </div>
        )}

        {/* Previous/New End Dates (for renewal) */}
        {history.change_type === '갱신' &&
          (history.previous_end_date || history.new_end_date) && (
            <div className="text-xs text-gray-600 space-y-1">
              {history.previous_end_date && (
                <p>
                  <span className="font-medium">이전 종료일:</span>{' '}
                  {new Date(history.previous_end_date).toLocaleDateString(
                    'ko-KR'
                  )}
                </p>
              )}
              {history.new_end_date && (
                <p>
                  <span className="font-medium">신규 종료일:</span>{' '}
                  {new Date(history.new_end_date).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
