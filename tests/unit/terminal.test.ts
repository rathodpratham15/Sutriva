import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { generateId } from "@tracelens/core";
import { getStore } from "@tracelens/storage";
import { runAndCapture } from "@tracelens/live";

describe("runAndCapture", () => {
  let dataDir: string;

  beforeEach(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-terminal-test-"));
    process.env.TRACELENS_DATA_DIR = dataDir;
  });

  afterEach(() => {
    delete process.env.TRACELENS_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("runs the command and returns its exit code even with no active session", async () => {
    const result = await runAndCapture({ command: "node", args: ["-e", "process.exit(0)"] });
    expect(result.exitCode).toBe(0);
    expect(result.persisted).toBe(false);
  });

  it("captures a non-zero exit code", async () => {
    const result = await runAndCapture({ command: "node", args: ["-e", "process.exit(7)"] });
    expect(result.exitCode).toBe(7);
  });

  it("records a terminal event and evidence into an explicit session", async () => {
    const store = getStore();
    const sessionId = generateId("session");
    store.createSession({
      id: sessionId,
      mode: "live",
      startedAt: new Date().toISOString(),
      sources: [],
    });

    const result = await runAndCapture({
      command: "node",
      args: ["-e", "console.log('hello from child'); console.error('API_KEY=super-secret-value')"],
      sessionId,
    });

    expect(result.persisted).toBe(true);
    expect(result.sessionId).toBe(sessionId);

    const events = store.listEvents(sessionId);
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("terminal");
    expect(events[0]!.description).toContain("node");
    expect(events[0]!.confidence).toBe(1);

    // The raw captured output (including the secret) lives in source.reference --
    // it must be redacted there, not just absent from the human-readable description.
    expect(events[0]!.source.reference).toContain("hello from child");
    expect(events[0]!.source.reference).not.toContain("super-secret-value");
    expect(events[0]!.source.reference).toContain("API_KEY=[redacted]");

    const evidence = store.listEvidence(sessionId);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]!.confidence).toBe(1);
  });

  it("does not record anything for an unknown explicit sessionId", async () => {
    await expect(runAndCapture({ command: "node", args: ["-e", "process.exit(0)"], sessionId: "session_missing" })).rejects.toThrow();
  });
});
