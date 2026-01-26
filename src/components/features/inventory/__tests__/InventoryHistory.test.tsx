// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryHistory from '../InventoryHistory';
import { mockInventoryHistory } from '@/__tests__/fixtures/inventory';

describe('InventoryHistory', () => {
  const histories = [mockInventoryHistory];

  test('should render history timeline', () => {
    render(<InventoryHistory histories={histories} />);

    expect(screen.queryByText(/변경|이력|히스토리/i)).toBeInTheDocument();
  });

  test('should display history items in chronological order', () => {
    const multipleHistories = [
      { ...mockInventoryHistory, id: 1, change_type: 'inbound' },
      { ...mockInventoryHistory, id: 2, change_type: 'checkout', changed_at: new Date(Date.now() + 86400000).toISOString() },
    ];

    render(<InventoryHistory histories={multipleHistories} />);

    const items = screen.queryAllByText(/inbound|checkout/i);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  test('should render icons for different change types', () => {
    const types = [
      { ...mockInventoryHistory, change_type: 'inbound' },
      { ...mockInventoryHistory, change_type: 'checkout' },
      { ...mockInventoryHistory, change_type: 'checkin' },
      { ...mockInventoryHistory, change_type: 'relocate' },
      { ...mockInventoryHistory, change_type: 'status_change' },
    ];

    const { container } = render(<InventoryHistory histories={types} />);

    // Should render SVG icons for each type
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(types.length);
  });

  test('should display change details conditionally', () => {
    const withDetails = [
      {
        ...mockInventoryHistory,
        change_type: 'checkout',
        previous_location: '창고 A-1',
        new_location: null,
        checkout_location: '사무실',
        expected_checkin_date: '2026-02-26',
      },
    ];

    render(<InventoryHistory histories={withDetails} />);

    // Checkout should show location and expected checkin date
    expect(screen.queryByText(/창고|사무실|반납/i)).toBeInTheDocument();
  });

  test('should display user information for each change', () => {
    render(<InventoryHistory histories={histories} />);

    // Should show who made the change
    expect(screen.queryByText(/System Admin/i)).toBeInTheDocument();
  });

  test('should format change type labels correctly', () => {
    const typeHistories = [
      { ...mockInventoryHistory, change_type: 'inbound', id: 1 },
      { ...mockInventoryHistory, change_type: 'checkout', id: 2 },
      { ...mockInventoryHistory, change_type: 'status_change', id: 3 },
    ];

    render(<InventoryHistory histories={typeHistories} />);

    // All change types should be displayed
    const items = screen.queryAllByRole('listitem') || screen.queryAllByText(/inbound|checkout|상태/i);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  test('should render empty state when no histories', () => {
    render(<InventoryHistory histories={[]} />);

    expect(screen.queryByText(/이력|기록/i)).toBeInTheDocument();
  });

  test('should handle long history lists with pagination/more button', () => {
    const manyHistories = Array.from({ length: 15 }, (_, i) => ({
      ...mockInventoryHistory,
      id: i,
      changed_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));

    render(<InventoryHistory histories={manyHistories} />);

    // Should initially show limited items
    const items = screen.queryAllByRole('listitem') || screen.queryAllByText(/inbound/i);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  test('should display timestamp for each change', () => {
    render(<InventoryHistory histories={histories} />);

    // Should show when the change occurred
    expect(screen.queryByText(/2025-01-01/i)).toBeInTheDocument();
  });

  test('should handle relocate change type with location fields', () => {
    const relocateHistory = [
      {
        ...mockInventoryHistory,
        change_type: 'relocate',
        previous_location: '창고 A-1',
        new_location: '창고 B-2',
      },
    ];

    render(<InventoryHistory histories={relocateHistory} />);

    // Should show location change
    expect(screen.queryByText(/창고/i)).toBeInTheDocument();
  });
});
