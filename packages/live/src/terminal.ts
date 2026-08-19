import { spawn } from "node:child_process";
import { generateId, redactSecrets, type Evidence, type TemporalEvent } from "@tracelens/core";
import { getStore } from "@tracelens/storage";

export interface RunAndCaptureOptions {
  command: string;
  args: string[];
  cwd?: string;
  /** Explicit session to attach this command to. Defaults to the currently active live session, if any. */
  sessionId?: string;
  /** Bound on how much of stdout/stderr gets persisted (the live terminal output itself is not truncated). */
  maxOutputChars?: number;
}

export interface RunAndCaptureResult {
  exitCode: number;
  durationSeconds: number;
  /** True if a live session was found and this command was recorded into its timeline. */
  persisted: boolean;
  sessionId?: string;
}

const DEFAULT_MAX_OUTPUT_CHARS = 4000;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}… [truncated]` : text;
}

/**
 * Terminal instrumentation (TraceLens_Master_Plan.md §22): runs `command`
 * as a real child process -- stdout/stderr stream to the caller's terminal
 * unmodified, exactly as if the command had been run directly -- while also
 * capturing a bounded, redacted copy for the active live session's timeline,
 * if one is running. If no live session is active (and none is explicitly
 * given), the command still runs normally; nothing is persisted.
 */
export async function runAndCapture(options: RunAndCaptureOptions): Promise<RunAndCaptureResult> {
  const store = getStore();
  const session = options.sessionId ? store.getSession(options.sessionId) : store.findActiveLiveSession();
  const maxChars = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;
  const startedAtMs = Date.now();

  const { exitCode, stdout, stderr } = await new Promise<{ exitCode: number; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(options.command, options.args, {
        cwd: options.cwd,
        stdio: ["inherit", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk: Buffer) => {
        process.stdout.write(chunk);
        if (stdout.length < maxChars) stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        process.stderr.write(chunk);
        if (stderr.length < maxChars) stderr += chunk.toString();
      });
      child.on("error", reject);
      child.on("close", (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
    },
  );

  const durationSeconds = (Date.now() - startedAtMs) / 1000;

  if (!session) {
    return { exitCode, durationSeconds, persisted: false };
  }

  // Redact the command line itself too -- arguments can carry secrets just as
  // easily as output can (e.g. `curl -H "Authorization: Bearer <token>"`).
  const commandLine = redactSecrets([options.command, ...options.args].join(" "));
  const timestamp = { start: (startedAtMs - Date.parse(session.startedAt)) / 1000, end: 0 };
  timestamp.end = timestamp.start + durationSeconds;

  const event: TemporalEvent = {
    id: generateId("event"),
    sessionId: session.id,
    timestamp,
    type: "terminal",
    description: `$ ${commandLine} (exit ${exitCode}, ${durationSeconds.toFixed(1)}s)`,
    confidence: 1,
    source: {
      kind: "terminal",
      reference: JSON.stringify({
        command: commandLine,
        exitCode,
        stdout: truncate(redactSecrets(stdout), maxChars),
        stderr: truncate(redactSecrets(stderr), maxChars),
      }).slice(0, maxChars * 2 + 500),
    },
    relatedEventIds: [],
  };
  store.insertEvent(event);

  const evidence: Evidence & { sessionId: string } = {
    id: generateId("evidence"),
    eventId: event.id,
    sessionId: session.id,
    type: "terminal",
    timestamp: event.timestamp,
    description: event.description,
    confidence: 1,
    source: event.source,
    relatedEvidenceIds: [],
  };
  store.insertEvidence(evidence);

  return { exitCode, durationSeconds, persisted: true, sessionId: session.id };
}
