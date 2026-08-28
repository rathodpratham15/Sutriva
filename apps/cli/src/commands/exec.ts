import type { Command } from "commander";
import { runAndCapture } from "@sutriva/live";

export function registerExecCommand(program: Command): void {
  program
    .command("exec")
    .description(
      "Run a command, streaming its output normally, and record it into the active live session's timeline " +
        '(e.g. `sutriva exec -- npm test`). No-op recording if no live session is running -- the command still runs.',
    )
    .argument("<command...>", "Command and arguments to run (put -- before it)")
    .option("--session <id>", "Explicit session id (defaults to the currently active live session)")
    .action(async (commandParts: string[], opts: { session?: string }) => {
      const [command, ...args] = commandParts;
      if (!command) {
        console.error("Usage: sutriva exec -- <command> [args...]");
        process.exitCode = 1;
        return;
      }
      const result = await runAndCapture({ command, args, sessionId: opts.session });
      console.error(
        result.persisted
          ? `\n[sutriva] recorded in session ${result.sessionId} (${result.durationSeconds.toFixed(1)}s, exit ${result.exitCode})`
          : "\n[sutriva] no active live session -- command ran but was not recorded (start one with `sutriva debug --live`)",
      );
      process.exitCode = result.exitCode;
    });
}
