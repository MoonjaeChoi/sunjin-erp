import { chromium } from '@playwright/test';

const BASE_URL = 'http://192.168.75.194:3200';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('='.repeat(60));
    console.log('STEP 1: Navigate to login page');
    console.log('='.repeat(60));

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    console.log(`✓ Navigated to: ${page.url()}\n`);

    console.log('='.repeat(60));
    console.log('STEP 2: Login with kim/password123');
    console.log('='.repeat(60));

    // Fill username
    const usernameInput = page.locator('input[type="text"]').or(page.locator('input[name*="username"]')).first();
    await usernameInput.fill('kim');
    console.log('✓ Entered username: kim');

    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('password123');
    console.log('✓ Entered password: password123');

    // Click submit button
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign in")')).first();
    await submitButton.click();
    console.log('✓ Clicked sign in button');

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    console.log(`✓ Navigation complete. Current URL: ${page.url()}\n`);

    console.log('='.repeat(60));
    console.log('STEP 3: Check session');
    console.log('='.repeat(60));

    const sessionResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });

    console.log(`Session: ${JSON.stringify(sessionResponse, null, 2)}\n`);

    console.log('='.repeat(60));
    console.log('STEP 4: Test API endpoints with authenticated session');
    console.log('='.repeat(60));

    const endpoints = [
      '/api/projects/summary',
      '/api/issues/summary',
      '/api/issues?page=1&page_size=20&sort_by=created_at&sort_order=DESC',
      '/api/projects?page=1&page_size=20&sort_by=created_at&sort_order=DESC',
    ];

    for (const endpoint of endpoints) {
      console.log(`\nTesting: ${endpoint}`);

      const response = await page.evaluate(async (url) => {
        const res = await fetch(url);
        const data = await res.json();
        return {
          status: res.status,
          data: data
        };
      }, endpoint);

      console.log(`HTTP Status: ${response.status}`);

      if (response.status === 200) {
        const dataStr = JSON.stringify(response.data, null, 2);
        if (dataStr.length > 300) {
          console.log(`Response (first 300 chars): ${dataStr.substring(0, 300)}...`);
        } else {
          console.log(`Response: ${dataStr}`);
        }
        console.log('✓ SUCCESS - Got data');
      } else if (response.status === 401) {
        console.log(`Response: ${JSON.stringify(response.data)}`);
        console.log('⚠ 401 Unauthorized');
      } else {
        console.log(`Response: ${JSON.stringify(response.data)}`);
        console.log(`✗ Error: ${response.status}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test completed');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
