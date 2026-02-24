# Generated: 2026-02-24 00:00:00 KST
"""
TM1 Screenshot Capture Script
Captures screenshots for home and person modules from https://w.dimode.co.kr/demo/
"""

import os
from playwright.sync_api import sync_playwright

BASE_URL = "https://w.dimode.co.kr/demo/"
APP_URL = "https://w.dimode.co.kr/demo/member/?year=2026&lang=ko"
SCREENSHOTS_DIR = "/Users/memmem/git/sunjin-erp/docs/reports/screenshots"


def dismiss_password_modal(page):
    """Dismiss the 암호 변경 modal by clicking the 닫기 button or m-close span."""
    try:
        # Try the 닫기 button first (inside .modal-password)
        close_btn = page.locator(".modal-password .btn:has-text('닫기'), .modal-password button:has-text('닫기')").first
        if close_btn.is_visible(timeout=1500):
            close_btn.click()
            page.wait_for_timeout(600)
            return True
    except Exception:
        pass

    try:
        # Try the × close span
        close_span = page.locator(".modal-password .m-close").first
        if close_span.is_visible(timeout=1500):
            close_span.click()
            page.wait_for_timeout(600)
            return True
    except Exception:
        pass

    try:
        # Dismiss warning toast
        toast_close = page.locator(".toast-close-button, .toast button").first
        if toast_close.is_visible(timeout=500):
            toast_close.click()
            page.wait_for_timeout(300)
    except Exception:
        pass

    return False


def dismiss_warning_toast(page):
    """Dismiss the warning toast notification."""
    try:
        # The toast has a close button
        page.locator(".toast-close-button").click(timeout=1000)
        page.wait_for_timeout(300)
    except Exception:
        pass


def wait_and_screenshot(page, path, wait_ms=2000):
    """Wait for network idle, dismiss modals, and take a screenshot."""
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(wait_ms)
    dismiss_password_modal(page)
    dismiss_warning_toast(page)
    page.wait_for_timeout(400)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    page.screenshot(path=path, full_page=True)
    print(f"  Saved: {path}")


def capture_hash_page(page, hash_fragment, output_path, wait_ms=2000):
    """Navigate to a hash-based SPA page and capture screenshot."""
    url = f"{APP_URL}#{hash_fragment}"
    page.goto(url)
    wait_and_screenshot(page, output_path, wait_ms)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # --- 1. Login Page ---
    print("Capturing login page...")
    page.goto(BASE_URL)
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(2000)
    page.screenshot(
        path=os.path.join(SCREENSHOTS_DIR, "auth/01_login.png"),
        full_page=True
    )
    print(f"  Saved: auth/01_login.png")

    # --- 2. Perform Login ---
    print("Logging in...")
    try:
        id_field = page.locator("input[type='text']").first
        id_field.fill("과천교회")
        pw_field = page.locator("input[type='password']").first
        pw_field.fill("gcch5022357!")
        login_btn = page.locator("button[type='submit'], button:has-text('로그인')").first
        login_btn.click()
        try:
            page.wait_for_load_state("networkidle", timeout=15000)
        except Exception:
            pass
        page.wait_for_timeout(3000)
        print(f"  Logged in. URL: {page.url}")
    except Exception as e:
        print(f"  Login error: {e}")

    # --- 3. Navigate directly to app URL ---
    print("Navigating to app URL...")
    page.goto(APP_URL)
    try:
        page.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    page.wait_for_timeout(3000)

    # Dismiss the password change modal on initial load
    dismiss_password_modal(page)
    dismiss_warning_toast(page)
    page.wait_for_timeout(500)

    # --- 4. Home (처음 화면) ---
    print("Capturing home page...")
    wait_and_screenshot(page, os.path.join(SCREENSHOTS_DIR, "home/01_home.png"), wait_ms=1000)

    # --- 5. Sitemap ---
    print("Capturing sitemap...")
    capture_hash_page(page, "/home/sitemap", os.path.join(SCREENSHOTS_DIR, "home/02_sitemap.png"))

    # --- 6. Update History ---
    print("Capturing update history...")
    capture_hash_page(page, "/home/update", os.path.join(SCREENSHOTS_DIR, "home/03_update.png"))

    # --- 7. Person: Add ---
    print("Capturing person/add...")
    capture_hash_page(page, "/person/add", os.path.join(SCREENSHOTS_DIR, "person/01_add.png"), wait_ms=2500)

    # --- 8. Person: Search ---
    print("Capturing person/search...")
    capture_hash_page(page, "/person/search", os.path.join(SCREENSHOTS_DIR, "person/02_search.png"), wait_ms=2500)

    # --- 9. Person: List ---
    print("Capturing person/list...")
    capture_hash_page(page, "/person/list", os.path.join(SCREENSHOTS_DIR, "person/03_list.png"), wait_ms=2500)

    # --- 10. Person: Group ---
    print("Capturing person/group...")
    capture_hash_page(page, "/person/group", os.path.join(SCREENSHOTS_DIR, "person/04_group.png"), wait_ms=2500)

    # --- 11. Person: Condition ---
    print("Capturing person/condition...")
    capture_hash_page(page, "/person/condition", os.path.join(SCREENSHOTS_DIR, "person/05_condition.png"), wait_ms=2500)

    # --- 12. Person: Recent ---
    print("Capturing person/recent...")
    capture_hash_page(page, "/person/recent", os.path.join(SCREENSHOTS_DIR, "person/06_recent.png"), wait_ms=2500)

    # --- 13. Person: New Saint ---
    print("Capturing person/newSaint...")
    capture_hash_page(page, "/person/newSaint", os.path.join(SCREENSHOTS_DIR, "person/07_newSaint.png"), wait_ms=2500)

    # --- 14. Person: Request ---
    print("Capturing person/request...")
    capture_hash_page(page, "/person/request", os.path.join(SCREENSHOTS_DIR, "person/08_request.png"), wait_ms=2500)

    # --- 15. Person: Deleted ---
    print("Capturing person/deleted...")
    capture_hash_page(page, "/person/deleted", os.path.join(SCREENSHOTS_DIR, "person/09_deleted.png"), wait_ms=2500)

    browser.close()
    print("\nAll screenshots captured successfully.")
