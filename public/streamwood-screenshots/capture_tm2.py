# Generated: 2026-02-24 10:00:00 KST
"""
TM2 Screenshot Capture Script
Captures screenshots for Customers and Notices modules from https://w.dimode.co.kr/demo/
"""

import os
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

BASE_URL = "https://w.dimode.co.kr/demo/"
SAVE_DIR = "/Users/memmem/git/sunjin-erp/docs/reports/screenshots"
LOGIN_ID = "과천교회"
LOGIN_PW = "gcch5022357!"


def screenshot(page, path, label=""):
    full_path = os.path.join(SAVE_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    page.screenshot(path=full_path, full_page=True)
    print(f"[OK] {label} → {path}")


def wait_load(page):
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except PlaywrightTimeoutError:
        page.wait_for_load_state("domcontentloaded", timeout=10000)


def login(page):
    print("Navigating to login page...")
    page.goto(BASE_URL, wait_until="domcontentloaded")
    wait_load(page)
    page.screenshot(path="/tmp/step_login_initial.png", full_page=True)
    print("Took initial screenshot")

    # Try to find login form
    content = page.content()
    print(f"Page title: {page.title()}")
    print(f"Page URL: {page.url}")

    # Look for input fields
    inputs = page.locator("input").all()
    print(f"Found {len(inputs)} input fields")

    # Try common login field patterns
    id_selectors = [
        'input[type="text"]',
        'input[name="id"]',
        'input[name="username"]',
        'input[name="userId"]',
        'input[placeholder*="아이디"]',
        'input[placeholder*="ID"]',
        'input[id*="id"]',
        'input[id*="user"]',
    ]
    pw_selectors = [
        'input[type="password"]',
    ]

    id_field = None
    for sel in id_selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                id_field = el
                print(f"Found ID field with selector: {sel}")
                break
        except Exception:
            pass

    pw_field = None
    for sel in pw_selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible():
                pw_field = el
                print(f"Found PW field with selector: {sel}")
                break
        except Exception:
            pass

    if id_field and pw_field:
        id_field.fill(LOGIN_ID)
        pw_field.fill(LOGIN_PW)
        page.keyboard.press("Enter")
        wait_load(page)
        print(f"Logged in. Current URL: {page.url}")
    else:
        print("Could not find login fields. Checking if already logged in...")

    page.screenshot(path="/tmp/step_after_login.png", full_page=True)


def navigate_to_customers(page):
    """Navigate to customers module via sidebar"""
    # Try various sidebar link patterns for 고객관리
    selectors = [
        'a:has-text("고객관리")',
        'a:has-text("고객")',
        'nav a:has-text("고객")',
        '[href*="customer"]',
        '[href*="clients"]',
        'li:has-text("고객관리") a',
        'span:has-text("고객관리")',
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=3000):
                print(f"Found customers nav with: {sel}")
                el.click()
                wait_load(page)
                return True
        except Exception:
            pass

    # Try clicking anything with 고객 text
    try:
        page.get_by_text("고객관리", exact=False).first.click()
        wait_load(page)
        return True
    except Exception:
        pass

    print("Could not navigate to customers via sidebar, trying direct URL...")
    for url_suffix in ["customers", "customer", "clients"]:
        try:
            page.goto(f"{BASE_URL}{url_suffix}", wait_until="domcontentloaded")
            wait_load(page)
            if "customer" in page.url.lower() or "client" in page.url.lower():
                return True
        except Exception:
            pass
    return False


def navigate_to_notices(page):
    """Navigate to notices module via sidebar"""
    selectors = [
        'a:has-text("공지사항")',
        'a:has-text("공지")',
        'nav a:has-text("공지")',
        '[href*="notice"]',
        '[href*="announce"]',
        'li:has-text("공지사항") a',
        'span:has-text("공지사항")',
    ]
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=3000):
                print(f"Found notices nav with: {sel}")
                el.click()
                wait_load(page)
                return True
        except Exception:
            pass

    try:
        page.get_by_text("공지사항", exact=False).first.click()
        wait_load(page)
        return True
    except Exception:
        pass

    print("Could not navigate to notices via sidebar, trying direct URL...")
    for url_suffix in ["notices", "notice", "announcements"]:
        try:
            page.goto(f"{BASE_URL}{url_suffix}", wait_until="domcontentloaded")
            wait_load(page)
            if "notice" in page.url.lower():
                return True
        except Exception:
            pass
    return False


