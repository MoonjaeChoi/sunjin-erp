// Generated: 2026-01-25 06:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TierBar } from '@/components/features/support/TierBar';

jest.mock('lucide-react', () => ({
  Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TierBar', () => {
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render 3 steps', () => {
    render(
      <TierBar status="RECEIVED" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );
    expect(screen.getByText('접수')).toBeInTheDocument();
    expect(screen.getByText('진행')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('should highlight current step', () => {
    render(
      <TierBar status="IN_PROGRESS" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );
    const buttons = screen.getAllByRole('button');
    // IN_PROGRESS is index 1
    expect(buttons[1].className).toContain('bg-blue-500');
  });

  it('should show check icon for completed steps', () => {
    render(
      <TierBar status="COMPLETED" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );
    // RECEIVED and IN_PROGRESS are completed
    const checkIcons = screen.getAllByTestId('check-icon');
    expect(checkIcons.length).toBe(2);
  });

  it('should allow valid transition click (RECEIVED → IN_PROGRESS)', async () => {
    const user = userEvent.setup();
    render(
      <TierBar status="RECEIVED" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // IN_PROGRESS button
    expect(mockOnStatusChange).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('should block invalid transition (RECEIVED → COMPLETED) for USER', async () => {
    const user = userEvent.setup();
    render(
      <TierBar status="RECEIVED" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );

    const buttons = screen.getAllByRole('button');
    // COMPLETED button should be disabled
    expect(buttons[2]).toBeDisabled();
  });

  it('should allow ADMIN any transition', async () => {
    const user = userEvent.setup();
    render(
      <TierBar status="RECEIVED" canEdit={true} role="ADMIN" onStatusChange={mockOnStatusChange} />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[2]); // COMPLETED button
    expect(mockOnStatusChange).toHaveBeenCalledWith('COMPLETED');
  });

  it('should disable all when canEdit is false', () => {
    render(
      <TierBar status="RECEIVED" canEdit={false} role="USER" onStatusChange={mockOnStatusChange} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('should not call onStatusChange for current step click', async () => {
    const user = userEvent.setup();
    render(
      <TierBar status="IN_PROGRESS" canEdit={true} role="USER" onStatusChange={mockOnStatusChange} />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // Current step
    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });
});
