#!/usr/bin/env node
/**
 * Generates README GIFs by driving demo/buggy-app with Playwright's
 * recordVideo (same approach as scripts/generate-eval-fixtures.ts) and
 * converting each capture to an optimized GIF with ffmpeg's palette
 * filter. Real bugs, real browser, real recordings -- committed to
 * docs/assets/ alongside the static screenshots so the README renders
 * without anyone running this script first.
 */
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "@tracelens/browser";

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

async function recordGif(name: string, viewport: { width: number; height: number }, run: (page: Page) => Promise<void>) {
  const tmpDir = path.join(outDir, `.tmp-${name}`);
  mkdirSync(tmpDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: tmpDir, size: viewport },
    viewport,
  });
  const page = await context.newPage();
  await run(page);
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath || !existsSync(videoPath)) {
    throw new Error(`No video recorded for scenario "${name}"`);
  }

  const gifPath = path.join(outDir, `${name}.gif`);
  const palettePath = path.join(tmpDir, "palette.png");
  // Two-pass palette generation keeps GIF file size and color banding down
  // versus a naive single-pass ffmpeg GIF conversion.
  execFileSync(
    "ffmpeg",
    ["-y", "-i", videoPath, "-vf", "fps=10,scale=480:-1:flags=lanczos,palettegen", palettePath],
    { stdio: "inherit" },
  );
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", videoPath,
      "-i", palettePath,
      "-lavfi", "fps=10,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse",
      gifPath,
    ],
    { stdio: "inherit" },
  );
  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Wrote ${gifPath}`);
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

    await recordGif("bug-1-checkout", { width: 800, height: 500 }, async (page) => {
      await page.goto(`${baseUrl}/checkout`);
      await page.waitForTimeout(300);
      await page.click("#checkout-btn");
      await page.waitForTimeout(700);
    });

    await recordGif("bug-2-search", { width: 800, height: 500 }, async (page) => {
      await page.goto(`${baseUrl}/search`);
      await page.waitForTimeout(300);
      await page.type("#search-input", "cat", { delay: 20 });
      await page.waitForTimeout(150);
      await page.type("#search-input", "s", { delay: 20 });
      await page.waitForTimeout(1200);
    });

    await recordGif("bug-3-responsive", { width: 375, height: 400 }, async (page) => {
      await page.goto(`${baseUrl}/responsive`);
      await page.waitForTimeout(1000);
    });
  } finally {
    server.kill("SIGTERM");
  }

  console.log(`Done -- wrote GIFs to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
