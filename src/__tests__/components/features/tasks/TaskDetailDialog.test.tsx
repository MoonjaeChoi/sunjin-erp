// Generated: 2026-01-25 04:20:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDetailDialog } from '@/components/features/tasks/TaskDetailDialog';
import { renderWithProviders } from '@/__tests__/test-utils';

// Mock next-auth
const mockSession = { user: { id: 1, name: 'Test User', role: 'USER' } };
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession }),
}));

// Mock sonner
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

// Mock hooks
const mockMutateAsync = jest.fn();
let mockTaskData: any = null;
let mockIsLoading = false;

jest.mock('@/hooks/tasks', () => ({
  useTaskDetailQuery: (id: number | null) => ({
    data: id !== null ? mockTaskData : null,
    isLoading: mockIsLoading,
  }),
  useUpdateTaskMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

// Mock Select (radix portals)
jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) =>
    React.createElement('div', { 'data-testid': 'select', 'data-value': value, 'data-disabled': disabled }, children),
  SelectTrigger: ({ children, className }: any) =>
    React.createElement('button', { className, 'data-testid': 'select-trigger' }, children),
  SelectValue: ({ placeholder }: any) =>
    React.createElement('span', null, placeholder),
  SelectContent: ({ children }: any) =>
    React.createElement('div', null, children),
  SelectItem: ({ value, children }: any) =>
    React.createElement('option', { value }, children),
}));

// Mock dialog - render content directly for testing
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) =>
    open ? React.createElement('div', { 'data-testid': 'dialog', role: 'dialog' }, children) : null,
  DialogContent: ({ children, className }: any) =>
    React.createElement('div', { 'data-testid': 'dialog-content', className }, children),
  DialogHeader: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: any) =>
    React.createElement('h2', null, children),
  DialogFooter: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'dialog-footer' }, children),
  DialogDescription: ({ children }: any) =>
    React.createElement('p', null, children),
}));

describe('TaskDetailDialog', () => {
  const mockOnClose = jest.fn();

  const sampleTask = {
    id: 1,
    title: '테스트 업무',
    description: '설명입니다',
    task_date: '2026-01-15T00:00:00',
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskData = sampleTask;
    mockIsLoading = false;
  });

  it('should not render dialog when taskId is null', () => {
    renderWithProviders(<TaskDetailDialog taskId={null} onClose={mockOnClose} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog when taskId is provided', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('업무 상세')).toBeInTheDocument();
  });

  it('should display task title in input', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('테스트 업무')).toBeInTheDocument();
  });

  it('should display task description', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('설명입니다')).toBeInTheDocument();
  });

  it('should display task date', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
  });

  it('should show edit description when user is owner', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByText('업무 정보를 수정할 수 있습니다.')).toBeInTheDocument();
  });

  it('should show read-only description when user is not owner', () => {
    mockTaskData = { ...sampleTask, employee_id: 999 };
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByText('업무 상세 정보입니다.')).toBeInTheDocument();
  });

  it('should show save/cancel buttons when user can edit', () => {
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.getByText('저장')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
  });

  it('should not show save/cancel buttons when user cannot edit', () => {
    mockTaskData = { ...sampleTask, employee_id: 999 };
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);
    expect(screen.queryByText('저장')).not.toBeInTheDocument();
    expect(screen.queryByText('취소')).not.toBeInTheDocument();
  });

  it('should call onClose when cancel button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('취소'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call mutateAsync on save', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('저장'));
    expect(mockMutateAsync).toHaveBeenCalledWith({
      id: 1,
      data: expect.objectContaining({
        title: '테스트 업무',
        task_date: '2026-01-15',
        task_type: 'DOCUMENT',
        work_type: 'OFFICE',
        status: 'READY',
      }),
    });
  });

  it('should show success toast on save success', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('저장'));
    expect(mockToastSuccess).toHaveBeenCalledWith('업무가 수정되었습니다.');
  });

  it('should show error toast on save failure', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Failed'));
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('저장'));
    expect(mockToastError).toHaveBeenCalledWith('수정에 실패했습니다.');
  });

  it('should disable save when title is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    const titleInput = screen.getByDisplayValue('테스트 업무');
    await user.clear(titleInput);

    const saveButton = screen.getByText('저장');
    expect(saveButton).toBeDisabled();
  });

  it('should render loading skeleton when isLoading', () => {
    mockIsLoading = true;
    mockTaskData = null;
    const { container } = renderWithProviders(
      <TaskDetailDialog taskId={1} onClose={mockOnClose} />
    );
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show time validation error', async () => {
    // Task with invalid time (start >= end) won't happen from loaded data,
    // but we can test the display of error message by providing a task with inverted times
    mockTaskData = { ...sampleTask, start_time: 600, end_time: 540 };
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    expect(screen.getByText('시작 시간이 종료 시간보다 같거나 늦습니다.')).toBeInTheDocument();
  });

  it('should disable save when time error exists', () => {
    mockTaskData = { ...sampleTask, start_time: 600, end_time: 540 };
    renderWithProviders(<TaskDetailDialog taskId={1} onClose={mockOnClose} />);

    const saveButton = screen.getByText('저장');
    expect(saveButton).toBeDisabled();
  });
});
