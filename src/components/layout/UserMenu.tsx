// Generated: 2026-01-24 22:10:00 KST

'use client';

import { type Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { UserRole } from '@/types/navigation';

interface UserMenuProps {
  session: Session;
}

/** 역할 한글 표시 */
const roleLabels: Record<UserRole, string> = {
  ADMIN: '관리자',
  MANAGER: '매니저',
  USER: '사용자',
};

export function UserMenu({ session }: UserMenuProps) {
  const user = session.user as any;
  const name = user.name || '사용자';
  const role = user.role as UserRole;
  const initials = name.slice(0, 2);

  async function handleLogout() {
    await signOut({ callbackUrl: '/sunjin/login' });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-2 py-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-gray-500">{roleLabels[role]}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-gray-500">{roleLabels[role]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
