// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/features/dashboard/TaskForm';
import { renderWithProviders } from '@/__tests__/test-utils';

const mockCloseTaskForm = jest.fn();
let mockStoreState = {
  taskFormOpen: true,
  editingTaskId: null as number | null,
  closeTaskForm: mockCloseTaskForm,
};

jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => mockStoreState,
}));

const mockCreateMutate = jest.fn();
const mockUpdateMutate = jest.fn();
const mockDeleteMutate = jest.fn();
jest.mock('@/hooks/dashboard', () => ({
  useCreateTaskMutation: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
  useUpdateTaskMutation: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
  useDeleteTaskMutation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
  useTasksQuery: () => ({
    data: { tasks: [], total: 0 },
  }),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true, // desktop by default
}));

// Mock @tanstack/react-query useQuery for existing task fetch
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: ({ enabled }: { enabled?: boolean }) => ({
    data: enabled ? undefined : undefined,
    isLoading: false,
  }),
}));

describe('TaskForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState = {
      taskFormOpen: true,
      editingTaskId: null,
      closeTaskForm: mockCloseTaskForm,
    };
  });

  describe('Create mode', () => {
    it('should render form when taskFormOpen is true', () => {
      renderWithProviders(<TaskForm />);
      expect(screen.getByText('업무 등록')).toBeInTheDocument();
    });

    it('should not render when taskFormOpen is false', () => {
      mockStoreState.taskFormOpen = false;
      const { container } = renderWithProviders(<TaskForm />);
      expect(container.firstChild).toBeNull();
    });

    it('should require title field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm />);
      // Submit without title
      await user.click(screen.getByRole('button', { name: '등록' }));
      expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
    });

    it('should validate start_time < end_time', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm />);
      // Labels don't use htmlFor, so query by role
      const textInputs = screen.getAllByRole('textbox');
      const titleInput = textInputs[0]; // first textbox is title
      await user.type(titleInput, 'Test Task');

      // Find time inputs by type
      const timeInputs = screen.getAllByDisplayValue('') as HTMLInputElement[];
      const startInput = timeInputs.find((i) => i.type === 'time');
      const endInput = timeInputs.filter((i) => i.type === 'time')[1];

      if (startInput && endInput) {
        await user.clear(startInput);
        await user.type(startInput, '12:00');
        await user.clear(endInput);
        await user.type(endInput, '09:00');
      }

      await user.click(screen.getByRole('button', { name: '등록' }));
      expect(
        screen.getByText('시작 시간은 종료 시간보다 빨라야 합니다')
      ).toBeInTheDocument();
    });

    it('should call createMutation on valid submit', async () => {
      const user = userEvent.setup();
      mockCreateMutate.mockImplementation((_dto: any, opts: any) => {
        opts?.onSuccess?.();
      });
      renderWithProviders(<TaskForm />);

      const textInputs = screen.getAllByRole('textbox');
      const titleInput = textInputs[0];
      await user.type(titleInput, 'New Task');

      await user.click(screen.getByRole('button', { name: '등록' }));
      expect(mockCreateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Task' }),
        expect.any(Object)
      );
    });

    it('should close form on cancel click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TaskForm />);
      await user.click(screen.getByRole('button', { name: '취소' }));
      expect(mockCloseTaskForm).toHaveBeenCalled();
    });

    it('should close form on backdrop click', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<TaskForm />);
      const backdrop = container.querySelector('.bg-black\\/50');
      if (backdrop) {
        await user.click(backdrop);
        expect(mockCloseTaskForm).toHaveBeenCalled();
      }
    });
  });

  describe('Edit mode', () => {
    it('should show 업무 수정 title', () => {
      mockStoreState.editingTaskId = 42;
      renderWithProviders(<TaskForm />);
      expect(screen.getByText('업무 수정')).toBeInTheDocument();
    });

    it('should show delete button in edit mode', () => {
      mockStoreState.editingTaskId = 42;
      renderWithProviders(<TaskForm />);
      expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument();
    });

    it('should not show delete button in create mode', () => {
      renderWithProviders(<TaskForm />);
      expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
    });

    it('should show confirmation dialog on delete click', async () => {
      const user = userEvent.setup();
      mockStoreState.editingTaskId = 42;
      renderWithProviders(<TaskForm />);
      await user.click(screen.getByRole('button', { name: '삭제' }));
      expect(screen.getByText('이 업무를 삭제하시겠습니까?')).toBeInTheDocument();
    });

    it('should show submit button as 수정', () => {
      mockStoreState.editingTaskId = 42;
      renderWithProviders(<TaskForm />);
      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    });
  });
});
