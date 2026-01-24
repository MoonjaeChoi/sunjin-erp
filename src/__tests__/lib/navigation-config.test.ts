// Generated: 2026-01-24 21:10:00 KST

import {
  navigationGroups,
  hasPermission,
  getFilteredNavigation,
} from '@/lib/navigation-config';

describe('navigationGroups', () => {
  it('should have 4 groups', () => {
    expect(navigationGroups).toHaveLength(4);
  });

  it('should have total 10 menu items', () => {
    const total = navigationGroups.reduce((sum, g) => sum + g.items.length, 0);
    expect(total).toBe(10);
  });

  it('should have employees menu requiring MANAGER role', () => {
    const allItems = navigationGroups.flatMap((g) => g.items);
    const employees = allItems.find((i) => i.href === '/employees');
    expect(employees?.requiredRole).toBe('MANAGER');
  });

  it('should have all other menus requiring USER role', () => {
    const allItems = navigationGroups.flatMap((g) => g.items);
    const nonEmployeeItems = allItems.filter((i) => i.href !== '/employees');
    nonEmployeeItems.forEach((item) => {
      expect(item.requiredRole).toBe('USER');
    });
  });
});

describe('hasPermission', () => {
  it('should allow ADMIN to access all roles', () => {
    expect(hasPermission('ADMIN', 'USER')).toBe(true);
    expect(hasPermission('ADMIN', 'MANAGER')).toBe(true);
    expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
  });

  it('should allow MANAGER to access USER and MANAGER', () => {
    expect(hasPermission('MANAGER', 'USER')).toBe(true);
    expect(hasPermission('MANAGER', 'MANAGER')).toBe(true);
    expect(hasPermission('MANAGER', 'ADMIN')).toBe(false);
  });

  it('should restrict USER to USER only', () => {
    expect(hasPermission('USER', 'USER')).toBe(true);
    expect(hasPermission('USER', 'MANAGER')).toBe(false);
    expect(hasPermission('USER', 'ADMIN')).toBe(false);
  });
});

describe('getFilteredNavigation', () => {
  it('should hide employees menu for USER role', () => {
    const groups = getFilteredNavigation('USER');
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.find((i) => i.href === '/employees')).toBeUndefined();
  });

  it('should show 9 items for USER role', () => {
    const groups = getFilteredNavigation('USER');
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).toHaveLength(9);
  });

  it('should show employees menu for MANAGER role', () => {
    const groups = getFilteredNavigation('MANAGER');
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems.find((i) => i.href === '/employees')).toBeDefined();
  });

  it('should show all 10 menus for ADMIN role', () => {
    const groups = getFilteredNavigation('ADMIN');
    const allItems = groups.flatMap((g) => g.items);
    expect(allItems).toHaveLength(10);
  });

  it('should maintain 4 groups for ADMIN', () => {
    const groups = getFilteredNavigation('ADMIN');
    expect(groups).toHaveLength(4);
  });

  it('should not produce empty groups', () => {
    const groups = getFilteredNavigation('USER');
    groups.forEach((g) => expect(g.items.length).toBeGreaterThan(0));
  });
});