def capture_customers(page):
    print("\n=== Capturing Customers module ===")

    # 1. Customer list
    if navigate_to_customers(page):
        wait_load(page)
        screenshot(page, "customers/01_list.png", "Customer list")

        # 2. Customer detail - click first customer
        first_row_selectors = [
            "table tbody tr:first-child td:first-child",
            "table tbody tr:first-child",
            ".customer-item:first-child",
            "[data-row]:first-child",
            "tr:not(:first-child):first-child",  # skip header
        ]
        clicked_detail = False
        for sel in first_row_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    wait_load(page)
                    screenshot(page, "customers/02_detail.png", "Customer detail")
                    clicked_detail = True
                    break
            except Exception:
                pass

        if not clicked_detail:
            # Try clicking first link in the table
            try:
                page.locator("table tbody tr").first.click()
                wait_load(page)
                screenshot(page, "customers/02_detail.png", "Customer detail")
                clicked_detail = True
            except Exception:
                print("Could not click first customer row")

        # 3. New customer form - go back to list first
        navigate_to_customers(page)
        wait_load(page)
        new_btn_selectors = [
            'button:has-text("신규")',
            'button:has-text("등록")',
            'button:has-text("추가")',
            'button:has-text("New")',
            'button:has-text("+")',
            'a:has-text("신규")',
            'a:has-text("등록")',
            '[aria-label*="신규"]',
            '[aria-label*="등록"]',
        ]
        for sel in new_btn_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    wait_load(page)
                    screenshot(page, "customers/03_new_form.png", "Customer new form")
                    break
            except Exception:
                pass

        # 4. Edit form - go back to list
        navigate_to_customers(page)
        wait_load(page)
        edit_btn_selectors = [
            'button:has-text("수정")',
            'button:has-text("편집")',
            'button:has-text("Edit")',
            'a:has-text("수정")',
            '[aria-label*="수정"]',
        ]
        # First try clicking first row to get to detail, then edit
        try:
            page.locator("table tbody tr").first.click()
            wait_load(page)
        except Exception:
            pass

        for sel in edit_btn_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    wait_load(page)
                    screenshot(page, "customers/04_edit_form.png", "Customer edit form")
                    break
            except Exception:
                pass
    else:
        print("Could not navigate to customers module")


def capture_notices(page):
    print("\n=== Capturing Notices module ===")

    # 1. Notice list
    if navigate_to_notices(page):
        wait_load(page)
        screenshot(page, "notices/01_list.png", "Notice list")

        # 2. Notice detail - click first notice
        clicked_detail = False
        try:
            page.locator("table tbody tr").first.click()
            wait_load(page)
            screenshot(page, "notices/02_detail.png", "Notice detail")
            clicked_detail = True
        except Exception:
            pass

        if not clicked_detail:
            try:
                # Try clicking first link in list
                links = page.locator("table tbody tr td a").all()
                if links:
                    links[0].click()
                    wait_load(page)
                    screenshot(page, "notices/02_detail.png", "Notice detail")
                    clicked_detail = True
            except Exception:
                print("Could not click first notice row")

        # 3. New notice form
        navigate_to_notices(page)
        wait_load(page)
        new_btn_selectors = [
            'button:has-text("신규")',
            'button:has-text("등록")',
            'button:has-text("작성")',
            'button:has-text("추가")',
            'button:has-text("New")',
            'button:has-text("+")',
            'a:has-text("신규")',
            'a:has-text("등록")',
            'a:has-text("작성")',
        ]
        for sel in new_btn_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    wait_load(page)
                    screenshot(page, "notices/03_new_form.png", "Notice new form")
                    break
            except Exception:
                pass

        # 4. Edit first notice
        navigate_to_notices(page)
        wait_load(page)
        try:
            page.locator("table tbody tr").first.click()
            wait_load(page)
        except Exception:
            pass

        edit_btn_selectors = [
            'button:has-text("수정")',
            'button:has-text("편집")',
            'button:has-text("Edit")',
            'a:has-text("수정")',
        ]
        for sel in edit_btn_selectors:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=3000):
                    el.click()
                    wait_load(page)
                    screenshot(page, "notices/04_edit_form.png", "Notice edit form")
                    break
            except Exception:
                pass
    else:
        print("Could not navigate to notices module")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        try:
            login(page)
            capture_customers(page)
            capture_notices(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/tmp/error_state.png", full_page=True)
            raise
        finally:
            browser.close()

    print("\nDone capturing all screenshots.")


if __name__ == "__main__":
    main()
