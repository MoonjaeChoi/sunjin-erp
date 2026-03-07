// Generated: 2026-01-24 22:40:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMenu } from '@/components/layout/UserMenu';

const mockSignOut = jest.fn();
jest.mock('next-auth/react', () => ({
  signOut: (...args: any[]) => mockSignOut(...args),
}));

describe('UserMenu', () => {
  const session = { user: { name: '홍길동', role: 'ADMIN' }, expires: '' } as any;

  beforeEach(() => {
    mockSignOut.mockClear();
  });

  it('should display user name', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('홍길동')).toBeInTheDocument();
  });

  it('should display Korean role label', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });

  it('should show avatar initials', () => {
    render(<UserMenu session={session} />);
    expect(screen.getByText('홍길')).toBeInTheDocument();
  });

  it('should show MANAGER as 매니저', () => {
    const managerSession = { user: { name: '김매니저', role: 'MANAGER' }, expires: '' } as any;
    render(<UserMenu session={managerSession} />);
    expect(screen.getByText('매니저')).toBeInTheDocument();
  });

  it('should show USER as 사용자', () => {
    const userSession = { user: { name: '박사용자', role: 'USER' }, expires: '' } as any;
    render(<UserMenu session={userSession} />);
    expect(screen.getByText('사용자')).toBeInTheDocument();
  });

  it('should call signOut on logout click', async () => {
    const user = userEvent.setup();
    render(<UserMenu session={session} />);

    // Open dropdown
    await user.click(screen.getByText('홍길동'));
    await user.click(screen.getByText('로그아웃'));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/sunjin/login' });
  });
});
