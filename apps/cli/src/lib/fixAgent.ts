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

export interface FixSessionIO {
  /** Returns the next line of user input, or null when the user wants to end the session (Ctrl+C/"exit"). */
  nextUserInput: () => Promise<string | null>;
  /** Prints a line of agent output (assistant text, tool-call notices). */
  print: (line: string) => void;
  /** Asks for explicit, per-call confirmation before a mutating/shell tool call. Must not be skipped or cached across calls. */
  confirmToolUse: (description: string) => Promise<boolean>;
}

export interface FixSessionOptions extends FixSessionIO {
  initialPrompt: string;
  cwd: string;
  mcpServerCommand: { command: string; args: string[] };
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

/**
 * Computed from the actual tool-call transcript, never from the model's own
 * closing statement -- "never claim a fix succeeded without verification".
 */
export function computeStatusBanner(transcript: ToolCallRecord[]): string {
  const lines: string[] = [];

  const patchCall = transcript.find((t) => ["Edit", "Write", "MultiEdit"].includes(t.toolName) && t.approved);
  lines.push(patchCall ? `✓ Patch applied (${describeToolCall(patchCall.toolName, patchCall.input)})` : "– No patch was applied");

  const testCall = transcript.find((t) => t.toolName === "Bash" && t.approved && isTestCommand(String(t.input.command ?? "")));
  if (testCall) {
    const outcome = classifyBashOutcome(testCall.result);
    lines.push(
      outcome === "passed"
        ? "✓ Tests passed"
        : outcome === "failed"
          ? "✗ Tests failed"
          : "? Tests ran, but the outcome wasn't clear from their output",
    );
  } else {
    lines.push("– No test run was observed");
  }

  const compareCall = transcript.find((t) => t.toolName === "mcp__sutriva__compare_sessions" && t.approved);
  const comparison = compareCall ? (extractMcpJsonPayload(compareCall.result) as
    | { resolvedConsoleErrors?: unknown[]; resolvedEndpoints?: unknown[] }
    | undefined) : undefined;
  const resolvedSomething = Boolean(
    comparison && ((comparison.resolvedConsoleErrors?.length ?? 0) > 0 || (comparison.resolvedEndpoints?.length ?? 0) > 0),
  );

  if (resolvedSomething) {
    lines.push("VERIFIED -- compare_sessions shows the original issue is gone.");
  } else if (compareCall) {
    lines.push("NOT VERIFIED -- compare_sessions ran but did not show the original issue resolved.");
  } else {
    lines.push("NOT VERIFIED -- reproduce the bug again in a fresh session, then call compare_sessions, to confirm.");
  }

  return lines.join("\n");
}

function toUserMessage(text: string): SDKUserMessage {
  return { type: "user", message: { role: "user", content: text }, parent_tool_use_id: null };
}

async function* buildPromptStream(
  initialPrompt: string,
  nextUserInput: () => Promise<string | null>,
): AsyncGenerator<SDKUserMessage> {
  yield toUserMessage(initialPrompt);
  while (true) {
    const line = await nextUserInput();
    if (line === null) return;
    if (line.trim().length === 0) continue;
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
  });

  const promptStream = buildPromptStream(options.initialPrompt, options.nextUserInput);

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
            options.print(block.text);
          } else if (block.type === "tool_use") {
            options.print(`→ ${block.name}(${summarizeInput(block.input)})`);
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
            }
          }
        }
      }
    }
  }

  return { transcript, banner: computeStatusBanner(transcript) };
}
