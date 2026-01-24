// Generated: 2026-01-24 22:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSidebarStore } from '@/stores/sidebar-store';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

describe('Sidebar', () => {
  const adminSession = { user: { name: 'Admin', role: 'ADMIN' }, expires: '' } as any;
  const userSession = { user: { name: 'User', role: 'USER' }, expires: '' } as any;

  beforeEach(() => {
    useSidebarStore.setState({ isCollapsed: false, isMobileOpen: false });
  });

  it('should render menu items for ADMIN', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.getByText('직원 관리')).toBeInTheDocument();
  });

  it('should hide employees for USER', () => {
    render(<Sidebar session={userSession} />);
    expect(screen.getByText('대시보드')).toBeInTheDocument();
    expect(screen.queryByText('직원 관리')).not.toBeInTheDocument();
  });

  it('should highlight active menu item', () => {
    render(<Sidebar session={adminSession} />);
    const dashboardLink = screen.getByText('대시보드').closest('a');
    expect(dashboardLink).toHaveClass('bg-gray-100');
  });

  it('should show version info when expanded', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('should render toggle button', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('축소')).toBeInTheDocument();
  });

  it('should show app title when expanded', () => {
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('Sunjin ERP')).toBeInTheDocument();
  });

  it('should show S abbreviation when collapsed', () => {
    useSidebarStore.setState({ isCollapsed: true });
    render(<Sidebar session={adminSession} />);
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.queryByText('Sunjin ERP')).not.toBeInTheDocument();
  });
});
