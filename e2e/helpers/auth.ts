// Generated: 2026-01-25 00:30:00 KST

import { Page } from '@playwright/test';

type Role = 'user' | 'manager' | 'admin';

const testUsers: Record<Role, { username: string; password: string }> = {
  user: { username: 'user', password: 'password' },
  manager: { username: 'manager', password: 'password' },
  admin: { username: 'admin', password: 'password' },
};

export async function loginAs(page: Page, role: Role) {
  await page.goto('/login');
  await page.fill('[name="username"]', testUsers[role].username);
  await page.fill('[name="password"]', testUsers[role].password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}
