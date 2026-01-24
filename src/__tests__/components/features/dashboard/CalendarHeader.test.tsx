// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarHeader } from '@/components/features/dashboard/CalendarHeader';

describe('CalendarHeader', () => {
  const defaultProps = {
    view: 'month' as const,
    currentDate: new Date('2026-01-15'),
    onViewChange: jest.fn(),
    onDateChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('should display current month in Korean', () => {
    render(<CalendarHeader {...defaultProps} />);
    expect(screen.getByText('2026년 1월')).toBeInTheDocument();
  });

  it('should display date with day in day view', () => {
    render(<CalendarHeader {...defaultProps} view="day" />);
    expect(screen.getByText('2026년 1월 15일')).toBeInTheDocument();
  });

  it('should call onViewChange when tab is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarHeader {...defaultProps} />);
    await user.click(screen.getByRole('tab', { name: '주' }));
    expect(defaultProps.onViewChange).toHaveBeenCalledWith('week');
  });

  it('should call onDateChange with next month on next click', async () => {
    const user = userEvent.setup();
    render(<CalendarHeader {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // Last icon button is "next" (ChevronRight)
    const nextButton = buttons.find((b) => b.querySelector('.lucide-chevron-right')) || buttons[2];
    await user.click(nextButton);
    expect(defaultProps.onDateChange).toHaveBeenCalledWith('2026-02-15');
  });

  it('should call onDateChange with prev month on prev click', async () => {
    const user = userEvent.setup();
    render(<CalendarHeader {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find((b) => b.querySelector('.lucide-chevron-left')) || buttons[0];
    await user.click(prevButton);
    expect(defaultProps.onDateChange).toHaveBeenCalledWith('2025-12-15');
  });

  it('should call onDateChange with today on 오늘 click', async () => {
    const user = userEvent.setup();
    render(<CalendarHeader {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '오늘' }));
    const todayStr = new Date().toISOString().split('T')[0];
    expect(defaultProps.onDateChange).toHaveBeenCalledWith(todayStr);
  });

  it('should highlight active view tab', () => {
    render(<CalendarHeader {...defaultProps} view="week" />);
    const weekTab = screen.getByRole('tab', { name: '주' });
    expect(weekTab).toHaveAttribute('data-state', 'active');
  });
});
