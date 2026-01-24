// Generated: 2026-01-25 04:00:00 KST

'use client';

import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskType, TaskTypeLabel, WorkType, WorkTypeLabel, TaskStatus, TaskStatusLabel } from '@/types/task';
import { TaskSearchParams, TaskSearchResponse, TaskSortBy, PageSize, TaskRecord } from '@/types/task-search';

interface TaskDataTableProps {
  data: TaskSearchResponse | undefined;
  isLoading: boolean;
  isPlaceholderData: boolean;
  params: TaskSearchParams;
  onUpdate: (updates: Partial<TaskSearchParams & { detail?: number }>) => void;
}

const statusColors: Record<TaskStatus, string> = {
  [TaskStatus.READY]: 'bg-gray-100 text-gray-700 border-gray-200',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border-blue-200',
  [TaskStatus.DONE]: 'bg-green-100 text-green-700 border-green-200',
};

const taskTypeColors: Record<TaskType, string> = {
  [TaskType.DOCUMENT]: 'bg-purple-100 text-purple-700 border-purple-200',
  [TaskType.TEST]: 'bg-orange-100 text-orange-700 border-orange-200',
  [TaskType.MEETING]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [TaskType.TRAINING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [TaskType.OTHER]: 'bg-gray-100 text-gray-600 border-gray-200',
};

const workTypeColors: Record<WorkType, string> = {
  [WorkType.OFFICE]: 'bg-slate-100 text-slate-700 border-slate-200',
  [WorkType.FIELD]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function formatTime(minutes: number | null): string {
  if (minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimeRange(start: number | null, end: number | null): string {
  if (start === null && end === null) return '-';
  return `${formatTime(start)}~${formatTime(end)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function SortIcon({ column, currentSort, currentOrder }: { column: TaskSortBy; currentSort?: TaskSortBy; currentOrder?: string }) {
  if (currentSort !== column) {
    return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
  }
  return currentOrder === 'ASC'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
}

export function TaskDataTable({
  data,
  isLoading,
  isPlaceholderData,
  params,
  onUpdate,
}: TaskDataTableProps) {
  const handleSort = (column: TaskSortBy) => {
    if (params.sort_by === column) {
      onUpdate({
        sort_order: params.sort_order === 'ASC' ? 'DESC' : 'ASC',
        page: 1,
      });
    } else {
      onUpdate({ sort_by: column, sort_order: 'DESC', page: 1 });
    }
  };

  const handlePageChange = (newPage: number) => {
    onUpdate({ page: newPage });
  };

  const handlePageSizeChange = (value: string) => {
    onUpdate({ page_size: Number(value) as PageSize, page: 1 });
  };

  const handleRowClick = (task: TaskRecord) => {
    onUpdate({ detail: task.id });
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;
  const currentPage = params.page || 1;

  // 페이지 번호 생성 (최대 5개)
  const getPageNumbers = (): number[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // 로딩 (최초)
  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}><Skeleton className="h-4 w-full" /></TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, row) => (
                <TableRow key={row}>
                  {Array.from({ length: 6 }).map((_, col) => (
                    <TableCell key={col}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (data && data.tasks.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 0건</span>
        </div>
        <div className="border rounded-lg py-16 flex flex-col items-center justify-center text-muted-foreground">
          <SearchX className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">검색 조건에 맞는 업무가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 상단: 총 건수 + 페이지 크기 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          총 <span className="font-medium text-foreground">{data?.total ?? 0}</span>건
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">페이지 크기</span>
          <Select
            value={String(params.page_size || 20)}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg relative">
        {isPlaceholderData && (
          <div className="absolute inset-0 bg-background/50 z-10 rounded-lg" />
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('task_date')}
              >
                <span className="inline-flex items-center">
                  날짜
                  <SortIcon column="task_date" currentSort={params.sort_by} currentOrder={params.sort_order} />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('title')}
              >
                <span className="inline-flex items-center">
                  제목
                  <SortIcon column="title" currentSort={params.sort_by} currentOrder={params.sort_order} />
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">업무 유형</TableHead>
              <TableHead className="hidden lg:table-cell whitespace-nowrap">근무 형태</TableHead>
              <TableHead
                className="cursor-pointer select-none whitespace-nowrap"
                onClick={() => handleSort('status')}
              >
                <span className="inline-flex items-center">
                  상태
                  <SortIcon column="status" currentSort={params.sort_by} currentOrder={params.sort_order} />
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell whitespace-nowrap">시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.tasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(task)}
              >
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDate(task.task_date)}
                </TableCell>
                <TableCell className="max-w-[200px] lg:max-w-[300px] truncate text-sm">
                  {task.title}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline" className={taskTypeColors[task.task_type]}>
                    {TaskTypeLabel[task.task_type]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant="outline" className={workTypeColors[task.work_type]}>
                    {WorkTypeLabel[task.work_type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[task.status]}>
                    {TaskStatusLabel[task.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell whitespace-nowrap text-sm text-muted-foreground">
                  {formatTimeRange(task.start_time, task.end_time)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={pageNum === currentPage ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
