// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { DayDetailPanel } from './DayDetailPanel';
import { TaskForm } from './TaskForm';
import { useTasksQuery } from '@/hooks/dashboard';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { CalendarView } from '@/types/dashboard';

function getDateRange(
  view: CalendarView,
  date: Date
): { dateFrom: string; dateTo: string } {
  if (view === 'month') {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return {
      dateFrom: format(calStart, 'yyyy-MM-dd'),
      dateTo: format(calEnd, 'yyyy-MM-dd'),
    };
  }
  if (view === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    return {
      dateFrom: format(weekStart, 'yyyy-MM-dd'),
      dateTo: format(weekEnd, 'yyyy-MM-dd'),
    };
  }
  // day
  const dayStr = format(date, 'yyyy-MM-dd');
  return { dateFrom: dayStr, dateTo: dayStr };
}

export function Calendar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedDate } = useCalendarStore();

  const view = (searchParams.get('view') as CalendarView) || 'month';
  const dateStr =
    searchParams.get('date') || new Date().toISOString().split('T')[0];
  const currentDate = new Date(dateStr);

  const { dateFrom, dateTo } = getDateRange(view, currentDate);
  const { data } = useTasksQuery({
    date_from: dateFrom,
    date_to: dateTo,
  });

  const updateUrl = (newView?: CalendarView, newDate?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newView) params.set('view', newView);
    if (newDate) params.set('date', newDate);
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        view={view}
        currentDate={currentDate}
        onViewChange={(v) => updateUrl(v)}
        onDateChange={(d) => updateUrl(undefined, d)}
      />

      {view === 'month' && (
        <MonthView date={currentDate} tasks={data?.tasks || []} />
      )}
      {view === 'week' && (
        <WeekView date={currentDate} tasks={data?.tasks || []} />
      )}
      {view === 'day' && (
        <DayView date={currentDate} tasks={data?.tasks || []} />
      )}

      {selectedDate && <DayDetailPanel date={selectedDate} />}

      <TaskForm />
    </div>
  );
}
