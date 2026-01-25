// Generated: 2026-01-25 15:38:00 KST

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useEmployeeListQuery } from '@/hooks/employees';
import { useCustomerListQuery } from '@/hooks/customers';
import {
  ProjectSearchParams,
  ProjectStatus,
  ProjectStatusLabel,
  ProjectStatusColor,
} from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectFiltersProps {
  params: ProjectSearchParams;
  onUpdate: (params: Partial<ProjectSearchParams>) => void;
}

const KEYWORD_DEBOUNCE_MS = 500;
const FILTER_DEBOUNCE_MS = 300;
const KEYWORD_MIN_LENGTH = 2;
const ALL_STATUSES: ProjectStatus[] = ['PREPARING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];

/**
 * 프로젝트 목록 필터링 컴포넌트
 * 고객사, 상태, 담당자, 키워드 필터를 제공합니다.
 */
export function ProjectFilters({ params, onUpdate }: ProjectFiltersProps) {
  // ============================================================================
  // 1. 상태 관리
  // ============================================================================
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // ============================================================================
  // 2. 데이터 조회
  // ============================================================================
  const { data: employeesData } = useEmployeeListQuery();
  const { data: customersData } = useCustomerListQuery();

  // ============================================================================
  // 3. Debounce 함수
  // ============================================================================
  const debouncedKeywordUpdate = useDebouncedCallback((value: string) => {
    // 2자 이상일 때만 검색, 빈 문자열은 필터 해제
    if (value.length >= KEYWORD_MIN_LENGTH || value.length === 0) {
      onUpdate({ keyword: value || undefined });
    }
  }, KEYWORD_DEBOUNCE_MS);

  const debouncedFilterUpdate = useDebouncedCallback(
    (filterParams: Partial<ProjectSearchParams>) => {
      onUpdate(filterParams);
    },
    FILTER_DEBOUNCE_MS
  );

  // ============================================================================
  // 4. 이벤트 핸들러
  // ============================================================================
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedKeywordUpdate(value);
  };

  const handleCustomerSelect = (customerId: number) => {
    debouncedFilterUpdate({
      customer_id: params.customer_id === customerId ? undefined : customerId,
    });
    setCustomerOpen(false);
  };

  const handleStatusToggle = (status: ProjectStatus) => {
    const currentStatuses = params.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    debouncedFilterUpdate({
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleEmployeeSelect = (employeeId: string) => {
    debouncedFilterUpdate({
      employee_id: employeeId === 'all' ? undefined : Number(employeeId),
    });
  };

  const handleReset = useCallback(() => {
    setKeyword('');
    onUpdate({
      customer_id: undefined,
      status: undefined,
      employee_id: undefined,
      keyword: undefined,
    });
  }, [onUpdate]);

  // ============================================================================
  // 5. Effect - 외부 params 변경 시 동기화
  // ============================================================================
  useEffect(() => {
    setKeyword(params.keyword || '');
  }, [params.keyword]);

  // ============================================================================
  // 6. 상태 확인
  // ============================================================================
  const hasActiveFilter =
    params.customer_id || params.status?.length || params.employee_id || params.keyword;

  // ============================================================================
  // 7. 렌더링
  // ============================================================================
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* 고객사 Combobox */}
      <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={customerOpen}
            className="w-[200px] justify-between"
          >
            {params.customer_id
              ? customersData?.customers.find((c) => c.id === params.customer_id)?.name ||
                '고객사'
              : '고객사 선택'}
            <span className="ml-2">↓</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="고객사 검색..." />
            <CommandEmpty>검색 결과 없음</CommandEmpty>
            <CommandGroup>
              {customersData?.customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.name}
                  onSelect={() => handleCustomerSelect(customer.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'h-4 w-4 border border-gray-300 rounded',
                        params.customer_id === customer.id && 'bg-blue-500'
                      )}
                    />
                    {customer.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 상태 멀티셀렉트 */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[160px] justify-between">
            {params.status?.length ? `상태 (${params.status.length})` : '상태 선택'}
            <span className="ml-2">↓</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[180px] p-3">
          <div className="space-y-2">
            {ALL_STATUSES.map((status) => {
              const colors = ProjectStatusColor[status];
              return (
                <label
                  key={status}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer rounded px-2 py-1 transition-colors hover:bg-gray-100'
                  )}
                >
                  <Checkbox
                    checked={params.status?.includes(status) || false}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <span
                    className={cn('text-sm font-medium', colors.text)}
                  >
                    {ProjectStatusLabel[status]}
                  </span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 담당자 Select */}
      <Select
        value={params.employee_id ? String(params.employee_id) : 'all'}
        onValueChange={handleEmployeeSelect}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="담당자 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 담당자</SelectItem>
          {employeesData?.employees.map((emp) => (
            <SelectItem key={emp.id} value={String(emp.id)}>
              {emp.name} ({emp.department_name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 키워드 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="프로젝트명, 코드 검색 (2자 이상)"
          value={keyword}
          onChange={handleKeywordChange}
          className="pl-9 w-[250px]"
        />
      </div>

      {/* 초기화 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        disabled={!hasActiveFilter}
        className="gap-1"
      >
        <RotateCcw className="h-4 w-4" />
        초기화
      </Button>
    </div>
  );
}
