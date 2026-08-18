import type { Command } from "commander";
import { spawnSync } from "node:child_process";
import { getDataDir, getVisionProviderName } from "@tracelens/core";

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
        name: "Node.js >= 20",
        ok: nodeMajor >= 20,
        detail: `v${process.versions.node}`,
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

      const dataDir = getDataDir();
      checks.push({ name: "data directory", ok: true, detail: dataDir });

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
