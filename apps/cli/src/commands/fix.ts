import type { Command } from "commander";
import { spawn } from "node:child_process";
import { getStore } from "@sutriva/storage";
import { pc } from "../lib/colors.js";

/**
 * Thin orchestration only -- Sutriva gathers evidence, this just hands a
 * session id to an external coding agent CLI and gets out of the way. All
 * diagnosis and the patch itself come from the agent being invoked, not from
 * any logic in this file (see docs/competitive-analysis.md's stance against
 * Sutriva itself acting as a computer-use/browser agent).
 */
export function registerFixCommand(program: Command): void {
  program
    .command("fix [sessionId]")
    .description(
      "Close the loop in one command: hands a session's evidence to an agent CLI (default `claude -p`) so it " +
        "can diagnose and patch the bug itself. Defaults to the active live session, or the most recent one.",
    )
    .option("--agent <command>", "Agent CLI to invoke", "claude")
    .option("--dry-run", "Print the prompt instead of invoking the agent")
    .action(async (sessionId: string | undefined, opts: { agent: string; dryRun?: boolean }) => {
      const store = getStore();
      const resolvedId = sessionId ?? store.findActiveLiveSession()?.id ?? store.listSessions()[0]?.id;
      if (!resolvedId) {
        console.log("No sessions yet. Run `sutriva inspect <video>` or `sutriva debug --live` first.");
        process.exitCode = 1;
        return;
      }

      const session = store.getSession(resolvedId);
      const eventCount = store.listEvents(resolvedId).length;
      if (eventCount === 0) {
        console.log(`Session ${resolvedId} has no events yet -- nothing to diagnose.`);
        process.exitCode = 1;
        return;
      }

      const prompt = buildFixPrompt(resolvedId, session.mode);

      if (opts.dryRun) {
        console.log(prompt);
        return;
      }

      console.log(pc.bold(`Handing session ${resolvedId} to \`${opts.agent} -p\`...`));
      console.log(pc.gray("Sutriva only gathered evidence -- diagnosis and the fix itself come from the agent.\n"));

      process.exitCode = await runAgent(opts.agent, prompt);
    });
}

function buildFixPrompt(sessionId: string, mode: string): string {
  return [
    `Use the Sutriva MCP tools to diagnose and fix the bug captured in session "${sessionId}" (mode: ${mode}).`,
    "",
    "Steps:",
    `1. Call get_timeline for session "${sessionId}" to see what was captured.`,
    "2. Call get_evidence around any console error or failed network request to see the surrounding context.",
    "3. Call inspect_environment to see the current Git state.",
    "4. Read the actual source file(s) responsible and form a labeled hypothesis (observed/likely/possible/confirmed) -- do not guess without reading the code.",
    "5. Apply a code fix.",
    `6. If a live session is still running, reproduce the same interaction and call compare_sessions (before = "${sessionId}", after = the new session) to verify the fix actually resolved the issue, not just that the code changed.`,
    "",
    "Report what you changed and why, citing the specific evidence that led you there.",
  ].join("\n");
}

function runAgent(command: string, prompt: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, ["-p", prompt], { stdio: "inherit" });
    child.on("error", (err) => {
      console.error(
        `\nCouldn't start \`${command}\`: ${(err as Error).message}. Is it installed and on PATH? ` +
          "(use --agent to point at a different CLI)",
      );
      resolve(1);
    });
    child.on("close", (code) => resolve(code ?? 1));
  });
}
