import type { Command } from "commander";
import { existsSync } from "node:fs";
import path from "node:path";
import * as readline from "node:readline/promises";
import { getStore } from "@sutriva/storage";
import { pc } from "../lib/colors.js";
import { runFixSession } from "../lib/fixAgent.js";

/**
 * An interactive, in-process debugging conversation built on
 * @anthropic-ai/claude-agent-sdk -- not a one-shot spawn of the external
 * `claude -p` CLI (that version could diagnose a real bug correctly but
 * could never apply the fix: a single non-interactive subprocess call has no
 * way to ask a human for permission before editing a file). Sutriva's own
 * MCP tools (read-only evidence queries) are auto-allowed; anything that
 * mutates a file or runs a shell command is gated behind an explicit,
 * per-call y/n prompt in lib/fixAgent.ts's canUseTool policy -- every time,
 * no "always allow" shortcut.
 */
export function registerFixCommand(program: Command): void {
  program
    .command("fix [sessionId]")
    .description(
      "Interactive debugging session: loads a session's evidence via Sutriva's MCP tools, lets you discuss the " +
        "root cause, and -- only once you explicitly approve each step -- applies a fix, runs tests, and verifies " +
        "it with compare_sessions. Defaults to the active live session, or the most recent one.",
    )
    .option("--dry-run", "Print the opening prompt instead of starting the session")
    .action(async (sessionId: string | undefined, opts: { dryRun?: boolean }) => {
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

      console.log(pc.bold(`Starting an interactive debugging session for ${resolvedId}.`));
      console.log(pc.gray("Read-only evidence queries happen automatically; anything that edits a file or runs a shell command will ask first.\n"));

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      let rlClosed = false;
      rl.on("close", () => {
        rlClosed = true;
      });

      try {
        const { banner } = await runFixSession({
          initialPrompt: prompt,
          cwd: process.cwd(),
          mcpServerCommand: resolveMcpServerCommand(),
          print: (line) => console.log(line),
          nextUserInput: async () => {
            if (rlClosed) return null;
            let line: string;
            try {
              line = await rl.question("\nsutriva fix> ");
            } catch {
              return null;
            }
            const trimmed = line.trim();
            if (/^(exit|quit)$/i.test(trimmed)) {
              rl.close();
              return null;
            }
            return line;
          },
          confirmToolUse: async (description) => {
            console.log(pc.yellow(`\n⚠ ${description}`));
            if (rlClosed) return false;
            let answer: string;
            try {
              answer = await rl.question(pc.bold("Allow this? [y/N] "));
            } catch {
              return false;
            }
            return /^y(es)?$/i.test(answer.trim());
          },
        });

        console.log(pc.bold("\n--- Summary ---"));
        console.log(banner);
      } finally {
        if (!rlClosed) rl.close();
      }
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
    "5. Discuss the hypothesis with me before changing anything -- I may have follow-up questions.",
    "6. Once I confirm, apply a code fix and run the relevant tests, reporting their actual output.",
    `7. If a live session is still running, ask me to reproduce the same interaction, then call compare_sessions (before = "${sessionId}", after = the new session) to verify the fix actually resolved the issue, not just that the code changed.`,
    "",
    "Cite the specific evidence behind each claim you make.",
  ].join("\n");
}

/** Mirrors .mcp.json's own dev-mode command when run from a checkout of this repo; falls back to the published sutriva-mcp binary otherwise. */
function resolveMcpServerCommand(): { command: string; args: string[] } {
  const devEntry = path.resolve(process.cwd(), "apps/mcp-server/src/index.ts");
  if (existsSync(devEntry)) {
    return { command: "npx", args: ["tsx", devEntry] };
  }
  return { command: "sutriva-mcp", args: [] };
}
