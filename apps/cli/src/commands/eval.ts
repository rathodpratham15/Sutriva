import type { Command } from "commander";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// apps/cli/src/commands/eval.ts -> repo root when run from source (tsx
// against src/, or a dev checkout). When this file is bundled into
// dist/index.js and installed as a published npm package, this same
// computation resolves to some nonsense path under node_modules -- there is
// no "repo root" at all, because the eval harness's assets (demo/buggy-app,
// tests/eval/*, the eval fixtures) are intentionally development-only and
// are never part of the published package's `files`. Detect that case
// explicitly (see `resolveEvalAssets` below) and fail with a clear,
// actionable message instead of a raw ENOENT/MODULE_NOT_FOUND.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const harnessPath = path.join(repoRoot, "tests/eval/run-eval.ts");
const agenticHarnessPath = path.join(repoRoot, "tests/eval/run-agentic-eval.ts");
// Call the tsx binary directly rather than through npx: npx adds registry-
// resolution overhead/indirection that isn't needed for an already-installed
// local devDependency, and running it nested inside another tsx-executed
// process could otherwise get lost in that indirection.
const tsxBin = path.join(repoRoot, "node_modules/.bin/tsx");

/**
 * `pnpm-workspace.yaml` only exists in a real Sutriva monorepo checkout --
 * never in a published package (only `dist/` is shipped, see
 * apps/cli/package.json's `files`). Checking for it, rather than just the
 * harness file itself, catches partial/corrupted installs the same way.
 */
function isRunningFromMonorepoCheckout(): boolean {
  return existsSync(path.join(repoRoot, "pnpm-workspace.yaml")) && existsSync(harnessPath) && existsSync(tsxBin);
}

export function registerEvalCommand(program: Command): void {
  program
    .command("eval")
    .description(
      "Run the Sutriva evaluation benchmark against demo/buggy-app (generate fixtures first with " +
        "`pnpm fixtures:eval:generate` if you haven't already). Development-only: requires a full Sutriva " +
        "monorepo checkout, not available when installed as a standalone package.",
    )
    .option(
      "--agentic",
      "Also grade root-cause accuracy, code localization, and patch success by actually running Claude Code " +
        "headlessly against a disposable git worktree per scenario -- costs a real API call per scenario and " +
        "takes minutes, not milliseconds. See docs/evaluation.md.",
    )
    .action(async (options: { agentic?: boolean }) => {
      if (!isRunningFromMonorepoCheckout()) {
        console.error(
          "`sutriva eval` requires the full Sutriva monorepo (demo/buggy-app, the eval fixtures, and the " +
            "harness itself) -- these are development-only assets and are intentionally not part of the " +
            "published package you have installed.\n\n" +
            "To run the evaluation suite:\n" +
            "  git clone https://github.com/rathodpratham15/Sutriva.git\n" +
            "  cd Sutriva && pnpm install\n" +
            "  pnpm fixtures:eval:generate\n" +
            "  pnpm eval          # or: pnpm eval:agentic\n",
        );
        process.exitCode = 1;
        return;
      }
      const target = options.agentic ? agenticHarnessPath : harnessPath;
      const exitCode = await new Promise<number>((resolve) => {
        const child = spawn(tsxBin, [target], { cwd: repoRoot, stdio: "inherit" });
        child.on("close", (code) => resolve(code ?? 1));
      });
      process.exitCode = exitCode;
    });
}
