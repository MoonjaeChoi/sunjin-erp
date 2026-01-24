// Generated: 2026-01-24 23:30:00 KST

'use client';

import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarView } from '@/types/dashboard';

interface CalendarHeaderProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: string) => void;
}

export function CalendarHeader({
  view,
  currentDate,
  onViewChange,
  onDateChange,
}: CalendarHeaderProps) {
  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      onDateChange(new Date().toISOString().split('T')[0]);
      return;
    }
    const fn =
      direction === 'prev'
        ? view === 'month'
          ? subMonths
          : view === 'week'
            ? subWeeks
            : subDays
        : view === 'month'
          ? addMonths
          : view === 'week'
            ? addWeeks
            : addDays;
    onDateChange(fn(currentDate, 1).toISOString().split('T')[0]);
  };

  const dateLabel =
    view === 'day'
      ? format(currentDate, 'yyyy년 M월 d일', { locale: ko })
      : format(currentDate, 'yyyy년 M월', { locale: ko });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('today')}
        >
          오늘
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold ml-4">{dateLabel}</h2>
      </div>
      <Tabs
        value={view}
        onValueChange={(v) => onViewChange(v as CalendarView)}
      >
        <TabsList>
          <TabsTrigger value="month">월</TabsTrigger>
          <TabsTrigger value="week">주</TabsTrigger>
          <TabsTrigger value="day">일</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
