// Generated: 2026-01-24 21:30:00 KST

'use client';

import { type Session } from 'next-auth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSidebarStore } from '@/stores/sidebar-store';
import { useEffect } from 'react';

interface MainShellProps {
  session: Session;
  children: React.ReactNode;
}

export function MainShell({ session, children }: MainShellProps) {
  const { toggle } = useSidebarStore();

  // 키보드 단축키: Ctrl/Cmd + B
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar session={session} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
