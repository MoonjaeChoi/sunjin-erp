// Generated: 2026-01-27 01:20:00 KST

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContractFilters, ContractStatus } from '@/types/maintenance';
import { useState } from 'react';
import { X, Filter } from 'lucide-react';

export interface MaintenanceContractFiltersProps {
  onFilterChange?: (filters: ContractFilters) => void;
  onReset?: () => void;
}

/**
 * 유지보수 계약 필터 패널 컴포넌트
 * - 상태별 필터 (활성/종료/갱신예정)
 * - 계약명 검색
 * - 날짜 범위 필터
 * - 고객사, 담당자 선택 (다이알로그에서 구현 2071_18)
 */
export default function MaintenanceContractFilters({
  onFilterChange,
  onReset,
}: MaintenanceContractFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<ContractFilters>({});

  // 필터 적용
  const handleApply = () => {
    onFilterChange?.(filters);
  };

  // 필터 초기화
  const handleReset = () => {
    setFilters({});
    onReset?.();
  };

  // 필터 변경
  const updateFilter = (key: keyof ContractFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const hasActiveFilters = Object.keys(filters).some((key) => filters[key as keyof ContractFilters] !== undefined);

  return (
    <div className="rounded-lg border bg-white">
      {/* Filter Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 border-b hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-gray-900">필터</span>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
              활성화됨
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasActiveFilters) handleReset();
          }}
          className={hasActiveFilters ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400'}
          title="필터 초기화"
        >
          <X className="h-4 w-4" />
        </button>
      </button>

      {/* Filter Fields */}
      {isExpanded && (
        <div className="px-6 py-4 space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약 상태
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="활성">활성</option>
              <option value="종료">종료</option>
              <option value="갱신예정">갱신예정</option>
            </select>
          </div>

          {/* Contract Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계약명
            </label>
            <Input
              type="text"
              placeholder="계약명으로 검색"
              value={filters.contractNameSearch || ''}
              onChange={(e) => updateFilter('contractNameSearch', e.target.value || undefined)}
              className="text-sm"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 (From)
              </label>
              <Input
                type="date"
                value={
                  filters.startDateFrom instanceof Date
                    ? filters.startDateFrom.toISOString().split('T')[0]
                    : filters.startDateFrom || ''
                }
                onChange={(e) => updateFilter('startDateFrom', e.target.value || undefined)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작일 (To)
              </label>
              <Input
                type="date"
                value={
                  filters.startDateTo instanceof Date
                    ? filters.startDateTo.toISOString().split('T')[0]
                    : filters.startDateTo || ''
                }
                onChange={(e) => updateFilter('startDateTo', e.target.value || undefined)}
                className="text-sm"
              />
            </div>
          </div>

          {/* End Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 (From)
              </label>
              <Input
                type="date"
                value={
                  filters.endDateFrom instanceof Date
                    ? filters.endDateFrom.toISOString().split('T')[0]
                    : filters.endDateFrom || ''
                }
                onChange={(e) => updateFilter('endDateFrom', e.target.value || undefined)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료일 (To)
              </label>
              <Input
                type="date"
                value={
                  filters.endDateTo instanceof Date
                    ? filters.endDateTo.toISOString().split('T')[0]
                    : filters.endDateTo || ''
                }
                onChange={(e) => updateFilter('endDateTo', e.target.value || undefined)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Note */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-700">
              고객사 및 담당자 필터는 2071_18 모달 컴포넌트에서 구현됩니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasActiveFilters}
            >
              초기화
            </Button>
            <Button onClick={handleApply}>
              필터 적용
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
