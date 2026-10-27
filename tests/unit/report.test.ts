import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { generateId, type TemporalEvent } from "@sutriva/core";
import { getStore } from "@sutriva/storage";
import { generateSessionReport } from "@sutriva/timeline";

function makeSession(mode: "live" | "replay" = "replay", endedAt?: string): string {
  const store = getStore();
  const id = generateId("session");
  store.createSession({ id, mode, startedAt: new Date(0).toISOString(), endedAt, sources: [] });
  return id;
}

function addEvent(sessionId: string, type: TemporalEvent["type"], start: number, description: string): void {
  getStore().insertEvent({
    id: generateId("event"),
    sessionId,
    timestamp: { start, end: start },
    type,
    description,
    source: { kind: "browser", reference: "{}" },
    relatedEventIds: [],
  });
}

describe("generateSessionReport", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "sutriva-report-test-"));
    process.env.SUTRIVA_DATA_DIR = dataDir;
  });

  afterEach(() => {
    delete process.env.SUTRIVA_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("summarizes event-type counts and highlights console errors / network failures", async () => {
    const sessionId = makeSession();
    addEvent(sessionId, "network", 0, "POST /api/checkout -> 500");
    addEvent(sessionId, "console", 0.1, "console.error: checkout failed");
    addEvent(sessionId, "visual", 2, "Frame 1 at t=2.00s.");

    const report = await generateSessionReport(sessionId);

    expect(report.eventCount).toBe(3);
    expect(report.eventCountsByType).toEqual({ network: 1, console: 1, visual: 1 });
    expect(report.networkFailures).toEqual([{ type: "network", start: 0, description: "POST /api/checkout -> 500" }]);
    expect(report.consoleErrors).toEqual([{ type: "console", start: 0.1, description: "console.error: checkout failed" }]);
    expect(report.timeline).toHaveLength(3);
    expect(report.git).toBeNull();
  });

  it("does not flag a successful request or a plain console log as an issue", async () => {
    const sessionId = makeSession();
    addEvent(sessionId, "network", 0, "GET /api/ping -> 200");
    addEvent(sessionId, "console", 0.1, "console.log: ready");

    const report = await generateSessionReport(sessionId);
    expect(report.networkFailures).toEqual([]);
    expect(report.consoleErrors).toEqual([]);
  });

  it("uses wall-clock duration for a live session and the last event's timestamp for a replay", async () => {
    const liveId = makeSession("live", new Date(5000).toISOString());
    addEvent(liveId, "console", 1, "console.log: hi");
    const liveReport = await generateSessionReport(liveId);
    expect(liveReport.durationSeconds).toBe(5);

    const replayId = makeSession("replay");
    addEvent(replayId, "visual", 13.9, "Frame 8 at t=13.90s.");
    const replayReport = await generateSessionReport(replayId);
    expect(replayReport.durationSeconds).toBe(13.9);
  });

  it("throws an actionable error for an unknown session id", async () => {
    await expect(generateSessionReport("session_missing")).rejects.toThrow(/no session found/i);
  });
});
