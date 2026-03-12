"""Playwright test: Login → Browse → Select folder → Analyze flow."""
import json
from playwright.sync_api import sync_playwright

MOCK_TOKEN = "mock-token-12345"
MOCK_USERNAME = "testuser"

# Mock directory data
HOME_DIR = {
    "infoType": None,
    "path": f"/iplant/home/{MOCK_USERNAME}",
    "folders": [
        {"path": f"/iplant/home/{MOCK_USERNAME}/analyses", "label": "analyses", "date-modified": 1700000000000, "permission": "own"},
        {"path": f"/iplant/home/{MOCK_USERNAME}/raw_data", "label": "raw_data", "date-modified": 1700100000000, "permission": "own"},
    ],
    "files": [
        {"path": f"/iplant/home/{MOCK_USERNAME}/README.md", "label": "README.md", "date-modified": 1700200000000, "file-size": 2048, "infoType": "text/plain", "permission": "own"},
        {"path": f"/iplant/home/{MOCK_USERNAME}/data.csv", "label": "data.csv", "date-modified": 1700300000000, "file-size": 1048576, "infoType": "text/csv", "permission": "own"},
    ],
    "total": 4, "totalBad": 0,
}

ANALYSES_DIR = {
    "path": f"/iplant/home/{MOCK_USERNAME}/analyses",
    "folders": [],
    "files": [
        {"path": f"/iplant/home/{MOCK_USERNAME}/analyses/output.log", "label": "output.log", "date-modified": 1700400000000, "file-size": 512, "infoType": "text/plain", "permission": "own"},
    ],
    "total": 1, "totalBad": 0,
}

# Mock analyze task
TASK_IMPORTING = {"id": 1, "in_progress": True, "status_message": "Scanning files... 42%", "import_attempt": 1}
TASK_DONE = {"id": 1, "in_progress": False, "status_message": "Import complete", "import_attempt": 1}

# Mock file data results
MOCK_SOURCES = [{"id": 1, "name": "analyses", "root": f"/iplant/home/{MOCK_USERNAME}/analyses", "file_count": 15, "total_size": 5242880}]
MOCK_TYPES = [
    {"extension": "csv", "count": 5, "total_size": 2000000},
    {"extension": "log", "count": 4, "total_size": 1000000},
    {"extension": "py", "count": 3, "total_size": 500000},
    {"extension": "json", "count": 3, "total_size": 742880},
]
MOCK_TOP_FILES = [
    {"name": "big_data.csv", "size": 1048576, "path": "/analyses/big_data.csv"},
    {"name": "results.csv", "size": 524288, "path": "/analyses/results.csv"},
    {"name": "model.py", "size": 262144, "path": "/analyses/model.py"},
]
MOCK_TOP_FOLDERS = [
    {"name": "output", "size": 3145728, "file_count": 8, "path": "/analyses/output"},
    {"name": "scripts", "size": 1048576, "file_count": 5, "path": "/analyses/scripts"},
]
MOCK_DUPLICATES = {
    "groups": [
        {"checksum": "abc123", "size": 1024, "files": [
            {"name": "copy1.txt", "path": "/analyses/copy1.txt"},
            {"name": "copy2.txt", "path": "/analyses/backup/copy2.txt"},
        ]},
    ]
}

task_call_count = 0

