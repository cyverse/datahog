"""Quick debug test to see what's happening."""
import json
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1400, "height": 900})

        errors = []
        page.on("console", lambda msg: print(f"  CONSOLE [{msg.type}]: {msg.text}"))
        page.on("pageerror", lambda err: errors.append(str(err)))

        # Mock the status endpoint to return authenticated
        page.route("**/api/browse/status", lambda route: route.fulfill(
            status=200, content_type="application/json",
            body=json.dumps({"authenticated": True, "username": "testuser", "home_path": "/iplant/home/testuser"})
        ))

        # Mock ls endpoint - return data in Django-transformed format (name, path, type)
        def handle_ls(route):
            url = route.request.url
            route.fulfill(
                status=200, content_type="application/json",
                body=json.dumps({
                    "path": "/iplant/home/testuser",
                    "folders": [
                        {"name": "data", "path": "/iplant/home/testuser/data", "type": "folder", "date_modified": 1700000000000, "permission": "own"},
                        {"name": "analyses", "path": "/iplant/home/testuser/analyses", "type": "folder", "date_modified": 1700100000000, "permission": "own"},
                    ],
                    "files": [
                        {"name": "readme.md", "path": "/iplant/home/testuser/readme.md", "type": "file", "size": 1024, "date_modified": 1700200000000, "permission": "own"},
                        {"name": "results.csv", "path": "/iplant/home/testuser/results.csv", "type": "file", "size": 2048000, "date_modified": 1700300000000, "permission": "own"},
                    ],
                    "total": 4, "total_filtered": 4,
                })
            )

        page.route("**/api/browse/ls**", handle_ls)

        print("Loading page...")
        page.goto("http://localhost:8000/")
        page.wait_for_timeout(3000)

        if errors:
            print(f"\nJS ERRORS ({len(errors)}):")
            for e in errors:
                print(f"  {e}")

        # Check what's in the DOM
        html = page.inner_html("#app")
        print(f"\n#app innerHTML length: {len(html)}")
        if len(html) < 200:
            print(f"#app content: {html}")

        page.screenshot(path="/tmp/debug_01.png")
        print("\nScreenshot: /tmp/debug_01.png")
        browser.close()

if __name__ == "__main__":
    main()
