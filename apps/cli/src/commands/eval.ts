import type { Command } from "commander";

export function registerEvalCommand(program: Command): void {
  program
    .command("eval")
    .description("Run the TraceLens evaluation benchmark (planned for a later phase)")
    .action(() => {
      console.log(
        "tracelens eval is not yet implemented -- it depends on the demo app and replay debugging loop " +
          "(see TraceLens_Master_Plan.md §29-30). Run `pnpm eval` for the current placeholder.",
      );
    });
}
