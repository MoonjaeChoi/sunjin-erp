// Generated: 2026-01-25 06:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechSupportDataTable } from '@/components/features/support/TechSupportDataTable';
import { TechSupportSearchParams, TechSupportSearchResponse } from '@/types/tech-support';

jest.mock('lucide-react', () => ({
  ArrowUpDown: () => React.createElement('svg', { 'data-testid': 'arrow-updown' }),
  ArrowUp: () => React.createElement('svg', { 'data-testid': 'arrow-up' }),
  ArrowDown: () => React.createElement('svg', { 'data-testid': 'arrow-down' }),
  ChevronLeft: () => React.createElement('svg', { 'data-testid': 'chevron-left' }),
  ChevronRight: () => React.createElement('svg', { 'data-testid': 'chevron-right' }),
  SearchX: () => React.createElement('svg', { 'data-testid': 'search-x' }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => React.createElement('div', null, children),
  SelectTrigger: ({ children }: any) => React.createElement('button', null, children),
  SelectValue: () => React.createElement('span'),
  SelectContent: ({ children }: any) => React.createElement('div', null, children),
  SelectItem: ({ children }: any) => React.createElement('option', null, children),
}));

describe('TechSupportDataTable', () => {
  const mockOnUpdate = jest.fn();
  const defaultParams: TechSupportSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'support_date',
    sort_order: 'DESC',
  };

  const sampleData: TechSupportSearchResponse = {
    supports: [{
      id: 1,
      title: '삼성전자 장비 설치',
      description: null,
      support_date: '2026-01-15',
      start_time: 540,
      end_time: 720,
      support_type: 'INSTALL',
      support_method: 'ONSITE',
      status: 'IN_PROGRESS',
      employee_id: 1,
      customer_id: 1,
      customer_name: '삼성전자',
      attachment_path: null,
      attachment_name: null,
      completed_at: null,
      created_at: '2026-01-15T00:00:00',
      updated_at: '2026-01-15T00:00:00',
      deleted_at: null,
    }],
    total: 1,
    page: 1,
    page_size: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render skeleton when loading with no data', () => {
    const { container } = render(
      <TechSupportDataTable data={undefined} isLoading={true} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('should render empty message when no data', () => {
    const emptyData: TechSupportSearchResponse = { supports: [], total: 0, page: 1, page_size: 20 };
    render(
      <TechSupportDataTable data={emptyData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(screen.getByText('검색 조건에 맞는 기술지원 건이 없습니다.')).toBeInTheDocument();
  });

  it('should render support records', () => {
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(screen.getByText('삼성전자 장비 설치')).toBeInTheDocument();
  });

  it('should display total count', () => {
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should format time range correctly', () => {
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(screen.getByText('09:00~12:00')).toBeInTheDocument();
  });

  it('should call onUpdate with detail id on row click', async () => {
    const user = userEvent.setup();
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );

    const row = screen.getByText('삼성전자 장비 설치').closest('tr');
    await user.click(row!);
    expect(mockOnUpdate).toHaveBeenCalledWith({ detail: 1 });
  });

  it('should toggle sort order on column click', async () => {
    const user = userEvent.setup();
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );

    const dateHeader = screen.getByText('지원일').closest('th');
    await user.click(dateHeader!);
    expect(mockOnUpdate).toHaveBeenCalledWith({ sort_order: 'ASC', page: 1 });
  });

  it('should set new sort column on different column click', async () => {
    const user = userEvent.setup();
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );

    const titleHeader = screen.getByText('제목').closest('th');
    await user.click(titleHeader!);
    expect(mockOnUpdate).toHaveBeenCalledWith({ sort_by: 'title', sort_order: 'DESC', page: 1 });
  });

  it('should render badges with correct text', () => {
    render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={false} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(screen.getByText('납품설치')).toBeInTheDocument();
    expect(screen.getByText('현장')).toBeInTheDocument();
    expect(screen.getByText('진행')).toBeInTheDocument();
  });

  it('should show placeholder overlay', () => {
    const { container } = render(
      <TechSupportDataTable data={sampleData} isLoading={false} isPlaceholderData={true} params={defaultParams} onUpdate={mockOnUpdate} />
    );
    expect(container.querySelector('[class*="bg-background/50"]')).toBeInTheDocument();
  });
});
