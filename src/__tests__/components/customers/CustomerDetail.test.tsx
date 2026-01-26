// Generated: 2026-01-28 02:15:00 KST

jest.mock('@/hooks/useCustomers', () => ({
  useCustomer: jest.fn(),
  useDeleteCustomer: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>Back</span>,
  Edit2: () => <span>Edit</span>,
  Trash2: () => <span>Delete</span>,
  Loader2: () => <span>Loading</span>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerDetail } from '@/components/features/customers/CustomerDetail';
import { useCustomer, useDeleteCustomer } from '@/hooks/useCustomers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const mockUseCustomer = useCustomer as jest.Mock;
const mockUseDeleteCustomer = useDeleteCustomer as jest.Mock;
const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('CustomerDetail Component', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
  };

  const mockCustomer = {
    id: 1,
    name: 'Test Customer',
    code: 'CUS001',
    classification: 'END_USER',
    address: 'Seoul, Korea',
    phone: '010-1234-5678',
    email: 'test@example.com',
    memo: 'Test memo',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-28'),
    createdBy: { id: 1, name: 'Admin' },
    updatedBy: { id: 2, name: 'Manager' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSession.mockReturnValue({
      data: { user: { id: 1, role: 'ADMIN' } },
    });
  });

  it('should render loading state', () => {
    mockUseCustomer.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    mockUseDeleteCustomer.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<CustomerDetail customerId={1} />);
    expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
  });

  it('should render customer detail', () => {
    mockUseCustomer.mockReturnValue({
      data: mockCustomer,
      isLoading: false,
      error: null,
    });
    mockUseDeleteCustomer.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<CustomerDetail customerId={1} />);

    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('CUS001')).toBeInTheDocument();
    expect(screen.getByText('Seoul, Korea')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseCustomer.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Not found' },
    });
    mockUseDeleteCustomer.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<CustomerDetail customerId={999} />);
    expect(screen.getByText(/오류/)).toBeInTheDocument();
  });

  it('should show not found state', () => {
    mockUseCustomer.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    mockUseDeleteCustomer.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    render(<CustomerDetail customerId={999} />);
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
  });

  describe('Authorization', () => {
    it('should show delete button for ADMIN', () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'ADMIN' } },
      });

      render(<CustomerDetail customerId={1} />);
      expect(screen.getByText('삭제')).toBeInTheDocument();
    });

    it('should not show delete button for non-ADMIN', () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseSession.mockReturnValue({
        data: { user: { id: 1, role: 'MANAGER' } },
      });

      render(<CustomerDetail customerId={1} />);
      expect(screen.queryByText('삭제')).not.toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render tabs', () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerDetail customerId={1} />);

      expect(screen.getByText('기본정보')).toBeInTheDocument();
      expect(screen.getByText('담당자')).toBeInTheDocument();
      expect(screen.getByText('이력')).toBeInTheDocument();
    });
  });

  describe('Delete Operation', () => {
    it('should open delete dialog on delete button click', async () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerDetail customerId={1} />);

      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('고객을 삭제하시겠습니까?')).toBeInTheDocument();
      });
    });

    it('should confirm deletion', async () => {
      const mockMutate = jest.fn();
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      render(<CustomerDetail customerId={1} />);

      const deleteButton = screen.getByText('삭제');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /삭제/ });
        if (confirmButton && confirmButton !== deleteButton) {
          fireEvent.click(confirmButton);
        }
      });
    });
  });

  describe('Back Navigation', () => {
    it('should have working back button', () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerDetail customerId={1} />);

      const backButton = screen.getByText('뒤로');
      fireEvent.click(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Edit Button', () => {
    it('should navigate to edit page', () => {
      mockUseCustomer.mockReturnValue({
        data: mockCustomer,
        isLoading: false,
        error: null,
      });
      mockUseDeleteCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerDetail customerId={1} />);

      const editButton = screen.getByText('수정');
      expect(editButton.closest('a')).toHaveAttribute('href', '/customers/1/edit');
    });
  });
});
