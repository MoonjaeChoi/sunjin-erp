// Generated: 2026-01-25 00:30:00 KST

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth';

test.describe('Calendar Views', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
  });

  test('should display month view by default', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('tab', { name: '월' })).toHaveAttribute('data-state', 'active');
    await expect(page.locator('.grid-cols-7')).toBeVisible();
  });

  test('should switch to week view', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '주' }).click();
    await expect(page).toHaveURL(/view=week/);
    await expect(page.getByRole('tab', { name: '주' })).toHaveAttribute('data-state', 'active');
  });

  test('should switch to day view', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '일' }).click();
    await expect(page).toHaveURL(/view=day/);
    await expect(page.getByRole('tab', { name: '일' })).toHaveAttribute('data-state', 'active');
  });

  test('should navigate to next month', async ({ authenticatedPage: page }) => {
    const header = page.locator('h2');
    const currentText = await header.textContent();

    // Click next button (ChevronRight)
    const buttons = page.locator('button');
    await buttons.filter({ has: page.locator('.lucide-chevron-right') }).click();

    await expect(header).not.toHaveText(currentText!);
  });

  test('should navigate to previous month', async ({ authenticatedPage: page }) => {
    const header = page.locator('h2');
    const currentText = await header.textContent();

    await page.locator('button').filter({ has: page.locator('.lucide-chevron-left') }).click();

    await expect(header).not.toHaveText(currentText!);
  });

  test('should return to today on 오늘 click', async ({ authenticatedPage: page }) => {
    // Navigate away from today first
    await page.locator('button').filter({ has: page.locator('.lucide-chevron-right') }).click();

    // Click 오늘
    await page.getByRole('button', { name: '오늘' }).click();

    const today = new Date().toISOString().split('T')[0];
    await expect(page).toHaveURL(new RegExp(`date=${today}`));
  });

  test('should maintain view state in URL after reload', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '주' }).click();
    await expect(page).toHaveURL(/view=week/);

    await page.reload();

    await expect(page.getByRole('tab', { name: '주' })).toHaveAttribute('data-state', 'active');
  });

  test('should show day-of-week headers in month view', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('월')).toBeVisible();
    await expect(page.getByText('화')).toBeVisible();
    await expect(page.getByText('수')).toBeVisible();
    await expect(page.getByText('목')).toBeVisible();
    await expect(page.getByText('금')).toBeVisible();
    await expect(page.getByText('토')).toBeVisible();
    await expect(page.getByText('일')).toBeVisible();
  });

  test('should show Korean date label in day view', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '일' }).click();
    // Day view shows format: "2026년 1월 15일"
    await expect(page.locator('h2')).toContainText(/\d{4}년 \d{1,2}월 \d{1,2}일/);
  });
});
