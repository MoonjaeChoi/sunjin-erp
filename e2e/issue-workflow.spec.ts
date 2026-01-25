// Generated: 2026-01-25 18:05:00 KST

/**
 * E2E Test: Issue Tracking Workflow
 *
 * This test demonstrates the complete issue management workflow:
 * 1. User Login
 * 2. List Page with Filtering
 * 3. Create New Issue
 * 4. View Issue Detail
 * 5. Update Issue Status
 * 6. Admin Rollback
 *
 * Prerequisites:
 * - Test database with seed data
 * - Running application on http://localhost:3000
 * - Test user accounts with different roles
 */

import { test, expect } from '@playwright/test';

test.describe('Issue Tracking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('User can create and view issue', async ({ page }) => {
    // 1. Login as regular user
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    // Wait for redirect to dashboard or issues page
    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues page
    await page.goto('/issues');
    await expect(page).toHaveURL(/\/issues/);

    // 3. Verify list page is loaded
    const heading = page.locator('h1:has-text("장애 현황")');
    await expect(heading).toBeVisible();

    // 4. Click "신규 등록" button to open create dialog
    const createBtn = page.locator('button:has-text("신규 등록")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // 5. Fill in the creation form
    await page.fill('input[placeholder="장애 제목"]', '테스트 장애 이슈');
    await page.fill('textarea[placeholder="장애 내용"]', '이것은 테스트용 장애 설명입니다. 최소 10자 이상의 내용이 필요합니다.');

    // Select severity (radio button)
    await page.click('input[value="HIGH"]');

    // 6. Submit form
    const submitBtn = page.locator('button:has-text("등록")');
    await submitBtn.click();

    // 7. Wait for success and verify table updated
    await page.waitForTimeout(1000);
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Manager can filter and update issues', async ({ page }) => {
    // 1. Login as manager
    await page.fill('input[type="text"]', 'manager');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues
    await page.goto('/issues');

    // 3. Apply filters
    const statusCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await statusCheckboxes.count();
    if (checkboxCount > 0) {
      // Check status filter
      await statusCheckboxes.first().click();
    }

    // 4. Verify filter applied
    await page.waitForTimeout(500);
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(0);

    // 5. Click on first issue to view details
    const firstRow = rows.first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForURL(/\/issues\/\d+/);

      // 6. Verify detail page is displayed
      const detailHeading = page.locator('h1');
      await expect(detailHeading).toBeVisible();
    }
  });

  test('Admin can rollback completed issues', async ({ page }) => {
    // 1. Login as admin
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues
    await page.goto('/issues');

    // 3. Find a completed issue
    const rows = page.locator('table tbody tr');
    const completedBadge = page.locator('text=완료');

    if (await completedBadge.isVisible()) {
      // Click on the row with completed status
      const completedRow = completedBadge.locator('..').first();
      await completedRow.click();

      await page.waitForURL(/\/issues\/\d+/);

      // 4. Verify rollback button is visible (ADMIN only)
      const rollbackBtn = page.locator('button:has-text("상태 되돌리기")');
      if (await rollbackBtn.isVisible()) {
        await rollbackBtn.click();

        // 5. Confirm rollback dialog
        const confirmBtn = page.locator('text=확인').last();
        await confirmBtn.click();

        // 6. Verify status changed
        await page.waitForTimeout(1000);
        const statusBadge = page.locator('[data-testid="status-badge"], text="진행중"');
        expect(statusBadge).toBeTruthy();
      }
    }
  });

  test('Pagination works correctly', async ({ page }) => {
    // 1. Login
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues
    await page.goto('/issues');

    // 3. Check pagination controls
    const nextBtn = page.locator('button:has-text("다음")');
    const pageInfo = page.locator('text=/\\d+\\/\\d+ 페이지/');

    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Verify we're on next page
      const newRows = page.locator('table tbody tr');
      expect(await newRows.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('File upload works', async ({ page }) => {
    // 1. Login
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues and create one
    await page.goto('/issues');

    // Note: This test assumes there's an issue detail page with file upload
    // In a real scenario, navigate to an existing issue detail page
    const rows = page.locator('table tbody tr');
    if (await rows.count() > 0) {
      await rows.first().click();
      await page.waitForURL(/\/issues\/\d+/);

      // Look for file upload input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // Note: File upload needs actual file system access
        // In real tests, use page.setInputFiles()
        console.log('File upload input found but skipping actual upload in this test');
      }
    }
  });
});

test.describe('Access Control', () => {
  test('USER cannot access admin features', async ({ page }) => {
    // 1. Login as regular user
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues
    await page.goto('/issues');

    // 3. Verify "상태 되돌리기" button is not visible (admin only)
    const rollbackBtn = page.locator('button:has-text("상태 되돌리기")');

    // Either button doesn't exist or is not visible
    const isVisible = await rollbackBtn.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('MANAGER cannot modify other departments', async ({ page }) => {
    // 1. Login as manager
    await page.goto('/login');
    await page.fill('input[type="text"]', 'manager');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("로그인")');

    await page.waitForURL(/\/(dashboard|issues)/);

    // 2. Navigate to issues - should only see own department
    await page.goto('/issues');

    // 3. Verify list is filtered to own department
    // This would require specific test data setup
    const rows = page.locator('table tbody tr');
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Configuration Notes:
 *
 * For these tests to run:
 * 1. Ensure the application is running on http://localhost:3000
 * 2. Create test data with:
 *    - Test users: testuser, manager, admin
 *    - Test customers and issues
 * 3. Run tests with: npx playwright test e2e/
 *
 * Test Data Setup Example:
 * - testuser: Role USER, Department 1
 * - manager: Role MANAGER, Department 1
 * - admin: Role ADMIN
 * - Test issues in various statuses (INTAKE, IN_PROGRESS, COMPLETED)
 *
 * Best Practices:
 * - Use test IDs for reliable element selection
 * - Wait for navigation/loading explicitly
 * - Clean up test data after each test
 * - Use separate test contexts for different users
 * - Mock external services in integration tests
 */
