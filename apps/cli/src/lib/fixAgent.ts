import {
  query,
  type CanUseTool,
  type PermissionResult,
  type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";

/**
 * The in-process core of `sutriva fix`: an interactive, multi-turn debugging
 * conversation built on @anthropic-ai/claude-agent-sdk's query(), instead of
 * spawning a separate `claude -p` subprocess per message. All I/O is
 * injected (nextUserInput/print/confirmToolUse) so this is testable without
 * a real terminal or a real model call for the parts that don't need one.
 *
 * Shapes below were confirmed against the installed
 * @anthropic-ai/claude-agent-sdk@0.3.311 type definitions directly (not
 * assumed from docs): query()'s `prompt` accepts an AsyncIterable<SDKUserMessage>
 * for multi-turn streaming input; canUseTool's `options.toolUseID` (capital
 * ID) is the SDK's own field name; `permissionMode: "default"` is what keeps
 * every non-explicitly-allowed tool call routed through canUseTool rather
 * than silently approved.
 */

export interface ToolCallRecord {
  toolUseId: string;
  toolName: string;
  input: Record<string, unknown>;
  approved: boolean;
  /** The tool's actual result, attached once the matching tool_result arrives. Shape is per-tool and not fully typed by the SDK (`tool_use_result?: unknown`). */
  result?: unknown;
}

export type PrintKind = "text" | "tool-use";

export interface FixSessionIO {
  /** Returns the next line of user input, or null when the user wants to end the session (Ctrl+C/"exit"). */
  nextUserInput: () => Promise<string | null>;
  /** Prints a line of agent output, tagged so a caller can style assistant prose differently from a tool-call notice (e.g. color it, or route it to a different UI region). */
  print: (line: string, kind: PrintKind) => void;
  /** Asks for explicit, per-call confirmation before a mutating/shell tool call. Must not be skipped or cached across calls. */
  confirmToolUse: (description: string) => Promise<boolean>;
}

export interface FixSessionOptions extends FixSessionIO {
  initialPrompt: string;
  cwd: string;
  mcpServerCommand: { command: string; args: string[] };
  /** Called with the full transcript every time it changes -- for a live status display (e.g. the TUI footer) that can't wait for the session to end. */
  onTranscriptChange?: (transcript: ToolCallRecord[]) => void;
}

export interface FixSessionResult {
  transcript: ToolCallRecord[];
  banner: string;
}

// Sutriva's own MCP tools are read-only queries over already-captured
// evidence (get_timeline, get_evidence, compare_sessions, ...) -- safe to
// auto-allow. Read/Grep/Glob are Claude Code's built-in read-only tools.
const READ_ONLY_BUILTIN_TOOLS = new Set(["Read", "Grep", "Glob"]);
const MUTATING_TOOLS = new Set(["Edit", "Write", "MultiEdit", "NotebookEdit", "Bash"]);

function isSutrivaMcpTool(toolName: string): boolean {
  return toolName.startsWith("mcp__sutriva__");
}

export function describeToolCall(toolName: string, input: Record<string, unknown>): string {
  if (toolName === "Bash") return `Run shell command: ${String(input.command ?? "")}`;
  if (toolName === "Edit" || toolName === "Write" || toolName === "MultiEdit") {
    return `${toolName} ${String(input.file_path ?? input.path ?? "(unknown path)")}`;
  }
  return `${toolName}(${JSON.stringify(input)})`;
}

/**
 * The actual safety mechanism. Every mutating or shell tool call is gated
 * behind an explicit confirmation, every single time -- no allowlist, no
 * "approve once for the rest of the session", and an unrecognized tool name
 * fails closed (treated the same as a mutating tool) rather than defaulting
 * to allow.
 */
export function makeCanUseTool(
  confirmToolUse: (description: string) => Promise<boolean>,
  onDecision: (record: ToolCallRecord) => void,
): CanUseTool {
  return async (toolName, input, options): Promise<PermissionResult> => {
    const toolUseId = options.toolUseID;

    if (isSutrivaMcpTool(toolName) || READ_ONLY_BUILTIN_TOOLS.has(toolName)) {
      onDecision({ toolUseId, toolName, input, approved: true });
      return { behavior: "allow" };
    }

    const approved = await confirmToolUse(describeToolCall(toolName, input));
    onDecision({ toolUseId, toolName, input, approved });
    return approved ? { behavior: "allow" } : { behavior: "deny", message: "User declined this action." };
  };
}

function isTestCommand(command: string): boolean {
  return /\b(vitest|jest|npm\s+(run\s+)?test|pnpm\s+test|yarn\s+test)\b/i.test(command);
}

/**
 * BashOutput (confirmed from the SDK's installed types) has no exit-code
 * field, only stdout/stderr/interrupted -- so "did the tests pass" is
 * necessarily a text heuristic here, same spirit as classify.ts's own
 * isConsoleError/isNetworkFailure regexes elsewhere in this codebase. An
 * inconclusive read is reported as such rather than defaulting to "passed".
 */
function classifyBashOutcome(result: unknown): "passed" | "failed" | "unclear" {
  if (!result || typeof result !== "object") return "unclear";
  const { stdout, stderr, interrupted } = result as { stdout?: unknown; stderr?: unknown; interrupted?: unknown };
  if (interrupted === true) return "unclear";
  const combined = `${typeof stdout === "string" ? stdout : ""}\n${typeof stderr === "string" ? stderr : ""}`;
  if (/\b(fail(ed|ure)?|error)\b/i.test(combined) && !/\b0\s+fail(ed|ure)?s?\b/i.test(combined)) return "failed";
  if (/\bpass(ed)?\b/i.test(combined)) return "passed";
  return "unclear";
}

/**
 * MCP tool results are wrapped by apps/mcp-server/src/tools.ts's textResult()
 * as { content: [{ type: "text", text: JSON.stringify(payload) }] } -- unwrap
 * that shape defensively (never throw; an unrecognized shape just yields
 * undefined, which computeStatusBanner treats as "not verified").
 */
function extractMcpJsonPayload(result: unknown): unknown {
  if (!result || typeof result !== "object") return undefined;
  const content = (result as { content?: unknown }).content;
  if (!Array.isArray(content)) return undefined;
  const textBlock = content.find((b): b is { type: string; text: string } => typeof b === "object" && b !== null && (b as { type?: unknown }).type === "text");
  if (!textBlock || typeof textBlock.text !== "string") return undefined;
  try {
    return JSON.parse(textBlock.text);
  } catch {
    return undefined;
  }
}

export type TestOutcome = "none" | "passed" | "failed" | "unclear";
export type VerificationOutcome = "unverified" | "verified" | "ran-not-resolved";

export interface LiveFixStatus {
  patchApplied: boolean;
  patchDescription?: string;
  testOutcome: TestOutcome;
  verification: VerificationOutcome;
}

/**
 * Structured read of "what's actually happened so far", computed from the
 * real tool-call transcript -- never from the model's own closing statement
 * ("never claim a fix succeeded without verification"). Shared by the plain
 * closing banner (computeStatusBanner) and the TUI's live-updating footer,
 * so both read the same ground truth.
 */
export function computeLiveStatus(transcript: ToolCallRecord[]): LiveFixStatus {
  const patchCall = transcript.find((t) => ["Edit", "Write", "MultiEdit"].includes(t.toolName) && t.approved);

  const testCall = transcript.find((t) => t.toolName === "Bash" && t.approved && isTestCommand(String(t.input.command ?? "")));
  const testOutcome: TestOutcome = testCall ? classifyBashOutcome(testCall.result) : "none";

  const compareCall = transcript.find((t) => t.toolName === "mcp__sutriva__compare_sessions" && t.approved);
  const comparison = compareCall
    ? (extractMcpJsonPayload(compareCall.result) as { resolvedConsoleErrors?: unknown[]; resolvedEndpoints?: unknown[] } | undefined)
    : undefined;
  const resolvedSomething = Boolean(
    comparison && ((comparison.resolvedConsoleErrors?.length ?? 0) > 0 || (comparison.resolvedEndpoints?.length ?? 0) > 0),
  );

  return {
    patchApplied: Boolean(patchCall),
    patchDescription: patchCall ? describeToolCall(patchCall.toolName, patchCall.input) : undefined,
    testOutcome,
    verification: resolvedSomething ? "verified" : compareCall ? "ran-not-resolved" : "unverified",
  };
}

export function computeStatusBanner(transcript: ToolCallRecord[]): string {
  const status = computeLiveStatus(transcript);
  const lines: string[] = [];

  lines.push(status.patchApplied ? `✓ Patch applied (${status.patchDescription})` : "– No patch was applied");

  lines.push(
    status.testOutcome === "passed"
      ? "✓ Tests passed"
      : status.testOutcome === "failed"
        ? "✗ Tests failed"
        : status.testOutcome === "unclear"
          ? "? Tests ran, but the outcome wasn't clear from their output"
          : "– No test run was observed",
  );

  lines.push(
    status.verification === "verified"
      ? "VERIFIED -- compare_sessions shows the original issue is gone."
      : status.verification === "ran-not-resolved"
        ? "NOT VERIFIED -- compare_sessions ran but did not show the original issue resolved."
        : "NOT VERIFIED -- reproduce the bug again in a fresh session, then call compare_sessions, to confirm.",
  );

  return lines.join("\n");
}

/**
 * A single assistant turn can issue more than one tool call at once (e.g.
 * two Bash commands side by side), and the SDK invokes canUseTool for each
 * concurrently. Without this, two concurrent confirmToolUse calls sharing
 * one terminal would race the same way nextUserInput used to against a
 * confirmation (see createTurnGate's doc comment) -- whichever call reads
 * the terminal second silently wins the next typed line, leaving the first
 * confirmation hanging forever. Wrapping confirmToolUse in this forces every
 * call through in FIFO order, one at a time.
 */
export function serializeConfirmToolUse(
  confirmToolUse: (description: string) => Promise<boolean>,
): (description: string) => Promise<boolean> {
  let queue: Promise<void> = Promise.resolve();
  return (description: string): Promise<boolean> => {
    const result = queue.then(() => confirmToolUse(description));
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}

function toUserMessage(text: string): SDKUserMessage {
  return { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null };
}

/**
 * The SDK pulls the prompt generator eagerly -- it does NOT wait for a turn
 * to fully finish (all its tool calls resolved) before asking the generator
 * for the *next* one. Left ungated, that means nextUserInput() (which reads
 * a line from the terminal) gets called while a mid-turn canUseTool
 * confirmation is also trying to read a line from the same terminal, and
 * whichever typed line arrives goes to whichever of the two is currently
 * registered with readline -- not necessarily the one actually pending.
 * This gate makes the generator suspend (without touching readline at all)
 * until the orchestrator has observed the current turn's `result` message,
 * so a mid-turn confirmation always has the terminal to itself.
 */
export interface TurnGate {
  startTurn: () => void;
  endTurn: () => void;
  waitUntilReady: () => Promise<void>;
}

export function createTurnGate(): TurnGate {
  let resolveCurrent: (() => void) | null = null;
  let ready: Promise<void> = Promise.resolve();

  return {
    startTurn() {
      ready = new Promise((resolve) => {
        resolveCurrent = resolve;
      });
    },
    endTurn() {
      resolveCurrent?.();
      resolveCurrent = null;
    },
    waitUntilReady() {
      return ready;
    },
  };
}

export async function* buildPromptStream(
  initialPrompt: string,
  nextUserInput: () => Promise<string | null>,
  gate: TurnGate,
): AsyncGenerator<SDKUserMessage> {
  gate.startTurn();
  yield toUserMessage(initialPrompt);
  while (true) {
    await gate.waitUntilReady();
    const line = await nextUserInput();
    if (line === null) return;
    if (line.trim().length === 0) continue;
    gate.startTurn();
    yield toUserMessage(line);
  }
}

function summarizeInput(input: unknown): string {
  const json = JSON.stringify(input);
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

export async function runFixSession(options: FixSessionOptions): Promise<FixSessionResult> {
  const transcript: ToolCallRecord[] = [];
  const transcriptIndexByToolUseId = new Map<string, number>();

  const canUseTool = makeCanUseTool(options.confirmToolUse, (record) => {
    transcriptIndexByToolUseId.set(record.toolUseId, transcript.length);
    transcript.push(record);
    options.onTranscriptChange?.(transcript);
  });

  const gate = createTurnGate();
  const promptStream = buildPromptStream(options.initialPrompt, options.nextUserInput, gate);

  const conversation = query({
    prompt: promptStream,
    options: {
      cwd: options.cwd,
      permissionMode: "default",
      canUseTool,
      mcpServers: { sutriva: { type: "stdio", ...options.mcpServerCommand } },
    },
  });

  for await (const message of conversation) {
    if (message.type === "assistant") {
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && block.text.trim()) {
            options.print(block.text, "text");
          } else if (block.type === "tool_use") {
            options.print(`→ ${block.name}(${summarizeInput(block.input)})`, "tool-use");
          }
        }
      }
    } else if (message.type === "user" && message.tool_use_result !== undefined) {
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (
            typeof block === "object" &&
            block !== null &&
            (block as { type?: unknown }).type === "tool_result" &&
            typeof (block as { tool_use_id?: unknown }).tool_use_id === "string"
          ) {
            const toolUseId = (block as { tool_use_id: string }).tool_use_id;
            const idx = transcriptIndexByToolUseId.get(toolUseId);
            const existing = idx !== undefined ? transcript[idx] : undefined;
            if (idx !== undefined && existing) {
              transcript[idx] = { ...existing, result: message.tool_use_result };
              options.onTranscriptChange?.(transcript);
            }
          }
        }
      }
    } else if (message.type === "result") {
      // Marks the current turn as fully settled -- only now is it safe to
      // let the prompt generator ask for the next line (see createTurnGate).
      gate.endTurn();
    }
  }

  return { transcript, banner: computeStatusBanner(transcript) };
}
