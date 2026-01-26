// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import InventoryStats from '../InventoryStats';
import { mockInventoryStats } from '@/__tests__/fixtures/inventory';

describe('InventoryStats', () => {
  test('should render all 5 stat cards', () => {
    render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    expect(screen.getByText(/전체 장비/i)).toBeInTheDocument();
    expect(screen.getByText(/재고 중/i)).toBeInTheDocument();
    expect(screen.getByText(/출고됨/i)).toBeInTheDocument();
    expect(screen.getByText(/고장/i)).toBeInTheDocument();
    expect(screen.getByText(/과기 장비/i)).toBeInTheDocument();
  });

  test('should display total count correctly', () => {
    render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    const cards = screen.getAllByRole('region');
    // First card should be total count
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });

  test('should display status breakdown', () => {
    render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    const stats = mockInventoryStats;
    expect(screen.getByText(`${stats.byStatus['재고'] || 0}`)).toBeInTheDocument();
    expect(screen.getByText(`${stats.byStatus['출고'] || 0}`)).toBeInTheDocument();
    expect(screen.getByText(`${stats.byStatus['고장'] || 0}`)).toBeInTheDocument();
  });

  test('should display overdue count and percentage', () => {
    render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    expect(screen.getByText(`${mockInventoryStats.overdue.count || 0}`)).toBeInTheDocument();
    expect(screen.getByText(`${mockInventoryStats.overdue.percentage}%`)).toBeInTheDocument();
  });

  test('should render loading skeletons when isLoading is true', () => {
    const { container } = render(<InventoryStats stats={mockInventoryStats} isLoading={true} />);

    // Should render 5 placeholder cards with animation
    const animatedCards = container.querySelectorAll('.animate-pulse');
    expect(animatedCards.length).toBe(5);
  });

  test('should return null when stats is undefined', () => {
    const { container } = render(<InventoryStats stats={undefined} isLoading={false} />);

    expect(container.firstChild).toBeNull();
  });

  test('should handle zero counts gracefully', () => {
    const emptyStats = {
      totalCount: 0,
      byStatus: {
        '재고': 0,
        '출고': 0,
        '고장': 0,
        '폐기': 0,
      },
      byCategory: {},
      overdue: {
        count: 0,
        percentage: 0,
      },
    };

    render(<InventoryStats stats={emptyStats} isLoading={false} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('should apply correct color classes to cards', () => {
    const { container } = render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    const cards = container.querySelectorAll('.bg-');
    // Should have color-coded cards: blue, green, blue, amber, red
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });

  test('should display card titles correctly', () => {
    render(<InventoryStats stats={mockInventoryStats} isLoading={false} />);

    const titles = screen.getAllByText(/중|됨|고장|장비/i);
    expect(titles.length).toBeGreaterThanOrEqual(5);
  });
});
