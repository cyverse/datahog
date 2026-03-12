"""Playwright test: Dark and Light themes."""
import json
from playwright.sync_api import sync_playwright

MOCK_LS = json.dumps({
    "path": "/iplant/home/testuser",
    "folders": [
        {"name": "analyses", "path": "/iplant/home/testuser/analyses", "type": "folder", "date_modified": 1700000000000},
        {"name": "raw_data", "path": "/iplant/home/testuser/raw_data", "type": "folder", "date_modified": 1700100000000},
    ],
    "files": [
        {"name": "genome.fasta", "path": "/iplant/home/testuser/genome.fasta", "type": "file", "size": 52428800, "date_modified": 1700200000000},
        {"name": "results.csv", "path": "/iplant/home/testuser/results.csv", "type": "file", "size": 2048000, "date_modified": 1700300000000},
        {"name": "pipeline.py", "path": "/iplant/home/testuser/pipeline.py", "type": "file", "size": 8192, "date_modified": 1700400000000},
        {"name": "notes.md", "path": "/iplant/home/testuser/notes.md", "type": "file", "size": 1024, "date_modified": 1700500000000},
    ],
    "total": 6, "total_filtered": 6,
})


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        page.route("**/api/browse/status", lambda r: r.fulfill(
            status=200, content_type="application/json",
            body=json.dumps({"authenticated": True, "username": "testuser", "home_path": "/iplant/home/testuser"})
        ))
        page.route("**/api/browse/ls**", lambda r: r.fulfill(
            status=200, content_type="application/json", body=MOCK_LS
        ))

        print("1. Loading page (dark theme by default)...")
        page.goto("http://localhost:8000/")
        page.wait_for_selector(".db-file-table", timeout=5000)
        page.screenshot(path="/tmp/theme_dark.png")
        print("   Screenshot: /tmp/theme_dark.png")

        # Click theme toggle
        toggle = page.locator(".db-theme-toggle")
        if toggle.is_visible():
            print("2. Switching to light theme...")
            toggle.click()
            page.wait_for_timeout(300)
            page.screenshot(path="/tmp/theme_light.png")
            print("   Screenshot: /tmp/theme_light.png")

            # Verify data-theme attribute
            theme_attr = page.evaluate("document.documentElement.getAttribute('data-theme')")
            print(f"   data-theme = {theme_attr}")

            # Toggle back
            print("3. Switching back to dark...")
            toggle.click()
            page.wait_for_timeout(300)
            page.screenshot(path="/tmp/theme_dark2.png")
            print("   Screenshot: /tmp/theme_dark2.png")
        else:
            print("2. ERROR: Theme toggle not found")

        if errors:
            print(f"\nJS ERRORS: {errors}")

        browser.close()
        print("\nDone!")


if __name__ == "__main__":
    main()
