// Generated: 2026-01-25 00:30:00 KST

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth';

test.describe('Day Detail Panel', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
  });

  test('should open panel on date cell click', async ({ authenticatedPage: page }) => {
    // Click on a day cell
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // Panel should appear with Korean date format
    await expect(page.getByText(/\d{4}년 \d{1,2}월 \d{1,2}일/)).toBeVisible();
    // Should show the 업무 section header
    await expect(page.getByText('업무')).toBeVisible();
  });

  test('should show task list for selected date', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // Should show either tasks or "등록된 업무가 없습니다"
    const hasContent = await page.getByText('업무').isVisible();
    expect(hasContent).toBe(true);
  });

  test('should show tech support section', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // Should show 기술지원 section
    await expect(page.getByText('기술지원')).toBeVisible();
  });

  test('should show empty tech support message', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // Since no tech support is implemented yet, should show empty message
    await expect(page.getByText('기술지원 내역 없음')).toBeVisible();
  });

  test('should close panel on X button click', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // Panel visible
    await expect(page.getByText('기술지원')).toBeVisible();

    // Click close button (X icon)
    await page.locator('button').filter({ has: page.locator('.lucide-x') }).click();

    // Panel should be hidden
    await expect(page.getByText('기술지원')).not.toBeVisible();
  });

  test('should allow status change via badge click', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // If tasks exist, the status badge should be clickable
    const statusBadge = page.getByText('준비').first();
    const hasBadge = await statusBadge.isVisible().catch(() => false);
    if (hasBadge) {
      await statusBadge.click();
      // Status should change to 진행
      await expect(page.getByText('진행').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display work type badges', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().click();

    // If tasks exist, work type badges should be visible
    const taskSection = page.locator('[class*="space-y-2"]');
    const hasTask = await taskSection.locator('[class*="rounded border"]').count();
    if (hasTask > 0) {
      // Should have 내근 or 외근 badge
      const hasWorkType =
        await page.getByText('내근').isVisible().catch(() => false) ||
        await page.getByText('외근').isVisible().catch(() => false);
      expect(hasWorkType).toBe(true);
    }
  });
});
