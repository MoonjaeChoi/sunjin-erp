// Generated: 2026-01-24 21:10:00 KST

import {
  LayoutDashboard,
  Search,
  Headphones,
  FolderKanban,
  AlertTriangle,
  Package,
  FileCheck,
  Building2,
  Users,
  Bell,
  BookOpen,
} from 'lucide-react';
import { NavigationGroup, UserRole } from '@/types/navigation';

/**
 * 사이드바 네비게이션 그룹 정의
 * 각 그룹은 Separator로 시각적으로 구분됨
 *
 * PRD Section 5.6 참조
 */
export const navigationGroups: NavigationGroup[] = [
  {
    // 그룹 1: 일반
    items: [
      { label: '대시보드', href: '/dashboard', icon: LayoutDashboard, requiredRole: 'USER' },
      { label: '업무 검색', href: '/tasks', icon: Search, requiredRole: 'USER' },
    ],
  },
  {
    // 그룹 2: 영업/지원
    items: [
      { label: '기술지원', href: '/support', icon: Headphones, requiredRole: 'USER' },
      { label: '프로젝트', href: '/projects', icon: FolderKanban, requiredRole: 'USER' },
      { label: '장애 현황', href: '/issues', icon: AlertTriangle, requiredRole: 'USER' },
    ],
  },
  {
    // 그룹 3: 운영
    items: [
      { label: '재고 관리', href: '/inventory', icon: Package, requiredRole: 'USER' },
      { label: '유지보수', href: '/maintenance', icon: FileCheck, requiredRole: 'USER' },
    ],
  },
  {
    // 그룹 4: 관리
    items: [
      { label: '고객 관리', href: '/customers', icon: Building2, requiredRole: 'USER' },
      { label: '직원 관리', href: '/employees', icon: Users, requiredRole: 'MANAGER' },
      { label: '공지사항', href: '/notices', icon: Bell, requiredRole: 'USER' },
    ],
  },
  {
    // 그룹 5: 문서/보고서
    items: [
      { label: 'streamwood 보고서', href: '/streamwood-report', icon: BookOpen, requiredRole: 'USER' as UserRole },
    ],
  },
];

/**
 * 역할 계층 (상위 역할은 하위 권한 포함)
 */
const roleHierarchy: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

/**
 * 사용자 역할이 요구 역할 이상인지 확인
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * 사용자 역할에 따라 필터링된 네비게이션 그룹 반환
 */
export function getFilteredNavigation(userRole: UserRole): NavigationGroup[] {
  return navigationGroups
    .map((group) => ({
      items: group.items.filter((item) => hasPermission(userRole, item.requiredRole)),
    }))
    .filter((group) => group.items.length > 0);
}
