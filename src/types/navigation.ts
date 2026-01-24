// Generated: 2026-01-24 21:10:00 KST

import { LucideIcon } from 'lucide-react';

/** 사용자 역할 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

/** 네비게이션 메뉴 항목 */
export interface NavigationItem {
  /** 메뉴 표시명 */
  label: string;
  /** 라우트 경로 */
  href: string;
  /** Lucide 아이콘 컴포넌트 */
  icon: LucideIcon;
  /** 접근 가능한 최소 역할 */
  requiredRole: UserRole;
}

/** 네비게이션 그룹 (Separator로 구분) */
export interface NavigationGroup {
  /** 그룹 내 메뉴 항목 목록 */
  items: NavigationItem[];
}

/** Breadcrumb 동적 세그먼트 */
export interface BreadcrumbSegment {
  /** 경로 세그먼트 (예: "/customers") */
  path: string;
  /** 표시 레이블 (예: "고객 관리") */
  label: string;
}

/** NextAuth 세션 사용자 정보 (레이아웃에서 사용하는 부분) */
export interface SessionUser {
  name: string;
  role: UserRole;
  department?: string;
}
