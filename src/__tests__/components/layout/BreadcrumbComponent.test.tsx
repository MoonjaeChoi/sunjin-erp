// Generated: 2026-01-24 22:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { useBreadcrumbStore } from '@/stores/breadcrumb-store';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Breadcrumb Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
    useBreadcrumbStore.setState({ dynamicLabels: {} });
  });

  it('should render static path label', () => {
    mockUsePathname.mockReturnValue('/customers');
    render(<Breadcrumb />);
    expect(screen.getByText('고객 관리')).toBeInTheDocument();
  });

  it('should render nested path with separator', () => {
    mockUsePathname.mockReturnValue('/customers/new');
    render(<Breadcrumb />);
    expect(screen.getByText('고객 관리')).toBeInTheDocument();
    expect(screen.getByText('등록')).toBeInTheDocument();
  });

  it('should render dynamic label from store', () => {
    mockUsePathname.mockReturnValue('/customers/123');
    useBreadcrumbStore.setState({
      dynamicLabels: { '/customers/123': '삼성전자' },
    });
    render(<Breadcrumb />);
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
  });

  it('should render last item as non-clickable', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    const lastItem = screen.getByText('대시보드');
    expect(lastItem.closest('a')).toBeNull();
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('should render intermediate segment as link', () => {
    mockUsePathname.mockReturnValue('/customers/new');
    render(<Breadcrumb />);
    const link = screen.getByText('고객 관리').closest('a');
    expect(link).toHaveAttribute('href', '/customers');
  });

  it('should return null for root path', () => {
    mockUsePathname.mockReturnValue('/');
    const { container } = render(<Breadcrumb />);
    expect(container.firstChild).toBeNull();
  });
});
