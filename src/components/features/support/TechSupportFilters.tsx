// Generated: 2026-01-25 06:30:00 KST

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, ChevronsUpDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SupportTypeLabel,
  SupportMethodLabel,
  SupportStatusLabel,
} from '@/types/tech-support';
import type { TechSupportSearchParams } from '@/types/tech-support';
import { useCustomerListQuery } from '@/hooks/customers';
import { cn } from '@/lib/utils';

const DEBOUNCE_DATE = 300;
const DEBOUNCE_KEYWORD = 500;
const MAX_DATE_RANGE_DAYS = 365;

interface TechSupportFiltersProps {
  params: TechSupportSearchParams;
  onUpdate: (partial: Partial<TechSupportSearchParams>) => void;
}

function getDaysDiff(from: string, to: string): number {
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function TechSupportFilters({ params, onUpdate }: TechSupportFiltersProps) {
  const [dateFrom, setDateFrom] = useState(params.date_from);
  const [dateTo, setDateTo] = useState(params.date_to);
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [comboOpen, setComboOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const dateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keywordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  const { data: customerData } = useCustomerListQuery();
  const customers = customerData?.customers || [];

  // 외부 params 변경 시 동기화
  useEffect(() => {
    setDateFrom(params.date_from);
    setDateTo(params.date_to);
    setKeyword(params.keyword || '');
  }, [params.date_from, params.date_to, params.keyword]);

  // 날짜 에러
  const dateError = (() => {
    if (dateFrom && dateTo) {
      if (new Date(dateFrom) > new Date(dateTo)) return '시작일이 종료일보다 늦습니다.';
      if (getDaysDiff(dateFrom, dateTo) > MAX_DATE_RANGE_DAYS) return '검색 기간은 최대 1년입니다.';
    }
    return null;
  })();

  // Date debounce
  const debouncedDateUpdate = useCallback(
    (from: string, to: string) => {
      if (dateTimerRef.current) clearTimeout(dateTimerRef.current);
      dateTimerRef.current = setTimeout(() => {
        if (from && to && new Date(from) <= new Date(to) && getDaysDiff(from, to) <= MAX_DATE_RANGE_DAYS) {
          onUpdate({ date_from: from, date_to: to, page: 1 });
        }
      }, DEBOUNCE_DATE);
    },
    [onUpdate]
  );

  // Keyword debounce
  const debouncedKeywordUpdate = useCallback(
    (value: string) => {
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
      keywordTimerRef.current = setTimeout(() => {
        if (value.length >= 2 || value === '') {
          onUpdate({ keyword: value || undefined, page: 1 });
        }
      }, DEBOUNCE_KEYWORD);
    },
    [onUpdate]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (dateTimerRef.current) clearTimeout(dateTimerRef.current);
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    };
  }, []);

  // Combobox outside click
  useEffect(() => {
    if (!comboOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [comboOpen]);

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    debouncedDateUpdate(value, dateTo);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    debouncedDateUpdate(dateFrom, value);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    debouncedKeywordUpdate(value);
  };

  const handleReset = () => {
    if (dateTimerRef.current) clearTimeout(dateTimerRef.current);
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);

    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const from = monthAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    setDateFrom(from);
    setDateTo(to);
    setKeyword('');

    onUpdate({
      date_from: from,
      date_to: to,
      customer_id: undefined,
      support_type: undefined,
      support_method: undefined,
      status: undefined,
      keyword: undefined,
      page: 1,
    });
  };

  const selectedCustomer = customers.find((c) => c.id === params.customer_id);
  const filteredCustomers = customerSearch
    ? customers.filter((c) => c.name.includes(customerSearch))
    : customers;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">검색 필터</h2>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          초기화
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* 시작일 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">시작일</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
        </div>

        {/* 종료일 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">종료일</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
        </div>

        {/* 고객사 Combobox */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">고객사</label>
          <div className="relative" ref={comboRef}>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              onClick={() => setComboOpen(!comboOpen)}
            >
              <span className="truncate">
                {selectedCustomer ? selectedCustomer.name : '전체'}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {comboOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                <div className="p-2">
                  <Input
                    placeholder="고객사 검색..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  <button
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                      !params.customer_id && 'font-medium'
                    )}
                    onClick={() => {
                      onUpdate({ customer_id: undefined, page: 1 });
                      setComboOpen(false);
                      setCustomerSearch('');
                    }}
                  >
                    {!params.customer_id && <Check className="h-4 w-4" />}
                    {params.customer_id && <span className="w-4" />}
                    전체
                  </button>
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                        params.customer_id === customer.id && 'font-medium'
                      )}
                      onClick={() => {
                        onUpdate({ customer_id: customer.id, page: 1 });
                        setComboOpen(false);
                        setCustomerSearch('');
                      }}
                    >
                      {params.customer_id === customer.id && <Check className="h-4 w-4" />}
                      {params.customer_id !== customer.id && <span className="w-4" />}
                      {customer.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 지원 유형 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">지원 유형</label>
          <Select
            value={params.support_type || 'ALL'}
            onValueChange={(v) => onUpdate({ support_type: v === 'ALL' ? undefined : v as any, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(SupportTypeLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 지원 방법 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">지원 방법</label>
          <Select
            value={params.support_method || 'ALL'}
            onValueChange={(v) => onUpdate({ support_method: v === 'ALL' ? undefined : v as any, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(SupportMethodLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 상태 */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">상태</label>
          <Select
            value={params.status || 'ALL'}
            onValueChange={(v) => onUpdate({ status: v === 'ALL' ? undefined : v as any, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(SupportStatusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 키워드 */}
        <div className="space-y-1 md:col-span-2 xl:col-span-2">
          <label className="text-xs text-muted-foreground">키워드 (제목 검색, 2자 이상)</label>
          <Input
            type="text"
            placeholder="검색어를 입력하세요..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            maxLength={100}
          />
        </div>
      </div>

      {dateError && <p className="text-sm text-destructive">{dateError}</p>}
    </div>
  );
}
