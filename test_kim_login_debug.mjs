import { chromium } from '@playwright/test';

const BASE_URL = 'http://192.168.75.194:3200';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    console.log(`Current URL: ${page.url()}`);
    console.log(`Page title: ${await page.title()}`);

    // Debug: Take a screenshot and get page content
    const content = await page.content();
    console.log('\n=== Page HTML (first 500 chars) ===');
    console.log(content.substring(0, 500));

    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} input fields:`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const id = await inputs[i].getAttribute('id');
      console.log(`  [${i}] type=${type}, name=${name}, id=${id}`);
    }

    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const type = await buttons[i].getAttribute('type');
      const text = await buttons[i].textContent();
      console.log(`  [${i}] type=${type}, text="${text}"`);
    }

    // Try to find the form
    const form = await page.locator('form').first();
    const formAction = await form.getAttribute('action');
    const formMethod = await form.getAttribute('method');
    console.log(`\nForm action: ${formAction}, method: ${formMethod}`);

    // Try different selectors for username input
    console.log('\n=== Trying to fill inputs ===');

    // Try various selectors
    try {
      await page.locator('input[name="username"]').fill('kim');
      console.log('✓ Filled username with input[name="username"]');
    } catch (e) {
      console.log(`✗ Failed input[name="username"]: ${e.message}`);
    }

    try {
      await page.locator('input[name="email"]').fill('kim');
      console.log('✓ Filled email with input[name="email"]');
    } catch (e) {
      console.log(`✗ Failed input[name="email"]: ${e.message}`);
    }

    try {
      await page.locator('input[type="text"]').first().fill('kim');
      console.log('✓ Filled first text input');
    } catch (e) {
      console.log(`✗ Failed first text input: ${e.message}`);
    }

    // Fill password
    try {
      await page.locator('input[type="password"]').first().fill('password123');
      console.log('✓ Filled password input');
    } catch (e) {
      console.log(`✗ Failed password input: ${e.message}`);
    }

    // Submit the form
    console.log('\n=== Submitting form ===');
    await form.evaluate(el => el.submit());
    console.log('✓ Form submitted');

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    console.log(`After submit - Current URL: ${page.url()}`);

    // Check session
    const session = await page.evaluate(async () => {
      const res = await fetch('/api/auth/session');
      return await res.json();
    });
    console.log(`\nSession: ${JSON.stringify(session)}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
