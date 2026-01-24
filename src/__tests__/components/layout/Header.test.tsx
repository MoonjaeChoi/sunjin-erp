// Generated: 2026-01-24 22:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

const mockUseMediaQuery = jest.fn();
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: (...args: any[]) => mockUseMediaQuery(...args),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('Header', () => {
  const session = { user: { name: '홍길동', role: 'ADMIN' }, expires: '' } as any;

  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
  });

  it('should render header element', () => {
    render(<Header session={session} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should show hamburger on small screen', () => {
    mockUseMediaQuery.mockReturnValue(true);
    render(<Header session={session} />);
    expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument();
  });

  it('should hide hamburger on desktop', () => {
    mockUseMediaQuery.mockReturnValue(false);
    render(<Header session={session} />);
    expect(screen.queryByLabelText('메뉴 열기')).not.toBeInTheDocument();
  });

  it('should render user menu with name', () => {
    render(<Header session={session} />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });
});
