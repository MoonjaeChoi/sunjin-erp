// Generated: 2026-01-24 21:35:00 KST

'use client';

import { type Session } from 'next-auth';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { getFilteredNavigation } from '@/lib/navigation-config';
import { UserRole } from '@/types/navigation';
import { SidebarMenuItem } from './SidebarMenuItem';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface SidebarProps {
  session: Session;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const userRole = (session.user as any).role as UserRole;
  const groups = getFilteredNavigation(userRole);
  const isSmallScreen = useMediaQuery('(max-width: 767px)');

  // Small screen: Sheet 오버레이
  if (isSmallScreen) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            groups={groups}
            pathname={pathname}
            isCollapsed={false}
            onNavigate={() => setMobileOpen(false)}
            toggle={toggle}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop/Tablet: 고정 사이드바
  return (
    <aside
      className={cn(
        'h-screen border-r bg-white flex flex-col transition-[width] duration-200 ease-in-out shrink-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent
        groups={groups}
        pathname={pathname}
        isCollapsed={isCollapsed}
        toggle={toggle}
      />
    </aside>
  );
}

interface SidebarContentProps {
  groups: ReturnType<typeof getFilteredNavigation>;
  pathname: string;
  isCollapsed: boolean;
  toggle: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ groups, pathname, isCollapsed, toggle, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* 로고/타이틀 영역 */}
      <div className={cn(
        'h-14 flex items-center border-b px-4',
        isCollapsed ? 'justify-center' : 'justify-start'
      )}>
        {isCollapsed ? (
          <span className="text-lg font-bold">S</span>
        ) : (
          <span className="text-lg font-bold">Sunjin ERP</span>
        )}
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && (
              <Separator className="my-2 mx-3" />
            )}
            <div className="space-y-1 px-2">
              {group.items.map((item) => (
                <SidebarMenuItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                  isCollapsed={isCollapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 영역: 버전 + 토글 버튼 (DT-10) */}
      <div className="border-t p-2">
        {!isCollapsed && (
          <p className="text-xs text-gray-400 px-2 mb-1">v0.1.0</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
          onClick={toggle}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4 mr-2" />
              <span>축소</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
