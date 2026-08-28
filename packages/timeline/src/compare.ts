import { getStore } from "@sutriva/storage";
import type { TemporalEvent } from "@sutriva/core";

/**
 * Before/after verification (TraceLens_Master_Plan.md Sec16/Sec26/Sec27): compares
 * two sessions -- typically "reproduce the bug" recorded before a fix and
 * the same interaction recorded again after -- and surfaces meaningful
 * differences (an endpoint that used to fail now succeeds, a console error
 * that no longer appears, or a new one that does). This does not claim the
 * fix *caused* the difference; it just makes the before/after evidence
 * easy to see side by side, the same "observed, not asserted" posture as
 * the rest of the evidence model.
 */
export interface SessionSummary {
  sessionId: string;
  eventCount: number;
  consoleErrorCount: number;
  networkFailureCount: number;
}

export interface EndpointChange {
  endpoint: string;
  /** null means this endpoint wasn't observed in the "before" session at all. */
  before: number | null;
  after: number;
}

export interface SessionComparisonResult {
  before: SessionSummary;
  after: SessionSummary;
  /** Endpoints whose most recent status changed from a failure (>=400) to success. */
  resolvedEndpoints: EndpointChange[];
  /** Endpoints that were fine (or unseen) before but now fail, or failed differently. */
  newOrChangedFailingEndpoints: EndpointChange[];
  /** Console error messages seen before but not after. */
  resolvedConsoleErrors: string[];
  /** Console error messages seen after but not before. */
  newConsoleErrors: string[];
  /** One-line human summary, e.g. "1 endpoint fixed, 0 new failures, 1 console error resolved". */
  summary: string;
}

function parseNetworkResponse(description: string): { endpoint: string; status: number } | undefined {
  const match = description.match(/^(\S+)\s+(.+?)\s+->\s+(\d+)\b/);
  if (!match) return undefined;
  return { endpoint: `${match[1]} ${match[2]}`, status: Number(match[3]) };
}

function isConsoleError(event: TemporalEvent): boolean {
  return event.type === "console" && /error|exception/i.test(event.description);
}

function isNetworkFailureDescription(description: string): boolean {
  const parsed = parseNetworkResponse(description);
  if (parsed) return parsed.status >= 400;
  return /failed:/i.test(description);
}

/** Last-seen status per endpoint (method + URL), in chronological order -- later responses win. */
function latestStatusByEndpoint(events: TemporalEvent[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "network") continue;
    const parsed = parseNetworkResponse(event.description);
    if (parsed) result.set(parsed.endpoint, parsed.status);
  }
  return result;
}

/** Normalized (truncated) console error messages, deduplicated. */
function consoleErrorSet(events: TemporalEvent[]): Set<string> {
  return new Set(events.filter(isConsoleError).map((e) => e.description.slice(0, 200)));
}

function summarize(sessionId: string, events: TemporalEvent[]): SessionSummary {
  return {
    sessionId,
    eventCount: events.length,
    consoleErrorCount: events.filter(isConsoleError).length,
    networkFailureCount: events.filter((e) => e.type === "network" && isNetworkFailureDescription(e.description)).length,
  };
}

export function compareSessions(beforeSessionId: string, afterSessionId: string): SessionComparisonResult {
  const store = getStore();
  store.getSession(beforeSessionId);
  store.getSession(afterSessionId);

  const beforeEvents = store.listEvents(beforeSessionId);
  const afterEvents = store.listEvents(afterSessionId);

  const beforeStatus = latestStatusByEndpoint(beforeEvents);
  const afterStatus = latestStatusByEndpoint(afterEvents);

  const resolvedEndpoints: EndpointChange[] = [];
  const newOrChangedFailingEndpoints: EndpointChange[] = [];

  for (const [endpoint, afterCode] of afterStatus) {
    const beforeCode = beforeStatus.get(endpoint);
    const wasFailure = beforeCode !== undefined && beforeCode >= 400;
    const isFailure = afterCode >= 400;
    if (wasFailure && !isFailure) {
      resolvedEndpoints.push({ endpoint, before: beforeCode, after: afterCode });
    } else if (isFailure && beforeCode !== afterCode) {
      // Either newly failing, or failing differently than before -- both worth surfacing.
      newOrChangedFailingEndpoints.push({ endpoint, before: beforeCode ?? null, after: afterCode });
    }
  }

  const beforeErrors = consoleErrorSet(beforeEvents);
  const afterErrors = consoleErrorSet(afterEvents);
  const resolvedConsoleErrors = [...beforeErrors].filter((e) => !afterErrors.has(e));
  const newConsoleErrors = [...afterErrors].filter((e) => !beforeErrors.has(e));

  const summaryParts = [
    `${resolvedEndpoints.length} endpoint(s) fixed`,
    `${newOrChangedFailingEndpoints.length} new/changed failure(s)`,
    `${resolvedConsoleErrors.length} console error(s) resolved`,
    `${newConsoleErrors.length} new console error(s)`,
  ];

  return {
    before: summarize(beforeSessionId, beforeEvents),
    after: summarize(afterSessionId, afterEvents),
    resolvedEndpoints,
    newOrChangedFailingEndpoints,
    resolvedConsoleErrors,
    newConsoleErrors,
    summary: summaryParts.join(", "),
  };
}
