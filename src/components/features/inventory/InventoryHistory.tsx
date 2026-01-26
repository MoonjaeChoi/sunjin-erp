// Generated: 2026-01-26 21:05:00 KST

'use client';

import { InventoryHistoryRecord, ChangeTypeLabel, InventoryStatusLabel } from '@/types/inventory';

interface InventoryHistoryProps {
  histories: InventoryHistoryRecord[];
}

export default function InventoryHistory({ histories }: InventoryHistoryProps) {
  if (histories.length === 0) {
    return <div className="text-sm text-muted-foreground">변경 이력이 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      {histories.map((history, idx) => (
        <div key={history.id || idx} className="border-l-2 border-blue-500 pl-4 py-2">
          {/* Header: Change Type and Timestamp */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm">{ChangeTypeLabel[history.change_type]}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(history.changed_at).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Who made the change */}
          <div className="text-xs text-muted-foreground mb-2">{history.changed_by.name}</div>

          {/* Details based on change type */}
          <div className="text-sm space-y-1">
            {/* Status Change */}
            {history.previous_status && history.new_status && (
              <div>
                상태: <span className="font-medium">{InventoryStatusLabel[history.previous_status]}</span>
                {' → '}
                <span className="font-medium">{InventoryStatusLabel[history.new_status]}</span>
              </div>
            )}

            {/* Location Change */}
            {history.previous_location && history.new_location && (
              <div>
                위치: <span className="font-medium">{history.previous_location}</span>
                {' → '}
                <span className="font-medium">{history.new_location}</span>
              </div>
            )}

            {/* Checkout Location (for checkout event) */}
            {history.checkout_location && (
              <div>
                사용처: <span className="font-medium">{history.checkout_location}</span>
              </div>
            )}

            {/* Expected Checkin Date */}
            {history.expected_checkin_date && (
              <div>
                예정 반납일: <span className="font-medium">{history.expected_checkin_date}</span>
              </div>
            )}

            {/* Reason */}
            {history.reason && <div className="text-muted-foreground italic">사유: {history.reason}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
