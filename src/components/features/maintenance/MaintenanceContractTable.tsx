// Generated: 2026-01-27 01:15:00 KST

'use client';

import Link from 'next/link';
import { MaintenanceContractDetail, ContractStatus } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { useStatusBadge, useExpiryWarning } from '@/hooks/useMaintenanceUtils';
import { MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface MaintenanceContractTableProps {
  contracts: MaintenanceContractDetail[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  onPageChange?: (page: number) => void;
  onSort?: (sortBy: string, order: 'ASC' | 'DESC') => void;
  isLoading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

/**
 * 유지보수 계약 목록 테이블 컴포넌트
 * - 정렬 기능 (컬럼별)
 * - 페이지네이션
 * - 상태 배지 및 만료 경고 표시
 * - 행 액션 (수정, 삭제, 상세보기)
 */
export default function MaintenanceContractTable({
  contracts,
  pagination,
  sortBy,
  order,
  onPageChange,
  onSort,
  isLoading,
  onEdit,
  onDelete,
}: MaintenanceContractTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);

  // 정렬 처리
  const handleSort = (column: string) => {
    const newOrder = sortBy === column && order === 'ASC' ? 'DESC' : 'ASC';
    onSort?.(column, newOrder);
  };

  // 선택 박스 토글
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 전체 선택
  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === contracts.length
        ? []
        : contracts.map((c) => c.id)
    );
  };

  // 정렬 아이콘 렌더링
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return order === 'ASC' ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-gray-500">계약이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm text-blue-900">
            {selectedIds.length}개 선택됨
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              상태 변경
            </Button>
            <Button size="sm" variant="destructive">
              일괄 삭제
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === contracts.length && contracts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('contract_name')}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                >
                  계약명
                  <SortIcon column="contract_name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">
                <button
                  onClick={() => handleSort('customer_name')}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                >
                  고객사
                  <SortIcon column="customer_name" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('contract_status')}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                >
                  상태
                  <SortIcon column="contract_status" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 hidden md:table-cell">
                <button
                  onClick={() => handleSort('end_date')}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                >
                  만료일
                  <SortIcon column="end_date" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell">
                <button
                  onClick={() => handleSort('assigned_employee_name')}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                >
                  담당자
                  <SortIcon column="assigned_employee_name" />
                </button>
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <MaintenanceContractTableRow
                key={contract.id}
                contract={contract}
                selectedIds={selectedIds}
                toggleSelect={toggleSelect}
                showActionMenu={showActionMenu}
                setShowActionMenu={setShowActionMenu}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
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
 * 테이블 행 컴포넌트
 * React Hooks를 행 레벨에서 사용하기 위한 별도 컴포넌트
 */
function MaintenanceContractTableRow({
  contract,
  selectedIds,
  toggleSelect,
  showActionMenu,
  setShowActionMenu,
  onDelete,
}: {
  contract: MaintenanceContractDetail;
  selectedIds: number[];
  toggleSelect: (id: number) => void;
  showActionMenu: number | null;
  setShowActionMenu: (id: number | null) => void;
  onDelete?: (id: number) => void;
}) {
  const badgeProps = useStatusBadge(contract.contract_status as ContractStatus);
  const expiryWarning = useExpiryWarning(contract.end_date);

  return (
    <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selectedIds.includes(contract.id)}
          onChange={() => toggleSelect(contract.id)}
          className="rounded"
        />
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/maintenance/${contract.id}`}
          className="text-sm font-medium text-blue-600 hover:underline block truncate max-w-[200px] lg:max-w-[300px]"
        >
          {contract.contract_name}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 hidden md:table-cell">
        {contract.customer?.name || '-'}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
            contract.contract_status === '활성'
              ? 'bg-green-100 text-green-800'
              : contract.contract_status === '종료'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {contract.contract_status}
        </span>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <div className="text-sm">
          <div className="text-gray-900">
            {contract.end_date
              ? new Date(contract.end_date).toLocaleDateString('ko-KR')
              : '-'}
          </div>
          {expiryWarning && expiryWarning.level !== 'safe' && (
            <div
              className={`text-xs mt-1 ${
                expiryWarning.level === 'danger'
                  ? 'text-red-600'
                  : expiryWarning.level === 'warning'
                  ? 'text-yellow-600'
                  : 'text-orange-600'
              }`}
            >
              {expiryWarning.message}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 hidden lg:table-cell">
        {contract.assignedEmployee?.name || '-'}
      </td>
      <td className="px-6 py-4 text-center relative">
        <button
          onClick={() =>
            setShowActionMenu(showActionMenu === contract.id ? null : contract.id)
          }
          className="text-gray-400 hover:text-gray-600 inline-block"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {showActionMenu === contract.id && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
            <Link href={`/maintenance/${contract.id}`}>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg">
                상세보기
              </button>
            </Link>
            <Link href={`/maintenance/${contract.id}/edit`}>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                수정
              </button>
            </Link>
            <button
              onClick={() => {
                onDelete?.(contract.id);
                setShowActionMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
            >
              삭제
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
