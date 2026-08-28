#!/usr/bin/env node
/**
 * Generates README screenshots by actually driving demo/buggy-app with
 * Playwright and reproducing each bug (see demo/buggy-app/README.md) --
 * real bugs, real browser, real screenshots, not mockups. Requires the app
 * to already be built (`pnpm --filter buggy-app build`); this script builds
 * it if needed. Unlike fixtures/videos/**, these PNGs are committed --
 * they're documentation, not regenerated test input, so the README renders
 * without anyone running this script first.
 */
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@sutriva/browser";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const outDir = path.join(repoRoot, "docs/assets");
const port = 4173;
const baseUrl = `http://localhost:${port}`;

mkdirSync(outDir, { recursive: true });

function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) return reject(new Error(`Server at ${url} did not start in time`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function main() {
  console.log("Building demo/buggy-app...");
  execFileSync("pnpm", ["--filter", "buggy-app", "build"], { cwd: repoRoot, stdio: "inherit" });

  console.log("Starting demo/buggy-app...");
  const server = spawn("pnpm", ["--filter", "buggy-app", "start"], { cwd: repoRoot, stdio: "pipe" });
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch({ headless: true });

    {
      // Bug 1 -- checkout schema mismatch: click throws, no confirmation appears.
      const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => consoleErrors.push(err.message));
      await page.goto(`${baseUrl}/checkout`);
      await page.click("#checkout-btn");
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(outDir, "bug-1-checkout.png") });
      await page.close();
      console.log("bug-1-checkout.png -- console error captured:", consoleErrors[0] ?? "(none)");
    }

    {
      // Bug 2 -- search race condition: "cats" is typed, but stale "cat" results win.
      const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
      await page.goto(`${baseUrl}/search`);
      await page.type("#search-input", "cat", { delay: 20 });
      await page.waitForTimeout(150);
      await page.type("#search-input", "s", { delay: 20 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(outDir, "bug-2-search.png") });
      await page.close();
    }

    {
      // Bug 3 -- responsive regression: submit button hidden under the header at narrow widths.
      const page = await browser.newPage({ viewport: { width: 375, height: 400 } });
      await page.goto(`${baseUrl}/responsive`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, "bug-3-responsive.png") });
      await page.close();
    }

    await browser.close();
  } finally {
    server.kill("SIGTERM");
  }

  console.log(`Done -- wrote screenshots to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
