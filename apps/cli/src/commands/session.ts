import type { Command } from "commander";
import { getStore } from "@sutriva/storage";

export function registerSessionCommand(program: Command): void {
  const session = program.command("session").description("Inspect stored Sutriva sessions");

  session
    .command("list")
    .description("List all sessions")
    .action(() => {
      const sessions = getStore().listSessions();
      if (sessions.length === 0) {
        console.log("No sessions yet. Run `sutriva inspect <video>` first.");
        return;
      }
      for (const s of sessions) {
        console.log(`${s.id}  mode=${s.mode}  started=${s.startedAt}`);
      }
    });

  session
    .command("report")
    .description("Generate a session report (issues, evidence, fixes) -- available once live sessions are supported")
    .action(() => {
      console.log(
        "session report is part of Phase 3+ (live/recorded developer sessions) and is not yet implemented.\n" +
          "For now, use `sutriva timeline <video>` to inspect a replayed session's events.",
      );
    });
}
