import type { Command } from "commander";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { getDataDir, getTranscriptionProviderName, getVisionProviderName, MIN_SUPPORTED_NODE_MAJOR } from "@tracelens/core";
import { chromium } from "@tracelens/browser";

function checkBinary(bin: string, args: string[] = ["-version"]): { ok: boolean; detail: string } {
  try {
    const res = spawnSync(bin, args, { encoding: "utf8" });
    if (res.error || res.status !== 0) {
      return { ok: false, detail: "not found" };
    }
    const firstLine = (res.stdout || res.stderr || "").split("\n")[0] ?? "";
    return { ok: true, detail: firstLine.trim() };
  } catch {
    return { ok: false, detail: "not found" };
  }
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check that TraceLens's dependencies (ffmpeg, git, Node) are available and configured")
    .action(() => {
      const checks: { name: string; ok: boolean; detail: string }[] = [];

      const nodeMajor = Number(process.versions.node.split(".")[0]);
      checks.push({
        name: `Node.js >= ${MIN_SUPPORTED_NODE_MAJOR}`,
        ok: nodeMajor >= MIN_SUPPORTED_NODE_MAJOR,
        detail:
          nodeMajor >= MIN_SUPPORTED_NODE_MAJOR
            ? `v${process.versions.node}`
            : `v${process.versions.node} -- better-sqlite3's native binding requires Node ${MIN_SUPPORTED_NODE_MAJOR}+ and segfaults on older versions; run \`nvm use\``,
      });

      const ffmpeg = checkBinary("ffmpeg");
      checks.push({ name: "ffmpeg", ok: ffmpeg.ok, detail: ffmpeg.detail });
      const ffprobe = checkBinary("ffprobe");
      checks.push({ name: "ffprobe", ok: ffprobe.ok, detail: ffprobe.detail });
      const git = checkBinary("git", ["--version"]);
      checks.push({ name: "git", ok: git.ok, detail: git.detail });

      const providerName = getVisionProviderName();
      checks.push({
        name: "vision provider",
        ok: true,
        detail: providerName === "mock" ? "mock (offline, deterministic -- set ANTHROPIC_API_KEY for real analysis)" : providerName,
      });

      const transcriptionProviderName = getTranscriptionProviderName();
      checks.push({
        name: "transcription provider",
        ok: true,
        detail:
          transcriptionProviderName === "mock"
            ? "mock (offline, placeholder text -- set ELEVENLABS_API_KEY for real speech-to-text)"
            : transcriptionProviderName,
      });

      const dataDir = getDataDir();
      checks.push({ name: "data directory", ok: true, detail: dataDir });

      // Playwright's own package has no postinstall browser download -- `npm
      // install` alone does not fetch Chromium. Soft check (doesn't fail
      // doctor overall): replay-only usage (inspect/timeline/search/analyze)
      // never touches a browser at all, only `debug --live`/`exec` do.
      let chromiumInstalled = false;
      try {
        chromiumInstalled = existsSync(chromium.executablePath());
      } catch {
        chromiumInstalled = false;
      }
      checks.push({
        name: "playwright chromium (for live debugging)",
        ok: true,
        detail: chromiumInstalled
          ? "installed"
          : "not installed -- run `npx playwright install chromium` before using `tracelens debug --live`",
      });

      let allOk = true;
      for (const check of checks) {
        allOk = allOk && check.ok;
        console.log(`${check.ok ? "✓" : "✗"} ${check.name}: ${check.detail}`);
      }

      if (!allOk) {
        console.log("\nSome checks failed. See docs/architecture.md and README.md for setup instructions.");
        process.exitCode = 1;
      } else {
        console.log("\nAll checks passed.");
      }
    });
}
