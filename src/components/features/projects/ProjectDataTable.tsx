// Generated: 2026-01-25 15:42:00 KST

'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectListItem, ProjectStatus, ProjectStatusLabel, ProjectStatusColor } from '@/types/project';
import { cn } from '@/lib/utils';

interface ProjectDataTableProps {
  projects: ProjectListItem[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  onRowClick: (projectId: number) => void;
}

const SORTABLE_COLUMNS = ['project_code', 'project_name', 'status', 'start_date'];

/**
 * 프로젝트 목록 데이터 테이블 컴포넌트
 * 정렬, 페이지네이션, 상세 보기를 지원합니다.
 */
export function ProjectDataTable({
  projects,
  total,
  page,
  pageSize,
  sortBy,
  sortOrder,
  isLoading = false,
  onPageChange,
  onSortChange,
  onRowClick,
}: ProjectDataTableProps) {
  // ============================================================================
  // 1. 계산
  // ============================================================================
  const totalPages = Math.ceil(total / pageSize);

  // ============================================================================
  // 2. 포맷팅 함수
  // ============================================================================
  const formatDateRange = (startDate: string | null, endDate: string | null): string => {
    if (!startDate && !endDate) return '-';
    if (startDate && endDate) return `${startDate} ~ ${endDate}`;
    return startDate || endDate || '-';
  };

  const getStatusColor = (status: ProjectStatus) => {
    return ProjectStatusColor[status];
  };

  // ============================================================================
  // 3. 이벤트 핸들러
  // ============================================================================
  const handleSort = (column: string) => {
    if (!SORTABLE_COLUMNS.includes(column)) return;

    if (sortBy === column) {
      // 같은 열 클릭 시 정렬 방향 토글
      onSortChange(column, sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // 다른 열 클릭 시 DESC로 시작
      onSortChange(column, 'DESC');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  // ============================================================================
  // 4. 렌더링 헬퍼
  // ============================================================================
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'ASC' ? (
      <ArrowUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="inline h-4 w-4 ml-1" />
    );
  };

  const renderTableHeader = (column: string, label: string) => {
    const isSortable = SORTABLE_COLUMNS.includes(column);
    return (
      <TableHead
        key={column}
        onClick={() => isSortable && handleSort(column)}
        className={cn(isSortable && 'cursor-pointer hover:bg-muted/50')}
      >
        <div className="flex items-center gap-1">
          {label}
          <SortIndicator column={column} />
        </div>
      </TableHead>
    );
  };

  // ============================================================================
  // 5. 렌더링
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {renderTableHeader('project_code', '프로젝트 코드')}
              {renderTableHeader('project_name', '프로젝트명')}
              <TableHead>고객사</TableHead>
              {renderTableHeader('status', '상태')}
              <TableHead>담당자</TableHead>
              {renderTableHeader('start_date', '계약 기간')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  {isLoading ? '로딩 중...' : '검색 조건에 맞는 프로젝트가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => {
                const statusColor = getStatusColor(project.status);
                return (
                  <TableRow
                    key={project.id}
                    onClick={() => onRowClick(project.id)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {project.project_code || '-'}
                    </TableCell>
                    <TableCell>{project.project_name}</TableCell>
                    <TableCell>{project.customer_name}</TableCell>
                    <TableCell>
                      <Badge className={cn(statusColor.bg, statusColor.text)}>
                        {ProjectStatusLabel[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{project.employee_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateRange(project.start_date, project.end_date)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          총 {total}건 (페이지 {page} / {totalPages})
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            이전
          </Button>
          <span className="text-sm font-medium px-3 py-1">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
