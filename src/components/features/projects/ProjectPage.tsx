// Generated: 2026-01-25 15:35:00 KST

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useProjectListQuery } from '@/hooks/projects';
import { ProjectStatus, ProjectSearchParams } from '@/types/project';
import { Button } from '@/components/ui/button';
import { ProjectSummaryBadges } from './ProjectSummaryBadges';
import { ProjectFilters } from './ProjectFilters';
import { ProjectDataTable } from './ProjectDataTable';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import { ProjectDetailDialog } from './ProjectDetailDialog';

interface ProjectPageProps {
  initialPage?: number;
  initialPageSize?: number;
}

/**
 * 프로젝트 목록 페이지 클라이언트 컴포넌트
 * 필터링, 정렬, 페이지네이션 상태 관리
 */
export function ProjectPage({ initialPage = 1, initialPageSize = 20 }: ProjectPageProps) {
  // ============================================================================
  // 1. 페이지네이션 상태
  // ============================================================================
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // ============================================================================
  // 2. 필터 상태
  // ============================================================================
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');

  // ============================================================================
  // 3. 정렬 상태
  // ============================================================================
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // ============================================================================
  // 4. Dialog 상태
  // ============================================================================
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // ============================================================================
  // 5. 검색 파라미터 구성
  // ============================================================================
  const searchParams: ProjectSearchParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      ...(selectedStatuses.length > 0 && { status: selectedStatuses }),
      ...(customerId && { customer_id: customerId }),
      ...(employeeId && { employee_id: employeeId }),
      ...(keyword.length >= 2 && { keyword }),
    }),
    [page, pageSize, sortBy, sortOrder, selectedStatuses, customerId, employeeId, keyword]
  );

  // ============================================================================
  // 6. 데이터 쿼리
  // ============================================================================
  const { data: listData, isLoading, isFetching } = useProjectListQuery(searchParams);

  // ============================================================================
  // 7. 핸들러
  // ============================================================================
  const handleStatusFilterChange = useCallback((statuses: ProjectStatus[]) => {
    setSelectedStatuses(statuses);
    setPage(1); // 필터 변경 시 첫 페이지로
  }, []);

  const handleCustomerFilter = useCallback((id: number | undefined) => {
    setCustomerId(id);
    setPage(1);
  }, []);

  const handleEmployeeFilter = useCallback((id: number | undefined) => {
    setEmployeeId(id);
    setPage(1);
  }, []);

  const handleKeywordChange = useCallback((value: string) => {
    setKeyword(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((field: string, order: 'ASC' | 'DESC') => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleCreateProject = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCreateProjectSuccess = useCallback(() => {
    setCreateDialogOpen(false);
    setPage(1); // 새 프로젝트 생성 시 첫 페이지로
  }, []);

  const handleViewProject = useCallback((projectId: number) => {
    setSelectedProjectId(projectId);
    setDetailDialogOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailDialogOpen(false);
    setSelectedProjectId(null);
  }, []);

  // ============================================================================
  // 8. 렌더링
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* 요약 배지 + 신규 프로젝트 등록 버튼 */}
      <div className="flex items-center justify-between">
        <ProjectSummaryBadges
          selectedStatuses={selectedStatuses}
          onStatusChange={handleStatusFilterChange}
          filters={{
            ...(customerId && { customer_id: customerId }),
            ...(employeeId && { employee_id: employeeId }),
          }}
        />
        <Button onClick={handleCreateProject}>+ 신규 프로젝트</Button>
      </div>

      {/* 필터 */}
      <ProjectFilters
        params={searchParams}
        onUpdate={(updates) => {
          // 모든 필터 업데이트를 하나의 핸들러로 처리
          const { customer_id, status, employee_id, keyword, sort_by, sort_order } = updates;
          if (customer_id !== undefined) handleCustomerFilter(customer_id);
          if (status !== undefined) handleStatusFilterChange(status);
          if (employee_id !== undefined) handleEmployeeFilter(employee_id);
          if (keyword !== undefined) handleKeywordChange(keyword);
          if (sort_by !== undefined || sort_order !== undefined) {
            handleSortChange(sort_by || sortBy, sort_order || sortOrder);
          }
        }}
      />

      {/* 데이터 테이블 */}
      {listData && (
        <ProjectDataTable
          projects={listData.projects}
          total={listData.total}
          page={page}
          pageSize={pageSize}
          sortBy={sortBy}
          sortOrder={sortOrder}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onRowClick={handleViewProject}
        />
      )}

      {/* Dialog 컴포넌트들 */}
      <ProjectCreateDialog open={createDialogOpen} onClose={handleCreateProjectSuccess} />
      <ProjectDetailDialog
        projectId={selectedProjectId}
        open={detailDialogOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
