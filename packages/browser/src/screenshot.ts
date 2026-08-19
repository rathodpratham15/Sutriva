import type { Page } from "playwright";

/** Captures the current page as a PNG buffer, bounded to the viewport (not full-page) to keep artifacts small. */
export async function captureScreenshot(page: Page): Promise<Buffer> {
  return page.screenshot({ type: "png", fullPage: false });
}