def handle_route(route):
    global task_call_count
    url = route.request.url
    method = route.request.method

    # Auth status
    if "/api/browse/status" in url:
        route.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"authenticated": True, "username": MOCK_USERNAME}))
        return

    # Login
    if "/api/browse/login" in url and method == "POST":
        route.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"username": MOCK_USERNAME, "token": MOCK_TOKEN}))
        return

    # Directory listing
    if "/api/browse/ls" in url:
        if "analyses" in url:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(ANALYSES_DIR))
        else:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(HOME_DIR))
        return

    # Stat
    if "/api/browse/stat" in url:
        route.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"path": f"/iplant/home/{MOCK_USERNAME}/analyses", "type": "dir", "date-modified": 1700000000000, "permission": "own"}))
        return

    # Analyze - start import
    if "/api/browse/analyze" in url and method == "POST":
        task_call_count = 0
        route.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"task_id": 1, "status": "started", "path": f"/iplant/home/{MOCK_USERNAME}/analyses", "name": "analyses"}))
        return

    # Task polling
    if "/api/import/task" in url:
        task_call_count += 1
        if task_call_count < 3:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(TASK_IMPORTING))
        else:
            route.fulfill(status=200, content_type="application/json", body=json.dumps(TASK_DONE))
        return

    # File data APIs for results
    if "/api/filedata/sources" in url:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_SOURCES))
        return
    if "/api/filedata/types" in url:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_TYPES))
        return
    if "/api/filedata/top" in url:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_TOP_FILES))
        return
    if "/api/filedata/folders" in url:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_TOP_FOLDERS))
        return
    if "/api/filedata/duplicates" in url:
        route.fulfill(status=200, content_type="application/json", body=json.dumps(MOCK_DUPLICATES))
        return

    # Let everything else pass through
    route.continue_()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        # Intercept API calls
        page.route("**/api/**", handle_route)

        print("1. Loading page...")
        page.goto("http://localhost:8000/")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="/tmp/analyze_01_loaded.png")
        print("   Screenshot: /tmp/analyze_01_loaded.png")

        # Should be auto-logged-in via mock status
        page.wait_for_selector(".db-file-table", timeout=5000)
        print("2. File browser loaded with mock data")
        page.screenshot(path="/tmp/analyze_02_browser.png")
        print("   Screenshot: /tmp/analyze_02_browser.png")

        # Click on the "analyses" folder in the sidebar tree
        analyses_node = page.locator(".db-tree-label", has_text="analyses").first
        if analyses_node.is_visible():
            analyses_node.click()
            page.wait_for_timeout(500)
            print("3. Clicked 'analyses' folder in tree")
            page.screenshot(path="/tmp/analyze_03_analyses.png")
            print("   Screenshot: /tmp/analyze_03_analyses.png")
        else:
            print("3. WARN: 'analyses' node not found in tree, trying file table")
            # Try clicking in the file table
            row = page.locator(".db-file-row", has_text="analyses").first
            if row.is_visible():
                row.dblclick()
                page.wait_for_timeout(500)
                page.screenshot(path="/tmp/analyze_03_analyses.png")

        # Click Analyze button
        analyze_btn = page.locator(".db-analyze-btn")
        if analyze_btn.is_visible():
            print("4. Clicking Analyze button...")
            analyze_btn.click()
            page.wait_for_timeout(1000)
            page.screenshot(path="/tmp/analyze_04_importing.png")
            print("   Screenshot: /tmp/analyze_04_importing.png")

            # Wait for results to load (task polling mock will complete after 3 calls)
            page.wait_for_timeout(6000)
            page.screenshot(path="/tmp/analyze_05_results.png")
            print("5. Analysis results loaded")
            print("   Screenshot: /tmp/analyze_05_results.png")

            # Check for key elements in the results
            stats = page.locator(".ap-stat-card")
            stat_count = stats.count()
            print(f"   Stat cards found: {stat_count}")

            type_bars = page.locator(".ap-type-row")
            type_count = type_bars.count()
            print(f"   Type rows found: {type_count}")

            # Check for back button
            back_btn = page.locator(".ap-back-btn")
            if back_btn.is_visible():
                print("6. Back button visible, clicking it...")
                back_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path="/tmp/analyze_06_back.png")
                print("   Screenshot: /tmp/analyze_06_back.png")
                # Verify we're back to browser
                if page.locator(".db-file-table").is_visible():
                    print("   Successfully returned to file browser!")
                else:
                    print("   WARN: File browser not visible after back")
        else:
            print("4. ERROR: Analyze button not visible")
            page.screenshot(path="/tmp/analyze_04_error.png")

        browser.close()
        print("\nDone! All screenshots saved to /tmp/analyze_*.png")


if __name__ == "__main__":
    main()
