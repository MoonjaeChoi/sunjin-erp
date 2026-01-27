// Generated: 2026-01-27 02:00:00 KST

'use client';

import { MaintenanceContractDetail } from '@/types/maintenance';
import { useExpiryWarning } from '@/hooks/useMaintenanceUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Zap } from 'lucide-react';

interface MaintenanceContractDetailViewProps {
  contract: MaintenanceContractDetail;
  isLoading?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: () => void;
}

/**
 * 유지보수 계약 상세 정보 뷰 컴포넌트
 * - 계약 기본 정보 표시
 * - 고객사, 담당자, 담당 부서 정보
 * - 시작일, 종료일 (만료 경고 포함)
 * - 계약 상태 및 금액
 * - 생성/수정 정보
 * - 액션 버튼 (수정, 삭제, 상태 변경)
 */
export default function MaintenanceContractDetailView({
  contract,
  isLoading = false,
  onEdit,
  onDelete,
  onStatusChange,
}: MaintenanceContractDetailViewProps) {
  const expiryWarning = useExpiryWarning(contract.end_date);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status & Actions */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{contract.contract_name}</h2>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                contract.contract_status === '활성'
                  ? 'default'
                  : contract.contract_status === '종료'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {contract.contract_status}
            </Badge>
            {expiryWarning && expiryWarning.level !== 'safe' && (
              <span
                className={`text-sm font-medium ${
                  expiryWarning.level === 'danger'
                    ? 'text-red-600'
                    : expiryWarning.level === 'warning'
                    ? 'text-yellow-600'
                    : 'text-orange-600'
                }`}
              >
                {expiryWarning.message}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            수정
          </Button>
          <Button variant="outline" size="sm" onClick={onStatusChange}>
            <Zap className="mr-2 h-4 w-4" />
            상태 변경
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Row 1 */}
          <div>
            <label className="text-sm font-medium text-gray-500">고객사</label>
            <p className="text-base text-gray-900 mt-1">
              {contract.customer?.name || '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">계약 유형</label>
            <p className="text-base text-gray-900 mt-1">
              {contract.contract_type || '-'}
            </p>
          </div>

          {/* Row 2 */}
          <div>
            <label className="text-sm font-medium text-gray-500">담당자</label>
            <p className="text-base text-gray-900 mt-1">
              {contract.assignedEmployee?.name || '-'}
              {contract.assignedEmployee?.department && (
                <span className="text-sm text-gray-500 block">
                  ({contract.assignedEmployee.department})
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">계약 상태</label>
            <Badge
              variant={
                contract.contract_status === '활성'
                  ? 'default'
                  : contract.contract_status === '종료'
                  ? 'destructive'
                  : 'secondary'
              }
              className="mt-1"
            >
              {contract.contract_status}
            </Badge>
          </div>

          {/* Row 3 */}
          <div>
            <label className="text-sm font-medium text-gray-500">시작일</label>
            <p className="text-base text-gray-900 mt-1" suppressHydrationWarning>
              {contract.start_date
                ? new Date(contract.start_date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">종료일</label>
            <p
              className={`text-base mt-1 ${
                expiryWarning && expiryWarning.level !== 'safe'
                  ? expiryWarning.level === 'danger'
                    ? 'text-red-600 font-semibold'
                    : 'text-yellow-600 font-semibold'
                  : 'text-gray-900'
              }`}
              suppressHydrationWarning
            >
              {contract.end_date
                ? new Date(contract.end_date).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>

          {/* Row 4 */}
          <div>
            <label className="text-sm font-medium text-gray-500">계약금액</label>
            <p className="text-base text-gray-900 mt-1">
              {contract.contract_amount
                ? `${contract.contract_amount.toLocaleString('ko-KR')}원`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {contract.notes && (
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">비고</h3>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {contract.notes}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <label className="text-gray-500 font-medium">생성자</label>
            <p className="text-gray-900 mt-1">
              {contract.createdBy?.name || '-'}
            </p>
          </div>
          <div>
            <label className="text-gray-500 font-medium">생성일</label>
            <p className="text-gray-900 mt-1" suppressHydrationWarning>
              {contract.created_at
                ? new Date(contract.created_at).toLocaleString('ko-KR')
                : '-'}
            </p>
          </div>
          {contract.updatedBy && (
            <>
              <div>
                <label className="text-gray-500 font-medium">수정자</label>
                <p className="text-gray-900 mt-1">{contract.updatedBy.name || '-'}</p>
              </div>
              <div>
                <label className="text-gray-500 font-medium">수정일</label>
                <p className="text-gray-900 mt-1" suppressHydrationWarning>
                  {contract.updated_at
                    ? new Date(contract.updated_at).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
