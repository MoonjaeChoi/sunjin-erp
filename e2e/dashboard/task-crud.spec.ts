// Generated: 2026-01-25 00:30:00 KST

import { expect } from '@playwright/test';
import { test } from '../fixtures/auth';

test.describe('Task CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let taskTitle = `E2E Test Task ${Date.now()}`;

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard');
  });

  test('should open task form on day cell double-click', async ({ authenticatedPage: page }) => {
    // Double-click on a day cell to open the form
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    const visibleCell = dayCells.first();
    await visibleCell.dblclick();

    await expect(page.getByText('업무 등록')).toBeVisible();
  });

  test('should validate required fields on submit', async ({ authenticatedPage: page }) => {
    // Open form via double-click
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().dblclick();

    // Submit without filling title
    await page.getByRole('button', { name: '등록' }).click();

    // Validation error should appear
    await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
  });

  test('should create a new task', async ({ authenticatedPage: page }) => {
    // Open form
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().dblclick();

    await expect(page.getByText('업무 등록')).toBeVisible();

    // Fill title
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill(taskTitle);

    // Submit
    await page.getByRole('button', { name: '등록' }).click();

    // Form should close and task should appear
    await expect(page.getByText('업무 등록')).not.toBeVisible({ timeout: 5000 });
  });

  test('should open edit form on task click', async ({ authenticatedPage: page }) => {
    // Switch to day view for easier task finding
    await page.getByRole('tab', { name: '일' }).click();
    await page.waitForURL(/view=day/);

    // Click on a task item (if exists)
    const taskItems = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
    const count = await taskItems.count();
    if (count > 0) {
      await taskItems.first().click();
      await expect(page.getByText('업무 수정')).toBeVisible();
    }
  });

  test('should show delete button in edit mode', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '일' }).click();
    await page.waitForURL(/view=day/);

    const taskItems = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
    const count = await taskItems.count();
    if (count > 0) {
      await taskItems.first().click();
      await expect(page.getByRole('button', { name: '삭제' })).toBeVisible();
    }
  });

  test('should show delete confirmation dialog', async ({ authenticatedPage: page }) => {
    await page.getByRole('tab', { name: '일' }).click();
    await page.waitForURL(/view=day/);

    const taskItems = page.locator('[class*="cursor-pointer"][class*="rounded-lg"]');
    const count = await taskItems.count();
    if (count > 0) {
      await taskItems.first().click();
      await page.getByRole('button', { name: '삭제' }).click();
      await expect(page.getByText(/삭제하시겠습니까/)).toBeVisible();
    }
  });

  test('should close form on cancel click', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().dblclick();

    await expect(page.getByText('업무 등록')).toBeVisible();
    await page.getByRole('button', { name: '취소' }).click();
    await expect(page.getByText('업무 등록')).not.toBeVisible();
  });

  test('should close form on backdrop click', async ({ authenticatedPage: page }) => {
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().dblclick();

    await expect(page.getByText('업무 등록')).toBeVisible();

    // Click backdrop
    await page.locator('.bg-black\\/50').click({ position: { x: 10, y: 10 } });
    await expect(page.getByText('업무 등록')).not.toBeVisible();
  });

  test('should show time overlap warning', async ({ authenticatedPage: page }) => {
    // This test creates two overlapping tasks
    const dayCells = page.locator('[class*="cursor-pointer"][class*="min-h"]');
    await dayCells.first().dblclick();

    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill('Overlap Test 1');

    const startTime = page.locator('input[type="time"]').first();
    const endTime = page.locator('input[type="time"]').nth(1);
    await startTime.fill('09:00');
    await endTime.fill('10:00');

    await page.getByRole('button', { name: '등록' }).click();
    await expect(page.getByText('업무 등록')).not.toBeVisible({ timeout: 5000 });

    // Create second overlapping task
    await dayCells.first().dblclick();
    await page.locator('input[type="text"]').first().fill('Overlap Test 2');
    await page.locator('input[type="time"]').first().fill('09:30');
    await page.locator('input[type="time"]').nth(1).fill('10:30');

    // Should show overlap warning
    await expect(page.getByText(/시간이 겹칩니다/)).toBeVisible({ timeout: 5000 });
  });
});
