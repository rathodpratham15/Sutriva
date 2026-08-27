import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "node:http";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { startLiveSession } from "@tracelens/live";
import { getTimeline, getEvidenceAround } from "@tracelens/timeline";

/**
 * The precise capability this project claims and Claude Code's own native
 * browser integration (--chrome) does not have: a persistent, timestamped
 * record of a session that can be queried for what happened *before* a
 * specific moment, even after later, unrelated events have since occurred.
 * Observation alone (watching a live tab) doesn't need this -- there's
 * nothing to "look back" at until something has actually passed and more
 * has happened since. This test constructs exactly that shape: an action,
 * then a failure, then *more* action after the failure, then asserts a
 * time-bounded query correctly returns only the pre-failure history and
 * excludes what happened afterward -- not just "did capture happen"
 * (already covered by live-session.test.ts).
 */

const PAGE_HTML = `<!doctype html>
<html>
<body>
  <button id="setup-btn">Do setup</button>
  <button id="fail-btn">Trigger failure</button>
  <button id="cleanup-btn">Do cleanup</button>
  <script>
    document.getElementById("setup-btn").addEventListener("click", () => {
      fetch("/api/setup").then((r) => console.log("setup status", r.status));
    });
    document.getElementById("fail-btn").addEventListener("click", () => {
      fetch("/api/checkout").then((r) => console.log("checkout status", r.status));
      console.error("Checkout failed unexpectedly");
    });
    document.getElementById("cleanup-btn").addEventListener("click", () => {
      fetch("/api/cleanup").then((r) => console.log("cleanup status", r.status));
    });
  </script>
</body>
</html>`;

function startTestServer(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/api/checkout") {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "boom" }));
        return;
      }
      if (req.url === "/api/setup" || req.url === "/api/cleanup") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(PAGE_HTML);
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("temporal memory: querying history before a moment, after more has happened since", () => {
  let dataDir: string;
  let testServer: Awaited<ReturnType<typeof startTestServer>>;

  beforeEach(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-temporal-memory-test-"));
    process.env.TRACELENS_DATA_DIR = dataDir;
    testServer = await startTestServer();
  });

  afterEach(async () => {
    await testServer.close();
    delete process.env.TRACELENS_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("retrieves the correct pre-failure evidence even after later, unrelated events have occurred", async () => {
    const handle = await startLiveSession({ url: testServer.url, headless: true, screenshotIntervalSeconds: 60 });

    // 1. A developer performs an action that succeeds (the "before" history).
    await handle.page.click("#setup-btn");
    await wait(1000);

    // 2. A failure occurs.
    await handle.page.click("#fail-btn");
    await wait(1000);

    // 3. More, unrelated events occur *after* the failure -- this is the part
    // a snapshot-only "look at the current tab" capability has no way to
    // distinguish from the failure itself once enough time has passed.
    await handle.page.click("#cleanup-btn");
    await wait(1000);

    const allEvents = getTimeline(handle.sessionId, { limit: 200 });
    expect(allEvents.length).toBeGreaterThanOrEqual(6); // 3 clicks + at least 3 network/console events

    const failureEvent = allEvents.find((e) => e.type === "console" && /Checkout failed/.test(e.description));
    expect(failureEvent).toBeDefined();
    const failureTimestamp = failureEvent!.timestamp.start;

    const setupEvent = allEvents.find((e) => e.type === "interaction" && /setup-btn|Do setup/i.test(e.description));
    const cleanupEvent = allEvents.find((e) => e.type === "interaction" && /cleanup-btn|Do cleanup/i.test(e.description));
    expect(setupEvent).toBeDefined();
    expect(cleanupEvent).toBeDefined();
    // Sanity: the fixture actually has history both before and after the failure.
    expect(setupEvent!.timestamp.start).toBeLessThan(failureTimestamp);
    expect(cleanupEvent!.timestamp.start).toBeGreaterThan(failureTimestamp);

    // The actual claim under test: "what happened right before this?" --
    // a narrow window around the failure must include the pre-failure setup
    // action and must NOT include the later cleanup action, even though the
    // cleanup event now exists in the same session and the same store.
    const evidenceBeforeFailure = getEvidenceAround(handle.sessionId, failureTimestamp, 0.3);
    const evidenceDescriptions = evidenceBeforeFailure.map((e) => e.description);
    expect(evidenceDescriptions.some((d) => /Checkout failed/.test(d))).toBe(true);
    expect(evidenceDescriptions.some((d) => /cleanup-btn|Do cleanup/i.test(d))).toBe(false);

    // get_timeline's beforeSeconds bound gives the same discrimination directly
    // (inclusive of the boundary timestamp itself -- "up to and including the
    // failure" -- so the failure event itself is expected here too; the
    // interesting assertion is that the later cleanup event is excluded).
    const timelineBeforeFailure = getTimeline(handle.sessionId, { beforeSeconds: failureTimestamp });
    expect(timelineBeforeFailure.some((e) => /setup-btn|Do setup/i.test(e.description))).toBe(true);
    expect(timelineBeforeFailure.some((e) => /Checkout failed/.test(e.description))).toBe(true);
    expect(timelineBeforeFailure.some((e) => /cleanup-btn|Do cleanup/i.test(e.description))).toBe(false);

    await handle.stop();
  }, 20_000);
});
