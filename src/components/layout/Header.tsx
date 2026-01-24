// Generated: 2026-01-24 21:30:00 KST

'use client';

import { type Session } from 'next-auth';

interface HeaderProps {
  session: Session;
}

/**
 * 헤더 컴포넌트 placeholder (2001_08에서 구현)
 */
export function Header({ session }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
      <span className="text-sm text-gray-400">헤더 (2001_08)</span>
      <span className="text-sm">{(session.user as any)?.name}</span>
    </header>
  );
}
