import { readFileSync } from "node:fs";
import { TraceLensError } from "@tracelens/core";
import { getStore } from "@tracelens/storage";
import { getGitContext, type GitContext } from "@tracelens/git";

const RECENT_TIMELINE_LIMIT = 15;
const ERROR_LOOKBACK_LIMIT = 100;
const MAX_FILTERED_ITEMS = 5;

export interface CurrentContextEvent {
  start: number;
  type: string;
  description: string;
  confidence?: number;
}

export interface CurrentContextResult {
  sessionId: string;
  mode: string;
  currentUrl?: string;
  recentEvents: CurrentContextEvent[];
  recentConsoleErrors: string[];
  recentNetworkFailures: string[];
  git: GitContext | null;
  screenshot?: { base64: string; mimeType: string; capturedAt: number };
}

function parseSourceMetadata(reference: string): Record<string, unknown> {
  try {
    return JSON.parse(reference) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * The "look at this" / "what just happened?" snapshot (TraceLens_Master_Plan.md §10, §18):
 * a compact, bounded view of a session's most recent state, defaulting to
 * whichever live session is currently running if no sessionId is given.
 */
export async function getCurrentContext(sessionId?: string): Promise<CurrentContextResult> {
  const store = getStore();
  const session = sessionId ? store.getSession(sessionId) : store.findActiveLiveSession();
  if (!session) {
    throw new TraceLensError(
      "NO_ACTIVE_SESSION",
      sessionId ? `No session found with id "${sessionId}".` : "No live session is currently running.",
      "Start one with `tracelens debug --live`, or pass an explicit sessionId from inspect_video.",
    );
  }

  const recentEvents = store.listRecentEvents(session.id, RECENT_TIMELINE_LIMIT);
  const lookback = store.listRecentEvents(session.id, ERROR_LOOKBACK_LIMIT);

  const recentConsoleErrors = lookback
    .filter((e) => e.type === "console" && /error|exception/i.test(e.description))
    .slice(-MAX_FILTERED_ITEMS)
    .map((e) => e.description);

  const recentNetworkFailures = lookback
    .filter((e) => e.type === "network" && (/failed:/i.test(e.description) || /-> [45]\d\d\b/.test(e.description)))
    .slice(-MAX_FILTERED_ITEMS)
    .map((e) => e.description);

  const lastNavigation = [...lookback].reverse().find((e) => e.type === "dom" && e.description.startsWith("Navigated to"));
  const currentUrl = lastNavigation ? (parseSourceMetadata(lastNavigation.source.reference).url as string | undefined) : undefined;

  const git = session.repository?.root ? await getGitContext(session.repository.root) : null;

  const screenshotArtifact = store.getLatestArtifact(session.id, "screenshot");
  const screenshot = screenshotArtifact
    ? {
        base64: readFileSync(screenshotArtifact.path).toString("base64"),
        mimeType: screenshotArtifact.mimeType ?? "image/png",
        capturedAt: screenshotArtifact.timestamp?.start ?? 0,
      }
    : undefined;

  return {
    sessionId: session.id,
    mode: session.mode,
    currentUrl,
    recentEvents: recentEvents.map((e) => ({
      start: e.timestamp.start,
      type: e.type,
      description: e.description,
      confidence: e.confidence,
    })),
    recentConsoleErrors,
    recentNetworkFailures,
    git,
    screenshot,
  };
}
