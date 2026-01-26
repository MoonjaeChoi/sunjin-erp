// Generated: 2026-01-27 01:25:00 KST

'use client';

import { ContractStatsResponse } from '@/types/maintenance';
import { useContractStats } from '@/hooks/useMaintenanceUtils';
import { Activity, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

export interface MaintenanceContractStatsProps {
  stats: ContractStatsResponse['data'] | null;
  isLoading?: boolean;
}

/**
 * 유지보수 계약 통계 컴포넌트
 * - 총 계약 수
 * - 활성 계약 수
 * - 종료된 계약 수
 * - 갱신 예정 계약 수
 * - 30일/60일 내 만료 예정 계약 경고
 */
export default function MaintenanceContractStats({
  stats,
  isLoading = false,
}: MaintenanceContractStatsProps) {
  const { formattedStats } = useContractStats(stats);

  // 통계 카드 데이터
  const statCards = useMemo(
    () => [
      {
        label: '총 계약 수',
        value: formattedStats.total,
        icon: Activity,
        color: 'bg-blue-100 text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        label: '활성',
        value: formattedStats.activeCount,
        percent: `${formattedStats.activePercent}%`,
        icon: CheckCircle,
        color: 'bg-green-100 text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        label: '종료',
        value: formattedStats.terminatedCount,
        percent: `${formattedStats.terminatedPercent}%`,
        icon: XCircle,
        color: 'bg-red-100 text-red-600',
        bgColor: 'bg-red-50',
      },
      {
        label: '갱신예정',
        value: formattedStats.renewalPendingCount,
        percent: `${formattedStats.renewalPendingPercent}%`,
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
    ],
    [formattedStats]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`rounded-lg border p-6 ${card.bgColor}`}
              data-testid={`stat-card-${card.label}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                {card.percent && (
                  <span className="text-sm text-gray-500">{card.percent}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiring in 30 Days */}
        {formattedStats.expiringIn30Days > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 text-sm">
                  긴급: 30일 내 만료
                </h3>
                <p className="text-red-700 text-sm mt-1">
                  {formattedStats.expiringIn30Days}개의 계약이 30일 이내에 만료될 예정입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expiring in 60 Days */}
        {formattedStats.expiringIn60Days > formattedStats.expiringIn30Days && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900 text-sm">
                  주의: 60일 내 만료
                </h3>
                <p className="text-yellow-700 text-sm mt-1">
                  {formattedStats.expiringIn60Days}개의 계약이 60일 이내에 만료될 예정입니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Placeholder */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">계약 상태 분포</h3>
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              차트 컴포넌트 (recharts 또는 동일)는 이후 버전에서 추가됩니다.
            </p>
            <div className="flex gap-4 justify-center text-xs text-gray-400 mt-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>활성 {formattedStats.activeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>종료 {formattedStats.terminatedCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>갱신예정 {formattedStats.renewalPendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
