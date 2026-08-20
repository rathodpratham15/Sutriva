import type { Command } from "commander";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// apps/cli/src/commands/eval.ts -> repo root
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const harnessPath = path.join(repoRoot, "tests/eval/run-eval.ts");
// Call the tsx binary directly rather than through npx: npx adds registry-
// resolution overhead/indirection that isn't needed for an already-installed
// local devDependency, and running it nested inside another tsx-executed
// process could otherwise get lost in that indirection.
const tsxBin = path.join(repoRoot, "node_modules/.bin/tsx");

export function registerEvalCommand(program: Command): void {
  program
    .command("eval")
    .description(
      "Run the TraceLens evaluation benchmark against demo/buggy-app (generate fixtures first with " +
        "`pnpm fixtures:eval:generate` if you haven't already)",
    )
    .action(async () => {
      const exitCode = await new Promise<number>((resolve) => {
        const child = spawn(tsxBin, [harnessPath], { cwd: repoRoot, stdio: "inherit" });
        child.on("close", (code) => resolve(code ?? 1));
      });
      process.exitCode = exitCode;
    });
}
