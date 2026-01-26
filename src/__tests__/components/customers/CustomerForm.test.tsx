// Generated: 2026-01-28 02:15:00 KST

jest.mock('@/hooks/useCustomers', () => ({
  useCreateCustomer: jest.fn(),
  useUpdateCustomer: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  Loader2: () => <span>Loading</span>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerForm } from '@/components/features/customers/CustomerForm';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useRouter } from 'next/navigation';

const mockUseCreateCustomer = useCreateCustomer as jest.Mock;
const mockUseUpdateCustomer = useUpdateCustomer as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe('CustomerForm Component', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
  });

  describe('Create Mode', () => {
    it('should render create form', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      expect(screen.getByText('새 고객 등록')).toBeInTheDocument();
      expect(screen.getByLabelText(/고객명/)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      const submitButton = screen.getByText('등록하기');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('고객명은 필수입니다')).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      const mockMutate = jest.fn();
      mockUseCreateCustomer.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      const nameInput = screen.getByPlaceholderText('고객사명');
      fireEvent.change(nameInput, { target: { value: 'New Customer' } });

      const submitButton = screen.getByText('등록하기');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    const editCustomer = {
      id: 1,
      name: 'Existing Customer',
      classification: 'END_USER',
      address: '서울시',
      phone: '010-1234-5678',
      email: 'test@example.com',
      memo: 'Test memo',
    };

    it('should render edit form with customer data', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm customer={editCustomer} />);

      expect(screen.getByText('고객 수정')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Customer')).toBeInTheDocument();
    });

    it('should disable name field in edit mode', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm customer={editCustomer} />);

      const nameInput = screen.getByDisplayValue('Existing Customer') as HTMLInputElement;
      expect(nameInput.disabled).toBe(true);
    });

    it('should submit form updates', async () => {
      const mockMutate = jest.fn();
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      render(<CustomerForm customer={editCustomer} />);

      const addressInput = screen.getByPlaceholderText('주소');
      fireEvent.change(addressInput, { target: { value: 'Updated Address' } });

      const submitButton = screen.getByText('수정하기');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('should validate email format', async () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      const nameInput = screen.getByPlaceholderText('고객사명');
      fireEvent.change(nameInput, { target: { value: 'Test' } });

      const emailInput = screen.getByPlaceholderText('contact@company.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByText('등록하기');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('이메일 형식이 올바르지 않습니다')).toBeInTheDocument();
      });
    });

    it('should show character count for memo', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      const memoInput = screen.getByPlaceholderText('메모');
      fireEvent.change(memoInput, { target: { value: 'Test memo' } });

      expect(screen.getByText(/9\//)).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show loading state on submit', () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
      });

      render(<CustomerForm />);

      const submitButton = screen.getByText('등록하기');
      expect(submitButton).toBeDisabled();
    });

    it('should have working cancel button', async () => {
      mockUseCreateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });
      mockUseUpdateCustomer.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
      });

      render(<CustomerForm />);

      const cancelButton = screen.getByText('취소');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });
  });
});
