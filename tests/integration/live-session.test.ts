import { describe, it, expect, beforeEach, afterEach } from "vitest";
import http from "node:http";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { startLiveSession } from "@tracelens/live";
import { getStore } from "@tracelens/storage";
import { getCurrentContext } from "@tracelens/timeline";

const PAGE_HTML = `<!doctype html>
<html>
<body>
  <button id="fail-btn">Trigger failure</button>
  <script>
    window.addEventListener("load", () => {
      fetch("/api/fail").then((r) => console.log("fail status", r.status));
      setTimeout(() => document.getElementById("fail-btn").click(), 150);
    });
    document.getElementById("fail-btn").addEventListener("click", () => {
      console.error("Something went wrong after clicking");
    });
  </script>
</body>
</html>`;

function startTestServer(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === "/api/fail") {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "boom" }));
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

describe("live browser session (end-to-end)", () => {
  let dataDir: string;
  let testServer: Awaited<ReturnType<typeof startTestServer>>;

  beforeEach(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-live-test-"));
    process.env.TRACELENS_DATA_DIR = dataDir;
    testServer = await startTestServer();
  });

  afterEach(async () => {
    await testServer.close();
    delete process.env.TRACELENS_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("captures navigation, network, console, and interaction events into the same event model replay uses", async () => {
    const logLines: string[] = [];
    const handle = await startLiveSession({
      url: testServer.url,
      headless: true,
      screenshotIntervalSeconds: 60,
      onLog: (line) => logLines.push(line),
    });

    expect(handle.sessionId).toMatch(/^session_/);

    // Let the page load, fire its fetch, and auto-click settle.
    await wait(1200);

    const store = getStore();
    const events = store.listEvents(handle.sessionId);

    expect(events.some((e) => e.type === "dom" && e.description.includes("Navigated to"))).toBe(true);
    expect(events.some((e) => e.type === "network" && /-> 500\b/.test(e.description))).toBe(true);
    expect(events.some((e) => e.type === "console" && /Something went wrong/.test(e.description))).toBe(true);
    expect(events.some((e) => e.type === "interaction" && /Click on/.test(e.description))).toBe(true);

    // Every event should also be recorded as directly-observed evidence (confidence 1).
    const evidence = store.listEvidence(handle.sessionId);
    expect(evidence.length).toBe(events.length);
    expect(evidence.every((e) => e.confidence === 1)).toBe(true);

    // The console error should be correlated (by proximity, not causality) to a
    // preceding network event -- the plan's click->request->error evidence chain.
    const consoleError = events.find((e) => e.type === "console" && /Something went wrong/.test(e.description));
    expect(consoleError!.relatedEventIds.length).toBeGreaterThan(0);
    const relatedEvent = events.find((e) => e.id === consoleError!.relatedEventIds[0]);
    expect(relatedEvent!.type).toBe("network");

    // The live CLI log should have received human-readable lines too.
    expect(logLines.some((l) => l.includes("[network]"))).toBe(true);

    const context = await getCurrentContext(handle.sessionId);
    expect(context.recentEvents.length).toBeGreaterThan(0);
    expect(context.recentConsoleErrors.some((e) => e.includes("Something went wrong"))).toBe(true);
    expect(context.recentNetworkFailures.some((e) => e.includes("500"))).toBe(true);
    expect(context.screenshot).toBeDefined();
    expect(context.screenshot!.base64.length).toBeGreaterThan(100);

    const summary = await handle.stop();
    expect(summary.eventCount).toBe(events.length);

    // After stop(), the session should no longer be discoverable as "active".
    expect(store.findActiveLiveSession()).toBeUndefined();
  }, 20_000);

  it("get_current_context auto-discovers the active live session without an explicit sessionId", async () => {
    const handle = await startLiveSession({
      url: testServer.url,
      headless: true,
      screenshotIntervalSeconds: 60,
    });
    await wait(500);

    const context = await getCurrentContext(); // no sessionId
    expect(context.sessionId).toBe(handle.sessionId);

    await handle.stop();
  }, 20_000);
});
