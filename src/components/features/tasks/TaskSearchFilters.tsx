// Generated: 2026-01-25 03:50:00 KST

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
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
  TaskType,
  TaskTypeLabel,
  WorkType,
  WorkTypeLabel,
  TaskStatus,
  TaskStatusLabel,
} from '@/types/task';
import { TaskSearchParams } from '@/types/task-search';

const DEBOUNCE_SELECT = 300;
const DEBOUNCE_KEYWORD = 500;
const MAX_DATE_RANGE_DAYS = 365;

interface TaskSearchFiltersProps {
  params: TaskSearchParams;
  onUpdate: (updates: Partial<TaskSearchParams>) => void;
}

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const lastDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { firstDay, lastDate };
}

function getDaysDiff(from: string, to: string): number {
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function TaskSearchFilters({ params, onUpdate }: TaskSearchFiltersProps) {
  // 로컬 필터 상태 (즉시 UI 반영용)
  const [dateFrom, setDateFrom] = useState(params.date_from);
  const [dateTo, setDateTo] = useState(params.date_to);
  const [type, setType] = useState(params.type || '');
  const [workType, setWorkType] = useState(params.work_type || '');
  const [status, setStatus] = useState(params.status || '');
  const [keyword, setKeyword] = useState(params.keyword || '');

  // debounce timer refs
  const selectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keywordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // params 외부 변경 시 로컬 동기화 (뒤로가기 등)
  useEffect(() => {
    setDateFrom(params.date_from);
    setDateTo(params.date_to);
    setType(params.type || '');
    setWorkType(params.work_type || '');
    setStatus(params.status || '');
    setKeyword(params.keyword || '');
  }, [params.date_from, params.date_to, params.type, params.work_type, params.status, params.keyword]);

  // 날짜 범위 에러 체크
  const dateError = (() => {
    if (dateFrom && dateTo) {
      if (new Date(dateFrom) > new Date(dateTo)) {
        return '시작일이 종료일보다 늦습니다.';
      }
      if (getDaysDiff(dateFrom, dateTo) > MAX_DATE_RANGE_DAYS) {
        return '검색 기간은 최대 1년입니다.';
      }
    }
    return null;
  })();

  // Select/Date debounce (300ms)
  const debouncedSelectUpdate = useCallback(
    (updates: Partial<TaskSearchParams>) => {
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
      selectTimerRef.current = setTimeout(() => {
        onUpdate(updates);
      }, DEBOUNCE_SELECT);
    },
    [onUpdate]
  );

  // Keyword debounce (500ms)
  const debouncedKeywordUpdate = useCallback(
    (value: string) => {
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
      keywordTimerRef.current = setTimeout(() => {
        onUpdate({ keyword: value || undefined });
      }, DEBOUNCE_KEYWORD);
    },
    [onUpdate]
  );

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
      if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);
    };
  }, []);

  // 핸들러
  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    if (value && dateTo && new Date(value) <= new Date(dateTo) && getDaysDiff(value, dateTo) <= MAX_DATE_RANGE_DAYS) {
      debouncedSelectUpdate({ date_from: value });
    }
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    if (dateFrom && value && new Date(dateFrom) <= new Date(value) && getDaysDiff(dateFrom, value) <= MAX_DATE_RANGE_DAYS) {
      debouncedSelectUpdate({ date_to: value });
    }
  };

  const handleTypeChange = (value: string) => {
    const newValue = value === 'ALL' ? '' : value;
    setType(newValue);
    debouncedSelectUpdate({ type: (newValue || undefined) as TaskSearchParams['type'] });
  };

  const handleWorkTypeChange = (value: string) => {
    const newValue = value === 'ALL' ? '' : value;
    setWorkType(newValue);
    debouncedSelectUpdate({ work_type: (newValue || undefined) as TaskSearchParams['work_type'] });
  };

  const handleStatusChange = (value: string) => {
    const newValue = value === 'ALL' ? '' : value;
    setStatus(newValue);
    debouncedSelectUpdate({ status: (newValue || undefined) as TaskSearchParams['status'] });
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    debouncedKeywordUpdate(value);
  };

  const handleReset = () => {
    if (selectTimerRef.current) clearTimeout(selectTimerRef.current);
    if (keywordTimerRef.current) clearTimeout(keywordTimerRef.current);

    const { firstDay, lastDate } = getDefaultDateRange();
    setDateFrom(firstDay);
    setDateTo(lastDate);
    setType('');
    setWorkType('');
    setStatus('');
    setKeyword('');

    onUpdate({
      date_from: firstDay,
      date_to: lastDate,
      type: undefined,
      work_type: undefined,
      status: undefined,
      keyword: undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">업무 검색</h1>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          초기화
        </Button>
      </div>

      {/* 필터 1행: 시작일, 종료일, 업무 유형, 근무 형태 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">시작일</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">종료일</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">업무 유형</label>
          <Select value={type || 'ALL'} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(TaskTypeLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">근무 형태</label>
          <Select value={workType || 'ALL'} onValueChange={handleWorkTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(WorkTypeLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 필터 2행: 상태, 키워드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">상태</label>
          <Select value={status || 'ALL'} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {Object.entries(TaskStatusLabel).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-3">
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

      {/* 날짜 에러 메시지 */}
      {dateError && (
        <p className="text-sm text-destructive">{dateError}</p>
      )}
    </div>
  );
}
