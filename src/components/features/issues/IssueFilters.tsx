'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useState } from 'react';
import { useIssueFilterStore } from '@/stores/issueFilterStore';
import { getStatusLabel, getSeverityLabel } from '@/types/issue';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

interface IssueFiltersProps {
  customers?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
}

export default function IssueFilters({
  customers = [],
  employees = [],
}: IssueFiltersProps) {
  const filters = useIssueFilterStore((state) => state.filters);
  const updateFilter = useIssueFilterStore((state) => state.updateFilter);
  const clearFilters = useIssueFilterStore((state) => state.clearFilters);

  const [statusSelected, setStatusSelected] = useState<string[]>(
    filters.status || []
  );
  const [severitySelected, setSeveritySelected] = useState<string[]>(
    filters.severity || []
  );

  const handleStatusChange = (status: string, checked: boolean) => {
    const updated = checked
      ? [...statusSelected, status]
      : statusSelected.filter((s) => s !== status);
    setStatusSelected(updated);
    updateFilter('status', updated.length > 0 ? (updated as any) : undefined);
  };

  const handleSeverityChange = (severity: string, checked: boolean) => {
    const updated = checked
      ? [...severitySelected, severity]
      : severitySelected.filter((s) => s !== severity);
    setSeveritySelected(updated);
    updateFilter('severity', updated.length > 0 ? (updated as any) : undefined);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 고객사 */}
        <div>
          <label className="text-sm font-medium">고객사</label>
          <Select
            value={filters.customer_id?.toString() || ''}
            onValueChange={(v) => {
              updateFilter('customer_id', v ? parseInt(v) : undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 담당자 */}
        <div>
          <label className="text-sm font-medium">담당자</label>
          <Select
            value={filters.assignee_id?.toString() || ''}
            onValueChange={(v) => {
              updateFilter('assignee_id', v ? parseInt(v) : undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id.toString()}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 기간 시작 */}
        <div>
          <label className="text-sm font-medium">기간 (시작)</label>
          <Input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) =>
              updateFilter('date_from', e.target.value || undefined)
            }
          />
        </div>

        {/* 기간 종료 */}
        <div>
          <label className="text-sm font-medium">기간 (종료)</label>
          <Input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) =>
              updateFilter('date_to', e.target.value || undefined)
            }
          />
        </div>
      </div>

      {/* 상태 (다중선택) */}
      <div>
        <label className="text-sm font-medium block mb-2">상태</label>
        <div className="flex flex-wrap gap-3">
          {['INTAKE', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                id={`status_${status}`}
                checked={statusSelected.includes(status)}
                onCheckedChange={(checked) =>
                  handleStatusChange(status, checked as boolean)
                }
              />
              <label htmlFor={`status_${status}`}>
                {getStatusLabel(status as any)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 심각도 (다중선택) */}
      <div>
        <label className="text-sm font-medium block mb-2">심각도</label>
        <div className="flex flex-wrap gap-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
            <div key={severity} className="flex items-center gap-2">
              <Checkbox
                id={`severity_${severity}`}
                checked={severitySelected.includes(severity)}
                onCheckedChange={(checked) =>
                  handleSeverityChange(severity, checked as boolean)
                }
              />
              <label htmlFor={`severity_${severity}`}>
                {getSeverityLabel(severity as any)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* 키워드 검색 */}
      <div>
        <label className="text-sm font-medium block mb-2">키워드</label>
        <Input
          placeholder="제목 또는 설명으로 검색"
          value={filters.keyword || ''}
          onChange={(e) =>
            updateFilter('keyword', e.target.value || undefined)
          }
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button variant="default">검색</Button>
        <Button variant="outline" onClick={clearFilters}>
          초기화
        </Button>
      </div>
    </Card>
  );
}
