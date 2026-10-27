import { getStore } from "@sutriva/storage";
import type { Session, TemporalEvent } from "@sutriva/core";
import { getGitContext, type GitContext } from "@sutriva/git";
import { isConsoleError, isNetworkFailure } from "./classify.js";

export interface SessionReportIssue {
  type: TemporalEvent["type"];
  start: number;
  description: string;
}

export interface SessionReport {
  session: Session;
  durationSeconds: number;
  eventCount: number;
  eventCountsByType: Record<string, number>;
  consoleErrors: SessionReportIssue[];
  networkFailures: SessionReportIssue[];
  timeline: TemporalEvent[];
  git: GitContext | null;
}

function toIssue(event: TemporalEvent): SessionReportIssue {
  return { type: event.type, start: event.timestamp.start, description: event.description };
}

/**
 * A human-readable summary of a session (`sutriva session report`): metadata,
 * an event-type breakdown, highlighted issues (console errors, network
 * failures), the full timeline, and the Git state the session was recorded
 * against. Unlike the MCP tools, this is meant to be read directly by a
 * developer -- e.g. pasted into a PR or issue -- not queried incrementally.
 */
export async function generateSessionReport(sessionId: string): Promise<SessionReport> {
  const store = getStore();
  const session = store.getSession(sessionId);
  const events = store.listEvents(sessionId);

  const eventCountsByType: Record<string, number> = {};
  for (const event of events) {
    eventCountsByType[event.type] = (eventCountsByType[event.type] ?? 0) + 1;
  }

  // Live sessions have a real wall-clock start/end; a replayed MP4's
  // startedAt/endedAt are both set at ingest time (so they're equal) --
  // its duration is the video's own timeline instead.
  const durationSeconds =
    session.mode === "live" && session.endedAt
      ? (Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000
      : events.reduce((max, e) => Math.max(max, e.timestamp.end), 0);

  const git = session.repository?.root ? await getGitContext(session.repository.root) : null;

  return {
    session,
    durationSeconds,
    eventCount: events.length,
    eventCountsByType,
    consoleErrors: events.filter(isConsoleError).map(toIssue),
    networkFailures: events.filter(isNetworkFailure).map(toIssue),
    timeline: events,
    git,
  };
}
