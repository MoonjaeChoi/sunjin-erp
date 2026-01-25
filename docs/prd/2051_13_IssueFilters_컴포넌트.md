<!-- Generated: 2026-01-25 18:05:00 KST -->

# IssueFilters 컴포넌트

**문서 번호**: 2051_13
**원본 PRD**: 2051_장애_현황_관리_prd_v2.md ('6.2 페이지 레이아웃')
**구현 범위**: 필터 UI (고객사, 상태, 심각도, 담당자, 기간)
**복잡도**: M (Medium)
**의존성**: 2051_10 (Hooks), 2051_11 (Store)

---

## 구현 목표

필터 폼 컴포넌트를 구현한다:
- 고객사, 상태(다중선택), 심각도(다중선택), 담당자, 기간
- 필터 적용, 초기화 버튼
- Zustand 상태 연동

---

## 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/components/features/issues/IssueFilters.tsx

'use client';

import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface IssueFiltersProps {
  customers?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
}

export default function IssueFilters({ customers = [], employees = [] }: IssueFiltersProps) {
  const filters = useIssueFilterStore((state) => state.filters);
  const updateFilter = useIssueFilterStore((state) => state.updateFilter);
  const clearFilters = useIssueFilterStore((state) => state.clearFilters);

  const [statusSelected, setStatusSelected] = useState<string[]>(filters.status || []);
  const [severitySelected, setSeveritySelected] = useState<string[]>(filters.severity || []);

  const handleStatusChange = (status: string, checked: boolean) => {
    const updated = checked
      ? [...statusSelected, status]
      : statusSelected.filter((s) => s !== status);
    setStatusSelected(updated);
    updateFilter('status', updated.length > 0 ? updated : undefined);
  };

  const handleSeverityChange = (severity: string, checked: boolean) => {
    const updated = checked
      ? [...severitySelected, severity]
      : severitySelected.filter((s) => s !== severity);
    setSeveritySelected(updated);
    updateFilter('severity', updated.length > 0 ? updated : undefined);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 고객사 */}
        <div>
          <Label>고객사</Label>
          <Select value={filters.customer_id?.toString() || ''} onValueChange={(v) => {
            updateFilter('customer_id', v ? parseInt(v) : undefined);
          }}>
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
          <Label>담당자</Label>
          <Select value={filters.assignee_id?.toString() || ''} onValueChange={(v) => {
            updateFilter('assignee_id', v ? parseInt(v) : undefined);
          }}>
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
          <Label>기간 (시작)</Label>
          <Input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
          />
        </div>

        {/* 기간 종료 */}
        <div>
          <Label>기간 (종료)</Label>
          <Input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* 상태 (다중선택) */}
      <div>
        <Label>상태</Label>
        <div className="flex flex-wrap gap-3">
          {['INTAKE', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                id={`status_${status}`}
                checked={statusSelected.includes(status)}
                onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
              />
              <label htmlFor={`status_${status}`}>{getStatusLabel(status as any)}</label>
            </div>
          ))}
        </div>
      </div>

      {/* 심각도 (다중선택) */}
      <div>
        <Label>심각도</Label>
        <div className="flex flex-wrap gap-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
            <div key={severity} className="flex items-center gap-2">
              <Checkbox
                id={`severity_${severity}`}
                checked={severitySelected.includes(severity)}
                onCheckedChange={(checked) => handleSeverityChange(severity, checked as boolean)}
              />
              <label htmlFor={`severity_${severity}`}>{getSeverityLabel(severity as any)}</label>
            </div>
          ))}
        </div>
      </div>

      {/* 키워드 검색 */}
      <div>
        <Label>키워드</Label>
        <Input
          placeholder="제목 또는 설명으로 검색"
          value={filters.keyword || ''}
          onChange={(e) => updateFilter('keyword', e.target.value || undefined)}
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button variant="default">검색</Button>
        <Button variant="outline" onClick={clearFilters}>초기화</Button>
      </div>
    </Card>
  );
}
```

---

## Acceptance Criteria

- [ ] 고객사, 담당자, 기간, 상태, 심각도, 키워드 필터
- [ ] 상태/심각도 다중선택
- [ ] Zustand 상태 연동
- [ ] 검색/초기화 버튼
- [ ] 반응형 레이아웃
- [ ] TypeScript 빌드 성공

---

**다음 문서**: 2051_14_IssueDataTable_컴포넌트.md
