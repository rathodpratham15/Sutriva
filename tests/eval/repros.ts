import type { Page } from "@tracelens/browser";

/**
 * One scripted Playwright interaction per eval scenario (tests/eval/scenarios.ts),
 * shared between scripts/generate-eval-fixtures.ts (records the "before" video
 * fixture Claude inspects) and the agentic eval harness (re-runs the identical
 * interaction against a patched app to record an "after" session) -- so the
 * "after" repro is guaranteed to be the same interaction as "before", not a
 * hand-kept-in-sync duplicate.
 */
export const EVAL_REPROS: Record<string, (page: Page, baseUrl: string) => Promise<void>> = {
  "checkout-schema-mismatch": async (page, baseUrl) => {
    await page.goto(`${baseUrl}/checkout`);
    await page.waitForTimeout(300);
    await page.click("#checkout-btn");
    await page.waitForTimeout(700);
  },
  "search-race-condition": async (page, baseUrl) => {
    await page.goto(`${baseUrl}/search`);
    await page.waitForTimeout(300);
    await page.type("#search-input", "cat", { delay: 20 });
    await page.waitForTimeout(150);
    await page.type("#search-input", "s", { delay: 20 });
    await page.waitForTimeout(1200);
  },
  "responsive-regression": async (page, baseUrl) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/responsive`);
    await page.waitForTimeout(1000);
  },
};

export interface FixVerification {
  fixed: boolean;
  detail: string;
}

/**
 * Per-scenario deterministic check of whether the repro's *observable
 * outcome* now indicates the bug is fixed -- used by the agentic eval
 * harness (tests/eval/agentic-harness.ts) as the primary patch-success
 * signal. This is deliberately NOT routed through compare_sessions for
 * every scenario: only checkout-schema-mismatch produces a real
 * console/network signal compare_sessions can see (a resolved console
 * error). search-race-condition and responsive-regression are a stale
 * render and a pure CSS layout bug respectively -- no console error, no
 * failing request, nothing compare_sessions has any way to detect. Being
 * explicit about that here rather than pretending compare_sessions covers
 * all three matches this project's existing "be honest about what a
 * heuristic can't see" posture (see docs/evaluation.md, compare.ts's own
 * doc comment).
 */
export const EVAL_FIX_VERIFICATIONS: Record<string, (page: Page) => Promise<FixVerification>> = {
  "checkout-schema-mismatch": async (page) => {
    const confirmation = await page
      .locator("#confirmation")
      .textContent()
      .catch(() => null);
    const fixed = Boolean(confirmation) && /confirmed/i.test(confirmation ?? "") && !/undefined/i.test(confirmation ?? "");
    return { fixed, detail: `#confirmation text: ${confirmation ?? "(not rendered -- checkout likely still throwing)"}` };
  },
  "search-race-condition": async (page) => {
    const items = await page.locator("#results li").allTextContents();
    const expectedFixed = ["Cats (the musical)", "Cats (2019 film)"];
    const fixed = items.length === expectedFixed.length && items.every((t, i) => t === expectedFixed[i]);
    return { fixed, detail: `#results shows ${JSON.stringify(items)} (fixed state is ${JSON.stringify(expectedFixed)})` };
  },
  "responsive-regression": async (page) => {
    const header = await page.locator(".app-header").boundingBox();
    const button = await page.locator("#submit-btn").boundingBox();
    if (!header || !button) return { fixed: false, detail: "header or button bounding box not found" };
    const fixed = button.y >= header.y + header.height;
    return { fixed, detail: `header bottom=${(header.y + header.height).toFixed(1)}px, button top=${button.y.toFixed(1)}px` };
  },
};
