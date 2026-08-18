import type { Command } from "commander";
import { rmSync } from "node:fs";
import { getDataDir } from "@tracelens/core";

export function registerCleanCommand(program: Command): void {
  program
    .command("clean")
    .description("Delete all derived artifacts and the local database (does not touch source videos)")
    .option("--yes", "Skip confirmation")
    .action((opts: { yes?: boolean }) => {
      const dir = getDataDir();
      if (!opts.yes) {
        console.log(`This will delete ${dir} (sessions, timelines, extracted frames). Re-run with --yes to confirm.`);
        return;
      }
      rmSync(dir, { recursive: true, force: true });
      console.log(`Removed ${dir}`);
    });
}
