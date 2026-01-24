// Generated: 2026-01-24 22:10:00 KST

'use client';

import { type Session } from 'next-auth';
import { useSidebarStore } from '@/stores/sidebar-store';
import { UserMenu } from './UserMenu';
import { Breadcrumb } from './Breadcrumb';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface HeaderProps {
  session: Session;
}

export function Header({ session }: HeaderProps) {
  const { setMobileOpen } = useSidebarStore();
  const isSmallScreen = useMediaQuery('(max-width: 767px)');

  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {/* 모바일: 햄버거 메뉴 버튼 */}
        {isSmallScreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Breadcrumb */}
        <Breadcrumb />
      </div>

      {/* 사용자 메뉴 */}
      <UserMenu session={session} />
    </header>
  );
}
