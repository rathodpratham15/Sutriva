import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { generateId } from "@sutriva/core";
import { SutrivaStore } from "@sutriva/storage";

describe("SutrivaStore", () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips sessions, events, and evidence", () => {
    dir = mkdtempSync(path.join(tmpdir(), "sutriva-store-test-"));
    const store = new SutrivaStore(path.join(dir, "test.db"));

    const sessionId = generateId("session");
    store.createSession({
      id: sessionId,
      mode: "replay",
      startedAt: new Date().toISOString(),
      sources: [{ kind: "video", reference: "/tmp/fake.mp4" }],
    });

    expect(store.getSession(sessionId).id).toBe(sessionId);

    const eventId = generateId("event");
    store.insertEvent({
      id: eventId,
      sessionId,
      timestamp: { start: 5, end: 5 },
      type: "visual",
      description: "checkout error appears",
      confidence: 0.8,
      source: { kind: "frame", reference: "artifact_1" },
      relatedEventIds: [],
    });

    const events = store.listEvents(sessionId);
    expect(events).toHaveLength(1);
    expect(events[0]?.description).toContain("checkout error");

    const found = store.searchEvents(sessionId, "checkout");
    expect(found).toHaveLength(1);
    expect(store.searchEvents(sessionId, "nonexistent")).toHaveLength(0);

    store.insertEvidence({
      id: generateId("evidence"),
      eventId,
      sessionId,
      type: "frame",
      timestamp: { start: 5, end: 5 },
      description: "checkout error appears",
      confidence: 0.8,
      source: { kind: "frame", reference: "artifact_1" },
      relatedEvidenceIds: [],
    });
    expect(store.getEvidenceAround(sessionId, 5, 2)).toHaveLength(1);
    expect(store.getEvidenceAround(sessionId, 50, 2)).toHaveLength(0);

    store.close();
  });

  it("throws an actionable error for an unknown session", () => {
    dir = mkdtempSync(path.join(tmpdir(), "sutriva-store-test-"));
    const store = new SutrivaStore(path.join(dir, "test.db"));
    expect(() => store.getSession("session_missing")).toThrowError(/no session found/i);
    store.close();
  });
});
