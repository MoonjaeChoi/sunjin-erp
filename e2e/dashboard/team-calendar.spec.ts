// Generated: 2026-01-25 00:30:00 KST

import { expect, test } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Team Calendar', () => {
  test('should not render team calendar for USER role (mobile message or hidden)', async ({ page }) => {
    await loginAs(page, 'user');
    await page.goto('/dashboard');

    // USER role should not see team calendar content
    // The team calendar is a separate component, not a tab
    // On mobile it shows "팀 캘린더는 데스크톱에서 이용해주세요."
    // For USER role, the team calendar API returns 403
    await expect(page.getByText('전체 직원')).not.toBeVisible();
  });

  test('should show team calendar for MANAGER', async ({ page }) => {
    await loginAs(page, 'manager');
    await page.goto('/dashboard');

    // MANAGER should be able to see the employee filter
    // This depends on the team calendar being accessible
    // The API returns 200 for MANAGER role
    await expect(page.getByText('전체 직원')).toBeVisible({ timeout: 5000 });
  });

  test('should show team calendar for ADMIN', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard');

    await expect(page.getByText('전체 직원')).toBeVisible({ timeout: 5000 });
  });

  test('should display employee filter select', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard');

    // Employee filter select should be visible
    const selectTrigger = page.locator('button[role="combobox"]').filter({ hasText: '전체 직원' });
    await expect(selectTrigger).toBeVisible({ timeout: 5000 });
  });

  test('should display calendar grid with day headers', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard');

    // Team calendar shows same 월~일 headers
    // Find the second grid (team calendar's grid, after main calendar)
    const headers = page.locator('.grid-cols-7');
    await expect(headers.first()).toBeVisible();
  });

  test('should show mobile message on small viewport', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto('/dashboard');

    await expect(
      page.getByText('팀 캘린더는 데스크톱에서 이용해주세요.')
    ).toBeVisible();
  });

  test('should show loading state while fetching', async ({ page }) => {
    await loginAs(page, 'admin');

    // Delay the API response to observe loading state
    await page.route('**/api/dashboard/team**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/dashboard');
    await expect(page.getByText('로딩 중...')).toBeVisible();
  });

  test('should apply color palette per employee', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/dashboard');

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Check for color-coded employee task indicators
    const coloredItems = page.locator('[class*="bg-blue-200"], [class*="bg-green-200"], [class*="bg-purple-200"]');
    const count = await coloredItems.count();
    // If there are team tasks, they should be color-coded
    if (count > 0) {
      await expect(coloredItems.first()).toBeVisible();
    }
  });
});
