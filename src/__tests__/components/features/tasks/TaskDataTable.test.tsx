// Generated: 2026-01-25 04:20:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDataTable } from '@/components/features/tasks/TaskDataTable';
import { TaskSearchParams, TaskSearchResponse, TaskRecord } from '@/types/task-search';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  ArrowUpDown: () => React.createElement('svg', { 'data-testid': 'arrow-updown' }),
  ArrowUp: () => React.createElement('svg', { 'data-testid': 'arrow-up' }),
  ArrowDown: () => React.createElement('svg', { 'data-testid': 'arrow-down' }),
  ChevronLeft: () => React.createElement('svg', { 'data-testid': 'chevron-left' }),
  ChevronRight: () => React.createElement('svg', { 'data-testid': 'chevron-right' }),
  SearchX: () => React.createElement('svg', { 'data-testid': 'search-x' }),
}));

// Mock Select (radix portals)
jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) =>
    React.createElement('div', { 'data-testid': 'page-size-select', 'data-value': value }, children),
  SelectTrigger: ({ children, className }: any) =>
    React.createElement('button', { className }, children),
  SelectValue: () => React.createElement('span'),
  SelectContent: ({ children }: any) =>
    React.createElement('div', null, children),
  SelectItem: ({ value, children }: any) =>
    React.createElement('option', { value }, children),
}));

describe('TaskDataTable', () => {
  const mockOnUpdate = jest.fn();
  const defaultParams: TaskSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'task_date',
    sort_order: 'DESC',
  };

  const sampleTask: TaskRecord = {
    id: 1,
    title: '문서 작성 업무',
    description: null,
    task_date: '2026-01-15',
    start_time: 540,
    end_time: 600,
    task_type: 'DOCUMENT',
    work_type: 'OFFICE',
    status: 'READY',
    employee_id: 1,
    customer_id: null,
    completed_at: null,
    created_at: '2026-01-15T00:00:00',
    updated_at: '2026-01-15T00:00:00',
    deleted_at: null,
  };

  const sampleData: TaskSearchResponse = {
    tasks: [sampleTask],
    total: 1,
    page: 1,
    page_size: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render skeleton when loading with no data', () => {
      const { container } = render(
        <TaskDataTable
          data={undefined}
          isLoading={true}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      // Skeleton elements should be present
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('should render empty message when no tasks', () => {
      const emptyData: TaskSearchResponse = { tasks: [], total: 0, page: 1, page_size: 20 };
      render(
        <TaskDataTable
          data={emptyData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('검색 조건에 맞는 업무가 없습니다.')).toBeInTheDocument();
      expect(screen.getByText('총 0건')).toBeInTheDocument();
    });
  });

  describe('Data rendering', () => {
    it('should render task row', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('문서 작성 업무')).toBeInTheDocument();
      expect(screen.getByText('2026-01-15')).toBeInTheDocument();
    });

    it('should render total count', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument(); // total count
    });

    it('should format time range correctly', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      // 540min = 09:00, 600min = 10:00
      expect(screen.getByText('09:00~10:00')).toBeInTheDocument();
    });

    it('should show dash for null time range', () => {
      const taskNoTime: TaskRecord = { ...sampleTask, start_time: null, end_time: null };
      const data: TaskSearchResponse = { tasks: [taskNoTime], total: 1, page: 1, page_size: 20 };
      render(
        <TaskDataTable
          data={data}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should render badge for task type', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('문서작성')).toBeInTheDocument();
    });

    it('should render badge for status', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      expect(screen.getByText('준비')).toBeInTheDocument();
    });
  });

  describe('Row interactions', () => {
    it('should call onUpdate with detail id on row click', async () => {
      const user = userEvent.setup();
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('문서 작성 업무'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ detail: 1 });
    });
  });

  describe('Sorting', () => {
    it('should toggle sort order when clicking active sort column', async () => {
      const user = userEvent.setup();
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, sort_by: 'task_date', sort_order: 'DESC' }}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('날짜'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ sort_order: 'ASC', page: 1 });
    });

    it('should set new sort column with DESC when clicking different column', async () => {
      const user = userEvent.setup();
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, sort_by: 'task_date', sort_order: 'DESC' }}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('제목'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ sort_by: 'title', sort_order: 'DESC', page: 1 });
    });

    it('should toggle status sort', async () => {
      const user = userEvent.setup();
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, sort_by: 'status', sort_order: 'ASC' }}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('상태'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ sort_order: 'DESC', page: 1 });
    });
  });

  describe('Pagination', () => {
    const multiPageData: TaskSearchResponse = {
      tasks: Array.from({ length: 10 }, (_, i) => ({
        ...sampleTask,
        id: i + 1,
        title: `Task ${i + 1}`,
      })),
      total: 50,
      page: 1,
      page_size: 10,
    };

    it('should render pagination when totalPages > 1', () => {
      render(
        <TaskDataTable
          data={multiPageData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, page: 1, page_size: 10 }}
          onUpdate={mockOnUpdate}
        />
      );
      // Should show page buttons
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not render pagination when totalPages is 1', () => {
      render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      // No page buttons (besides the total count "1")
      expect(screen.queryByTestId('chevron-left')).not.toBeInTheDocument();
    });

    it('should call onUpdate with new page on page button click', async () => {
      const user = userEvent.setup();
      render(
        <TaskDataTable
          data={multiPageData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, page: 1, page_size: 10 }}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('3'));
      expect(mockOnUpdate).toHaveBeenCalledWith({ page: 3 });
    });

    it('should disable prev button on first page', () => {
      render(
        <TaskDataTable
          data={multiPageData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, page: 1, page_size: 10 }}
          onUpdate={mockOnUpdate}
        />
      );

      const prevButton = screen.getByTestId('chevron-left').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      const lastPageData: TaskSearchResponse = { ...multiPageData, page: 5 };
      render(
        <TaskDataTable
          data={lastPageData}
          isLoading={false}
          isPlaceholderData={false}
          params={{ ...defaultParams, page: 5, page_size: 10 }}
          onUpdate={mockOnUpdate}
        />
      );

      const nextButton = screen.getByTestId('chevron-right').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Placeholder data overlay', () => {
    it('should render overlay when isPlaceholderData is true', () => {
      const { container } = render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={true}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      const overlay = container.querySelector('.bg-background\\/50');
      expect(overlay).toBeInTheDocument();
    });

    it('should not render overlay when isPlaceholderData is false', () => {
      const { container } = render(
        <TaskDataTable
          data={sampleData}
          isLoading={false}
          isPlaceholderData={false}
          params={defaultParams}
          onUpdate={mockOnUpdate}
        />
      );
      const overlay = container.querySelector('.bg-background\\/50');
      expect(overlay).not.toBeInTheDocument();
    });
  });
});
