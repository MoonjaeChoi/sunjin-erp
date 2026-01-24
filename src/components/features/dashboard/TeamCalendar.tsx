// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useSearchParams } from 'next/navigation';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useTeamTasksQuery } from '@/hooks/dashboard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TeamEmployeeData, TeamTaskItem } from '@/types/dashboard';

const employeeColors = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
  'bg-cyan-200 text-cyan-800',
  'bg-amber-200 text-amber-800',
  'bg-indigo-200 text-indigo-800',
  'bg-rose-200 text-rose-800',
];

export function TeamCalendar() {
  const { selectedEmployeeFilter, setEmployeeFilter } = useCalendarStore();
  const searchParams = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const dateStr =
    searchParams.get('date') || new Date().toISOString().split('T')[0];
  const currentDate = new Date(dateStr);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const dateFrom = format(monthStart, 'yyyy-MM-dd');
  const dateTo = format(monthEnd, 'yyyy-MM-dd');

  const { data, isLoading } = useTeamTasksQuery(dateFrom, dateTo);

  if (!isDesktop) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-500">
          팀 캘린더는 데스크톱에서 이용해주세요.
        </p>
      </Card>
    );
  }

  const employees = data?.employees || [];
  const filteredEmployees = selectedEmployeeFilter
    ? employees.filter((e) => e.employee_id === selectedEmployeeFilter)
    : employees;

  // 날짜별 직원 업무 그룹화
  const tasksByDateEmployee = new Map<string, Map<number, TeamTaskItem[]>>();
  for (const emp of filteredEmployees) {
    for (const task of emp.tasks) {
      const dateKey = typeof task.task_date === 'string'
        ? task.task_date.split('T')[0]
        : format(new Date(task.task_date), 'yyyy-MM-dd');
      if (!tasksByDateEmployee.has(dateKey)) {
        tasksByDateEmployee.set(dateKey, new Map());
      }
      const dateMap = tasksByDateEmployee.get(dateKey)!;
      if (!dateMap.has(emp.employee_id)) {
        dateMap.set(emp.employee_id, []);
      }
      dateMap.get(emp.employee_id)!.push(task);
    }
  }

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 직원 색상 맵
  const employeeColorMap = new Map<number, string>();
  employees.forEach((emp, idx) => {
    employeeColorMap.set(emp.employee_id, employeeColors[idx % employeeColors.length]);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedEmployeeFilter?.toString() || 'all'}
          onValueChange={(v) =>
            setEmployeeFilter(v === 'all' ? null : Number(v))
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="전체 직원" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 직원</SelectItem>
            {employees.map((emp) => (
              <SelectItem
                key={emp.employee_id}
                value={emp.employee_id.toString()}
              >
                {emp.employee_name || `직원 ${emp.employee_id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading && (
          <span className="text-sm text-gray-400">로딩 중...</span>
        )}
      </div>

      <div>
        <div className="grid grid-cols-7 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dateMap = tasksByDateEmployee.get(dayStr);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[80px] p-1 border-b border-r',
                  !isSameMonth(day, currentDate) && 'bg-gray-50 text-gray-400'
                )}
              >
                <span
                  className={cn(
                    'text-sm w-5 h-5 flex items-center justify-center rounded-full',
                    isToday(day) && 'bg-blue-600 text-white font-bold'
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dateMap &&
                    Array.from(dateMap.entries()).map(([empId, tasks]) => (
                      <div
                        key={empId}
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate',
                          employeeColorMap.get(empId) || employeeColors[0]
                        )}
                      >
                        {tasks.length}건
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
