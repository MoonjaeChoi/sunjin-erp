// Generated: 2026-01-24 21:30:00 KST

'use client';

import { type Session } from 'next-auth';

interface SidebarProps {
  session: Session;
}

/**
 * 사이드바 컴포넌트 placeholder (2001_07에서 구현)
 */
export function Sidebar({ session }: SidebarProps) {
  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col">
      <div className="h-14 flex items-center border-b px-4">
        <span className="text-lg font-bold">Sunjin ERP</span>
      </div>
      <nav className="flex-1 p-4">
        <p className="text-sm text-gray-400">사이드바 (2001_07)</p>
      </nav>
    </aside>
  );
}
