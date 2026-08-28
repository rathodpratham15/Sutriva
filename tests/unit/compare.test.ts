import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { generateId, type TemporalEvent } from "@sutriva/core";
import { getStore } from "@sutriva/storage";
import { compareSessions } from "@sutriva/timeline";

function makeSession(mode: "live" | "replay" = "live"): string {
  const store = getStore();
  const id = generateId("session");
  store.createSession({ id, mode, startedAt: new Date().toISOString(), sources: [] });
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

describe("compareSessions", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "sutriva-compare-test-"));
    process.env.SUTRIVA_DATA_DIR = dataDir;
  });

  afterEach(() => {
    delete process.env.SUTRIVA_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("reports a fixed endpoint (500 -> 200) and a resolved console error", () => {
    const before = makeSession();
    addEvent(before, "network", 0, "POST /api/checkout -> 500");
    addEvent(before, "console", 0.1, "console.error: checkout failed");

    const after = makeSession();
    addEvent(after, "network", 0, "POST /api/checkout -> 200");

    const result = compareSessions(before, after);
    expect(result.resolvedEndpoints).toEqual([{ endpoint: "POST /api/checkout", before: 500, after: 200 }]);
    expect(result.resolvedConsoleErrors).toEqual(["console.error: checkout failed"]);
    expect(result.newConsoleErrors).toEqual([]);
    expect(result.newOrChangedFailingEndpoints).toEqual([]);
  });

  it("reports a newly-introduced failure and a new console error", () => {
    const before = makeSession();
    addEvent(before, "network", 0, "GET /api/ping -> 200");

    const after = makeSession();
    addEvent(after, "network", 0, "GET /api/ping -> 200");
    addEvent(after, "network", 1, "POST /api/checkout -> 500");
    addEvent(after, "console", 1.1, "console.error: new bug introduced");

    const result = compareSessions(before, after);
    expect(result.newOrChangedFailingEndpoints).toEqual([{ endpoint: "POST /api/checkout", before: null, after: 500 }]);
    expect(result.newConsoleErrors).toEqual(["console.error: new bug introduced"]);
    expect(result.resolvedEndpoints).toEqual([]);
  });

  it("uses the most recent status per endpoint when it appears multiple times", () => {
    const before = makeSession();
    addEvent(before, "network", 0, "GET /api/retry -> 500");
    addEvent(before, "network", 1, "GET /api/retry -> 500");

    const after = makeSession();
    addEvent(after, "network", 0, "GET /api/retry -> 500");
    addEvent(after, "network", 1, "GET /api/retry -> 200"); // succeeded on retry

    const result = compareSessions(before, after);
    expect(result.resolvedEndpoints).toEqual([{ endpoint: "GET /api/retry", before: 500, after: 200 }]);
  });

  it("produces a bounded, human-readable summary and per-session counts", () => {
    const before = makeSession();
    addEvent(before, "network", 0, "POST /api/checkout -> 500");
    const after = makeSession();
    addEvent(after, "network", 0, "POST /api/checkout -> 200");

    const result = compareSessions(before, after);
    expect(result.before.eventCount).toBe(1);
    expect(result.before.networkFailureCount).toBe(1);
    expect(result.after.networkFailureCount).toBe(0);
    expect(result.summary).toContain("1 endpoint(s) fixed");
  });

  it("throws an actionable error for an unknown session id", () => {
    const after = makeSession();
    expect(() => compareSessions("session_missing", after)).toThrow(/no session found/i);
  });
});
