// Generated: 2026-01-24 21:35:00 KST

'use client';

import Link from 'next/link';
import { NavigationItem } from '@/types/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarMenuItemProps {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: () => void;
}

export function SidebarMenuItem({ item, isActive, isCollapsed, onNavigate }: SidebarMenuItemProps) {
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-gray-100',
        isActive && 'bg-gray-100 text-primary border-l-2 border-primary',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
}
