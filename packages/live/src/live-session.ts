import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  generateId,
  getArtifactsDir,
  InMemoryEventBus,
  type Artifact,
  type Evidence,
  type Session,
  type TemporalEvent,
} from "@sutriva/core";
import { getStore } from "@sutriva/storage";
import { chromium, instrumentPage, captureScreenshot, type Browser, type Page } from "@sutriva/browser";
import { getGitContext } from "@sutriva/git";
import { findRelatedEventIds } from "./correlate.js";

export interface StartLiveSessionOptions {
  /** Initial URL to navigate to, if any. The session can also be pointed at a page manually. */
  url?: string;
  /** Defaults to false (a real, visible browser window) -- set true for automated/CI use. */
  headless?: boolean;
  /** Repository root to capture Git context from. Defaults to process.cwd(). */
  repositoryRoot?: string;
  /** How often to take a fallback screenshot even with no interaction, in seconds. */
  screenshotIntervalSeconds?: number;
  /** Called with a compact, human-readable line for every captured event -- for a live CLI feed. */
  onLog?: (line: string) => void;
}

export interface LiveSessionHandle {
  sessionId: string;
  /**
   * The instrumented page, exposed so a caller can script interactions
   * (clicks, typing, navigation) into this session beyond the initial
   * `options.url` navigation -- e.g. the eval harness driving a scripted bug
   * repro instead of a human. A real user driving `sutriva debug --live`
   * never touches this; it's for programmatic callers.
   */
  page: Page;
  stop(): Promise<{ eventCount: number; durationSeconds: number }>;
}

const DEFAULT_SCREENSHOT_INTERVAL_SECONDS = 5;
const SCREENSHOT_TRIGGER_TYPES = new Set(["dom", "interaction"]);

function formatWallClock(sessionStartMs: number, elapsedSeconds: number): string {
  const date = new Date(sessionStartMs + elapsedSeconds * 1000);
  return date.toISOString().slice(11, 23); // HH:MM:SS.mmm
}

/**
 * Starts a live browser debugging session: launches a browser, instruments
 * the page, and persists every observation into the same sessions/events/
 * evidence tables a replayed MP4 uses (TraceLens_Master_Plan.md §6) -- Claude
 * queries a live session with the exact same get_timeline/get_evidence/
 * search_session tools, no separate "live" API.
 */
