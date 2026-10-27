import type { Command } from "commander";
import type { EventType } from "@sutriva/core";
import { getStore } from "@sutriva/storage";
import { generateSessionReport, type SessionReport, type SessionReportIssue } from "@sutriva/timeline";
import { colorizeEvent, pc } from "../lib/colors.js";

export function registerSessionCommand(program: Command): void {
  const session = program.command("session").description("Inspect stored Sutriva sessions");

  session
    .command("list")
    .description("List all sessions")
    .action(() => {
      const sessions = getStore().listSessions();
      if (sessions.length === 0) {
        console.log("No sessions yet. Run `sutriva inspect <video>` or `sutriva debug --live` first.");
        return;
      }
      for (const s of sessions) {
        const modeColor = s.mode === "live" ? pc.green : pc.magenta;
        console.log(`${s.id}  mode=${modeColor(s.mode)}  started=${s.startedAt}`);
      }
    });

  session
    .command("report [sessionId]")
    .description("Generate a human-readable report (summary, issues, timeline, Git state) for a session")
    .option("--json", "Output raw JSON")
    .action(async (sessionId: string | undefined, opts: { json?: boolean }) => {
      const store = getStore();
      const resolvedId = sessionId ?? store.findActiveLiveSession()?.id ?? store.listSessions()[0]?.id;
      if (!resolvedId) {
        console.log("No sessions yet. Run `sutriva inspect <video>` or `sutriva debug --live` first.");
        return;
      }

      const report = await generateSessionReport(resolvedId);
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      printSessionReport(report);
    });
}

function printIssueList(title: string, issues: SessionReportIssue[]): void {
  if (issues.length === 0) return;
  console.log(pc.bold(pc.red(`\n${title} (${issues.length})`)));
  for (const issue of issues) {
    console.log(colorizeEvent(issue, `  ${issue.start.toFixed(2).padStart(8)}s  ${issue.description}`));
  }
}

function printSessionReport(report: SessionReport): void {
  const { session, durationSeconds, eventCount, eventCountsByType, consoleErrors, networkFailures, timeline, git } = report;

  console.log(pc.bold(`Session ${session.id}`));
  console.log(`  mode:       ${session.mode}`);
  console.log(`  started:    ${session.startedAt}`);
  if (session.endedAt) console.log(`  ended:      ${session.endedAt}`);
  console.log(`  duration:   ${durationSeconds.toFixed(2)}s`);
  console.log(`  events:     ${eventCount}`);

  const typeBreakdown = Object.entries(eventCountsByType)
    .map(([type, count]) => colorizeEvent({ type: type as EventType, description: "" }, `${type}=${count}`))
    .join("  ");
  if (typeBreakdown) console.log(`  by type:    ${typeBreakdown}`);

  if (git?.isRepo) {
    console.log(pc.bold("\nGit state"));
    console.log(`  branch:     ${git.branch ?? "(detached)"}`);
    console.log(`  commit:     ${git.commit?.slice(0, 12)}  ${git.commitMessage ?? ""}`);
    console.log(`  dirty:      ${git.dirty ? pc.yellow(`yes (${git.changedFiles?.length ?? 0} file(s))`) : "no"}`);
  }

  printIssueList("Console errors", consoleErrors);
  printIssueList("Network failures", networkFailures);

  console.log(pc.bold(`\nTimeline (${timeline.length} event(s))`));
  for (const event of timeline) {
    const line = `  ${event.timestamp.start.toFixed(2).padStart(8)}s  [${event.type}]  ${event.description}`;
    console.log(colorizeEvent(event, line));
  }
}
