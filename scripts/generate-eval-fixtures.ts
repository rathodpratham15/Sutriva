#!/usr/bin/env node
/**
 * Generates deterministic MP4 fixtures for the evaluation suite by actually
 * driving demo/buggy-app with Playwright and recording each reproduction
 * (TraceLens_Master_Plan.md Sec28-29). Real bugs, real browser, real video --
 * not synthetic color bars. Requires the app to already be built
 * (`pnpm --filter buggy-app build`); this script builds it if needed.
 */
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@sutriva/browser";
import { EVAL_REPROS } from "../tests/eval/repros.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const outDir = path.join(repoRoot, "fixtures/videos/eval");
const port = 4173;
const baseUrl = `http://localhost:${port}`;

mkdirSync(outDir, { recursive: true });

function waitForServer(url, timeoutMs = 20000) {
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

async function recordScenario(name, run) {
  const tmpDir = path.join(outDir, `.tmp-${name}`);
  mkdirSync(tmpDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: tmpDir, size: { width: 800, height: 600 } },
    viewport: { width: 800, height: 600 },
  });
  const page = await context.newPage();
  await run(page);
  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (!videoPath || !existsSync(videoPath)) {
    throw new Error(`No video recorded for scenario "${name}"`);
  }
  const mp4Path = path.join(outDir, `${name}.mp4`);
  execFileSync("ffmpeg", ["-y", "-i", videoPath, "-pix_fmt", "yuv420p", mp4Path], { stdio: "inherit" });
  rmSync(tmpDir, { recursive: true, force: true });
  console.log(`Wrote ${mp4Path}`);
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

    for (const [name, repro] of Object.entries(EVAL_REPROS)) {
      await recordScenario(name, (page) => repro(page, baseUrl));
    }
  } finally {
    server.kill("SIGTERM");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