export async function startLiveSession(options: StartLiveSessionOptions = {}): Promise<LiveSessionHandle> {
  const store = getStore();
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  const gitContext = await getGitContext(repositoryRoot);

  const session: Session = {
    id: generateId("session"),
    mode: "live",
    startedAt: new Date().toISOString(),
    repository: gitContext.isRepo
      ? { root: gitContext.root ?? repositoryRoot, branch: gitContext.branch, commit: gitContext.commit }
      : undefined,
    sources: [{ kind: "browser", reference: options.url ?? "about:blank" }],
  };
  store.createSession(session);

  const sessionArtifactsDir = path.join(getArtifactsDir(), session.id);
  mkdirSync(sessionArtifactsDir, { recursive: true });

  // Playwright's launch() defaults to handling SIGINT/SIGTERM/SIGHUP itself
  // (closing the browser and terminating the process immediately). That
  // races against -- and wins over -- our own shutdown logic below, which
  // needs to persist the session and print a summary before exiting. Disable
  // Playwright's handlers so ours has exclusive control of the signal.
  const browser: Browser = await chromium.launch({
    headless: options.headless ?? false,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  });
  const page: Page = await browser.newPage();

  const bus = new InMemoryEventBus();
  const sessionStartMs = Date.now();
  let latestScreenshotArtifactId: string | undefined;

  async function takeScreenshot(atSeconds: number): Promise<void> {
    try {
      const buffer = await captureScreenshot(page);
      const screenshotPath = path.join(sessionArtifactsDir, `screenshot-${atSeconds.toFixed(3)}.png`);
      writeFileSync(screenshotPath, buffer);
      const artifact: Artifact = {
        id: generateId("artifact"),
        sessionId: session.id,
        kind: "screenshot",
        path: screenshotPath,
        timestamp: { start: atSeconds, end: atSeconds },
        mimeType: "image/png",
      };
      store.insertArtifact(artifact);
      latestScreenshotArtifactId = artifact.id;
    } catch (err) {
      // A closed page/browser during shutdown is expected; anything else is worth surfacing.
      console.error("Sutriva: screenshot capture failed:", err);
    }
  }

  const RECENT_EVENTS_BUFFER_SIZE = 20;
  const recentEventsBuffer: TemporalEvent[] = [];

  const unsubscribePersist = bus.subscribe((event: TemporalEvent) => {
    // Bounded, best-effort evidence correlation (§24): link this event to a
    // plausible preceding cause (e.g. a click that triggered this request)
    // purely by type sequence + time proximity -- not a causality claim.
    event.relatedEventIds = findRelatedEventIds(event, recentEventsBuffer);
    recentEventsBuffer.push(event);
    if (recentEventsBuffer.length > RECENT_EVENTS_BUFFER_SIZE) recentEventsBuffer.shift();

    store.insertEvent(event);
    const evidence: Evidence & { sessionId: string } = {
      id: generateId("evidence"),
      eventId: event.id,
      sessionId: session.id,
      type: event.type,
      timestamp: event.timestamp,
      description: event.description,
      confidence: 1, // directly observed browser fact, not an inference
      source: event.source,
      artifactId: latestScreenshotArtifactId,
      relatedEvidenceIds: [],
    };
    store.insertEvidence(evidence);
  });

  const unsubscribeLog = bus.subscribe((event: TemporalEvent) => {
    options.onLog?.(`${formatWallClock(sessionStartMs, event.timestamp.start)}  [${event.type}]  ${event.description}`);
  });

  const unsubscribeScreenshotTrigger = bus.subscribe((event: TemporalEvent) => {
    if (SCREENSHOT_TRIGGER_TYPES.has(event.type)) {
      void takeScreenshot(event.timestamp.start);
    }
  });

  const detachPage = await instrumentPage(page, (observation) => {
    bus.publish({
      id: generateId("event"),
      sessionId: session.id,
      timestamp: { start: observation.timestamp, end: observation.timestamp },
      type: observation.type,
      description: observation.description,
      confidence: 1,
      source: { kind: "browser", reference: JSON.stringify(observation.metadata ?? {}).slice(0, 500) },
      relatedEventIds: [],
    });
  });

  const screenshotInterval = setInterval(
    () => void takeScreenshot((Date.now() - sessionStartMs) / 1000),
    (options.screenshotIntervalSeconds ?? DEFAULT_SCREENSHOT_INTERVAL_SECONDS) * 1000,
  );

  if (options.url) {
    await page.goto(options.url).catch((err) => {
      options.onLog?.(`Failed to navigate to ${options.url}: ${(err as Error).message}`);
    });
  }
  await takeScreenshot(0);

  return {
    sessionId: session.id,
    page,
    async stop() {
      clearInterval(screenshotInterval);
      unsubscribePersist();
      unsubscribeLog();
      unsubscribeScreenshotTrigger();
      detachPage();
      // browser.close() can hang indefinitely if the underlying browser
      // process already died externally (e.g. a signal delivered to the
      // whole process group, or the user closing the window) -- a session
      // must still be able to end and persist cleanly in that case.
      await Promise.race([
        browser.close().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);
      const endedAt = new Date().toISOString();
      store.endSession(session.id, endedAt);
      // Query fresh rather than a locally-tracked counter: other processes
      // (e.g. `sutriva exec`) can insert events into this same session
      // between publishes, and a counter only incremented by this process's
      // own bus subscriber would silently undercount them.
      const eventCount = store.listEvents(session.id).length;
      return { eventCount, durationSeconds: (Date.now() - sessionStartMs) / 1000 };
    },
  };
}
