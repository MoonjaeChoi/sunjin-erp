'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useRouter } from 'next/navigation';
import { Issue } from '@/types/issue';
import { getStatusLabel, getSeverityLabel } from '@/types/issue';
import { useIssueFilterStore } from '@/stores/issueFilterStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface IssueDataTableProps {
  issues: Issue[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

const statusColors: Record<string, string> = {
  INTAKE: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-green-100 text-green-800',
};

export default function IssueDataTable({
  issues,
  pagination,
}: IssueDataTableProps) {
  const router = useRouter();
  const setPage = useIssueFilterStore((state) => state.setPage);

  const handleRowClick = (id: number) => {
    router.push(`/issues/${id}`);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>고객사</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>심각도</TableHead>
              <TableHead>담당자</TableHead>
              <TableHead>생성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-4 text-gray-500"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              issues.map((issue) => (
                <TableRow
                  key={issue.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(issue.id)}
                >
                  <TableCell className="font-medium truncate max-w-xs">
                    {issue.title}
                  </TableCell>
                  <TableCell>{issue.customer?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[issue.status]}>
                      {getStatusLabel(issue.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={severityColors[issue.severity]}>
                      {getSeverityLabel(issue.severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>{issue.assigned_to?.name || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(issue.created_at), 'yyyy-MM-dd', {
                      locale: ko,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          총 {pagination.total}건 ({pagination.page}/{pagination.total_pages}
          페이지)
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (pagination.page > 1)
                  handlePageChange(pagination.page - 1);
              }}
            />
            {Array.from({ length: pagination.total_pages }).map((_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href="#"
                  isActive={pagination.page === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (pagination.page < pagination.total_pages)
                  handlePageChange(pagination.page + 1);
              }}
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
