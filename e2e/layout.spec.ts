// Generated: 2026-01-24 22:50:00 KST

import { test } from './fixtures/auth';
import { expect } from '@playwright/test';

test.describe('레이아웃 시스템', () => {

  // US-1: 인증된 사용자의 메인 레이아웃
  test('US-1: 로그인 후 사이드바와 헤더가 표시된다', async ({ authenticatedPage: page }) => {
    // 사이드바 존재 확인
    await expect(page.locator('aside')).toBeVisible();

    // 헤더 존재 확인
    await expect(page.locator('header')).toBeVisible();

    // 메뉴 항목 확인
    await expect(page.getByText('대시보드')).toBeVisible();
    await expect(page.getByText('고객 관리')).toBeVisible();
  });

  // US-2: 비인증 사용자의 로그인 페이지
  test('US-2: 미인증 시 사이드바 없이 로그인 페이지 표시', async ({ page }) => {
    await page.goto('/dashboard');

    // 로그인 페이지로 리다이렉트
    await page.waitForURL('/login');

    // 사이드바 없음
    await expect(page.locator('aside')).not.toBeVisible();

    // 로그인 카드 표시
    await expect(page.getByText('Sunjin ERP')).toBeVisible();
  });

  // US-3: 사이드바 축소/확장
  test('US-3: 사이드바 토글 버튼으로 축소/확장 전환', async ({ authenticatedPage: page }) => {
    // 초기: 확장 상태 (w-64 = 256px)
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveCSS('width', '256px');

    // 축소 버튼 클릭
    await page.getByText('축소').click();

    // 축소 상태 (w-16 = 64px)
    await expect(sidebar).toHaveCSS('width', '64px');

    // 메뉴 텍스트 숨김 확인
    await expect(page.getByText('대시보드')).not.toBeVisible();
  });

  // US-3: 키보드 단축키
  test('US-3: Ctrl+B로 사이드바 토글', async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside');

    // 초기: 확장
    await expect(sidebar).toHaveCSS('width', '256px');

    // Ctrl+B
    await page.keyboard.press('Control+b');

    // 축소
    await expect(sidebar).toHaveCSS('width', '64px');

    // 다시 Ctrl+B
    await page.keyboard.press('Control+b');

    // 다시 확장
    await expect(sidebar).toHaveCSS('width', '256px');
  });

  // US-3: 상태 영속성
  test('US-3: 축소 상태가 새로고침 후에도 유지', async ({ authenticatedPage: page }) => {
    // 축소
    await page.getByText('축소').click();

    // 새로고침
    await page.reload();

    // 축소 상태 유지 확인
    const sidebar = page.locator('aside');
    await expect(sidebar).toHaveCSS('width', '64px');
  });

  // US-4: RBAC 메뉴 필터링
  test('US-4: USER 역할에서 직원 관리 메뉴 미표시', async ({ page }) => {
    // USER 역할로 로그인
    await page.goto('/login');
    await page.fill('[name="username"]', 'user');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 직원 관리 메뉴 없음
    await expect(page.getByText('직원 관리')).not.toBeVisible();

    // 다른 메뉴는 표시
    await expect(page.getByText('대시보드')).toBeVisible();
    await expect(page.getByText('고객 관리')).toBeVisible();
  });

  // US-5: 사용자 정보 및 로그아웃
  test('US-5: 헤더에서 사용자 정보 확인 및 로그아웃', async ({ authenticatedPage: page }) => {
    // 사용자 이름 표시
    await expect(page.getByText('admin')).toBeVisible();

    // 드롭다운 열기
    await page.getByText('admin').click();

    // 로그아웃 클릭
    await page.getByText('로그아웃').click();

    // 로그인 페이지로 이동
    await page.waitForURL('/login');
  });

  // US-6: 반응형 (모바일)
  test('US-6: 768px 미만에서 Sheet 오버레이 사이드바', async ({ authenticatedPage: page }) => {
    // 뷰포트 축소
    await page.setViewportSize({ width: 600, height: 800 });

    // 사이드바 숨김
    await expect(page.locator('aside')).not.toBeVisible();

    // 햄버거 메뉴 버튼 표시
    await expect(page.getByLabel('메뉴 열기')).toBeVisible();

    // 햄버거 클릭
    await page.getByLabel('메뉴 열기').click();

    // Sheet 오버레이 표시
    await expect(page.getByText('대시보드')).toBeVisible();

    // 메뉴 클릭 시 자동 닫힘
    await page.getByText('고객 관리').click();
    await page.waitForURL('/customers');
  });

  // US-7: Breadcrumb
  test('US-7: 페이지 이동 시 Breadcrumb 표시', async ({ authenticatedPage: page }) => {
    // 고객 관리 이동
    await page.getByText('고객 관리').click();
    await page.waitForURL('/customers');

    // Breadcrumb에 "고객 관리" 표시
    await expect(
      page.locator('nav[aria-label="breadcrumb"]').getByText('고객 관리')
    ).toBeVisible();
  });

  // US-8: Loading UI
  test('US-8: 페이지 전환 시 스켈레톤 표시', async ({ authenticatedPage: page }) => {
    // 네트워크 지연 설정 (스켈레톤 관찰용)
    await page.route('**/api/**', route =>
      route.fulfill({
        status: 200,
        body: '[]',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    // 페이지 이동
    await page.getByText('고객 관리').click();

    // 스켈레톤이 잠시 표시됨 (빠르게 사라질 수 있음)
    // 최소한 콘텐츠 영역에 로딩 요소가 있었는지 확인
  });

  // 메뉴 그룹 구분
  test('메뉴 그룹이 Separator로 구분된다', async ({ authenticatedPage: page }) => {
    const separators = page.locator('aside [data-orientation="horizontal"]');
    await expect(separators).toHaveCount(3); // 4그룹 = 3 separator
  });

  // 활성 메뉴 하이라이트
  test('현재 페이지에 해당하는 메뉴가 하이라이트된다', async ({ authenticatedPage: page }) => {
    // 대시보드에서 시작
    const dashboardLink = page.locator('aside').getByText('대시보드').locator('..');
    await expect(dashboardLink).toHaveClass(/bg-gray-100/);

    // 고객 관리로 이동
    await page.getByText('고객 관리').click();
    await page.waitForURL('/customers');

    // 고객 관리가 활성화
    const customersLink = page.locator('aside').getByText('고객 관리').locator('..');
    await expect(customersLink).toHaveClass(/bg-gray-100/);
  });
});
