"""Playwright test: Metadata panel in DataBrowser."""
import json
from playwright.sync_api import sync_playwright

MOCK_LS = json.dumps({
    "path": "/iplant/home/testuser",
    "folders": [
        {"name": "analyses", "path": "/iplant/home/testuser/analyses", "type": "folder", "date_modified": 1700000000000},
    ],
    "files": [
        {"name": "genome.fasta", "path": "/iplant/home/testuser/genome.fasta", "type": "file", "size": 52428800, "date_modified": 1700200000000},
        {"name": "experiment.csv", "path": "/iplant/home/testuser/experiment.csv", "type": "file", "size": 2048000, "date_modified": 1700300000000},
    ],
    "total": 3, "total_filtered": 3,
})

MOCK_METADATA = json.dumps({
    "path": "/iplant/home/testuser/genome.fasta",
    "avus": [
        {"attribute": "ipc-contains-obj-type", "value": "raw_data", "unit": ""},
        {"attribute": "organism", "value": "Arabidopsis thaliana", "unit": ""},
        {"attribute": "data_type", "value": "genome_assembly", "unit": ""},
        {"attribute": "project", "value": "GreenPhyl-2024", "unit": ""},
        {"attribute": "sequencing_platform", "value": "Illumina NovaSeq", "unit": ""},
        {"attribute": "coverage", "value": "30x", "unit": "fold"},
    ]
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
        page.route("**/api/browse/metadata**", lambda r: r.fulfill(
            status=200, content_type="application/json", body=MOCK_METADATA
        ))

        print("1. Loading page...")
        page.goto("http://localhost:8000/")
        page.wait_for_selector(".db-file-table", timeout=5000)
        page.screenshot(path="/tmp/meta_01_browser.png")
        print("   Screenshot: /tmp/meta_01_browser.png")

        # Click on genome.fasta to select it and show metadata
        genome_row = page.locator(".db-file-row", has_text="genome.fasta")
        if genome_row.is_visible():
            print("2. Clicking genome.fasta to show metadata panel...")
            genome_row.click()
            page.wait_for_timeout(800)
            page.screenshot(path="/tmp/meta_02_detail.png")
            print("   Screenshot: /tmp/meta_02_detail.png")

            # Check metadata table
            meta_rows = page.locator(".db-meta-table tbody tr")
            meta_count = meta_rows.count()
            print(f"   Metadata AVU rows: {meta_count}")

            # Check for attribute names
            attrs = page.locator(".db-meta-attr")
            for i in range(min(attrs.count(), 6)):
                print(f"   AVU: {attrs.nth(i).text_content()}")

            # Test light theme with metadata
            toggle = page.locator(".db-theme-toggle")
            if toggle.is_visible():
                print("3. Switching to light theme with metadata visible...")
                toggle.click()
                page.wait_for_timeout(300)
                page.screenshot(path="/tmp/meta_03_light.png")
                print("   Screenshot: /tmp/meta_03_light.png")
        else:
            print("2. ERROR: genome.fasta row not found")

        if errors:
            print(f"\nJS ERRORS: {errors}")

        browser.close()
        print("\nDone!")


if __name__ == "__main__":
    main()
