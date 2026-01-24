// Generated: 2026-01-25 06:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechSupportDetailDialog } from '@/components/features/support/TechSupportDetailDialog';

const mockUpdateMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();
const mockDetailData = {
  id: 1,
  title: '삼성전자 장비 설치',
  description: '설치 작업 내용',
  support_date: '2026-01-15',
  start_time: 540,
  end_time: 720,
  support_type: 'INSTALL' as const,
  support_method: 'ONSITE' as const,
  status: 'IN_PROGRESS' as const,
  employee_id: 1,
  customer_id: 1,
  customer_name: '삼성전자',
  customer_category: 'END_USER',
  attachment_path: null,
  attachment_name: null,
  completed_at: null,
  created_at: '2026-01-15T00:00:00',
  updated_at: '2026-01-15T00:00:00',
  deleted_at: null,
};

jest.mock('@/hooks/support', () => ({
  useTechSupportDetailQuery: (id: number | null) => ({
    data: id ? mockDetailData : undefined,
    isLoading: false,
  }),
  useUpdateTechSupportMutation: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
  useDeleteTechSupportMutation: () => ({
    mutateAsync: mockDeleteMutateAsync,
  }),
}));

jest.mock('@/hooks/customers', () => ({
  useCustomerListQuery: () => ({
    data: {
      customers: [
        { id: 1, name: '삼성전자' },
        { id: 2, name: 'LG전자' },
      ],
    },
  }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 1, role: 'USER' } },
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  ChevronsUpDown: () => React.createElement('svg', { 'data-testid': 'chevrons-updown' }),
  Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: any) => React.createElement('div', null, children),
  DialogHeader: ({ children }: any) => React.createElement('div', null, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', null, children),
  DialogDescription: ({ children }: any) => React.createElement('p', null, children),
  DialogFooter: ({ children }: any) => React.createElement('div', null, children),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => React.createElement('div', null, children),
  SelectTrigger: ({ children }: any) => React.createElement('button', null, children),
  SelectValue: () => React.createElement('span'),
  SelectContent: ({ children }: any) => React.createElement('div', null, children),
  SelectItem: ({ children }: any) => React.createElement('option', null, children),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => React.createElement('div', { className, 'data-testid': 'skeleton' }),
}));

jest.mock('@/components/features/support/TierBar', () => ({
  TierBar: ({ status, onStatusChange }: any) =>
    React.createElement('div', { 'data-testid': 'tier-bar' },
      React.createElement('button', { 'data-testid': 'status-change', onClick: () => onStatusChange('COMPLETED') }, `Status: ${status}`)
    ),
}));

jest.mock('@/components/features/support/AttachmentUpload', () => ({
  AttachmentUpload: ({ supportId, canEdit }: any) =>
    React.createElement('div', { 'data-testid': 'attachment-upload' }, `Support: ${supportId}, canEdit: ${canEdit}`),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TechSupportDetailDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when supportId is null', () => {
    render(<TechSupportDetailDialog supportId={null} onClose={mockOnClose} />);
    expect(screen.queryByText('기술지원 상세')).not.toBeInTheDocument();
  });

  it('should render dialog when supportId is provided', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByText('기술지원 상세')).toBeInTheDocument();
  });

  it('should display TierBar component', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByTestId('tier-bar')).toBeInTheDocument();
  });

  it('should display AttachmentUpload component', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByTestId('attachment-upload')).toBeInTheDocument();
  });

  it('should display form fields with data', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByDisplayValue('삼성전자 장비 설치')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('설치 작업 내용')).toBeInTheDocument();
  });

  it('should show save/cancel/delete buttons when user can edit', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByText('저장')).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
  });

  it('should call onClose on cancel', async () => {
    const user = userEvent.setup();
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('취소'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call updateSupport on status change via TierBar', async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockResolvedValue({});
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    await user.click(screen.getByTestId('status-change'));
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({ id: 1, data: { status: 'COMPLETED' } });
  });

  it('should show delete confirmation dialog on delete click', async () => {
    const user = userEvent.setup();
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('삭제'));
    expect(screen.getByText('기술지원 삭제')).toBeInTheDocument();
    expect(screen.getByText('이 기술지원 건을 삭제합니다. 이 작업은 취소할 수 없습니다.')).toBeInTheDocument();
  });

  it('should call deleteSupport on delete confirm', async () => {
    const user = userEvent.setup();
    mockDeleteMutateAsync.mockResolvedValue({});
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    // Open delete confirmation
    await user.click(screen.getByText('삭제'));
    // Click delete in confirmation dialog - there are now two "삭제" buttons
    const deleteButtons = screen.getAllByText('삭제');
    const confirmDeleteBtn = deleteButtons[deleteButtons.length - 1];
    await user.click(confirmDeleteBtn);

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith(1);
  });

  it('should show info toast when saving with no changes', async () => {
    const { toast } = require('sonner');
    const user = userEvent.setup();
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    await user.click(screen.getByText('저장'));
    expect(toast.info).toHaveBeenCalledWith('변경된 내용이 없습니다.');
  });

  it('should call updateSupport with changed fields on save', async () => {
    const user = userEvent.setup();
    mockUpdateMutateAsync.mockResolvedValue({});
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);

    const titleInput = screen.getByDisplayValue('삼성전자 장비 설치');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 제목');

    await user.click(screen.getByText('저장'));
    expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
      id: 1,
      data: expect.objectContaining({ title: '수정된 제목' }),
    });
  });

  it('should pass canEdit to AttachmentUpload', () => {
    render(<TechSupportDetailDialog supportId={1} onClose={mockOnClose} />);
    expect(screen.getByText('Support: 1, canEdit: true')).toBeInTheDocument();
  });
});
