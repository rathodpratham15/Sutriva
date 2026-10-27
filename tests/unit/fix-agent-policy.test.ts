import { describe, it, expect, vi } from "vitest";
import {
  makeCanUseTool,
  computeStatusBanner,
  describeToolCall,
  createTurnGate,
  buildPromptStream,
  type ToolCallRecord,
} from "../../apps/cli/src/lib/fixAgent.js";

function fakeOptions(toolUseId: string) {
  return { signal: new AbortController().signal, toolUseID: toolUseId, requestId: `req-${toolUseId}` };
}

describe("makeCanUseTool", () => {
  it("auto-allows Sutriva MCP tools without asking", async () => {
    const confirmToolUse = vi.fn();
    const onDecision = vi.fn();
    const canUseTool = makeCanUseTool(confirmToolUse, onDecision);

    const result = await canUseTool("mcp__sutriva__get_timeline", { sessionId: "s1" }, fakeOptions("tu1"));

    expect(result).toEqual({ behavior: "allow" });
    expect(confirmToolUse).not.toHaveBeenCalled();
    expect(onDecision).toHaveBeenCalledWith({ toolUseId: "tu1", toolName: "mcp__sutriva__get_timeline", input: { sessionId: "s1" }, approved: true });
  });

  it("auto-allows Read/Grep/Glob without asking", async () => {
    const confirmToolUse = vi.fn();
    const canUseTool = makeCanUseTool(confirmToolUse, vi.fn());

    for (const tool of ["Read", "Grep", "Glob"]) {
      const result = await canUseTool(tool, {}, fakeOptions("tu1"));
      expect(result).toEqual({ behavior: "allow" });
    }
    expect(confirmToolUse).not.toHaveBeenCalled();
  });

  it("gates Edit/Write/MultiEdit/Bash behind explicit confirmation, every time", async () => {
    const confirmToolUse = vi.fn().mockResolvedValue(true);
    const onDecision = vi.fn();
    const canUseTool = makeCanUseTool(confirmToolUse, onDecision);

    for (const tool of ["Edit", "Write", "MultiEdit", "Bash"]) {
      const result = await canUseTool(tool, { command: "pnpm test" }, fakeOptions(`tu-${tool}`));
      expect(result).toEqual({ behavior: "allow" });
    }
    expect(confirmToolUse).toHaveBeenCalledTimes(4);
  });

  it("denies a gated call when the user declines, and never allows by default", async () => {
    const confirmToolUse = vi.fn().mockResolvedValue(false);
    const onDecision = vi.fn();
    const canUseTool = makeCanUseTool(confirmToolUse, onDecision);

    const result = await canUseTool("Bash", { command: "rm -rf /" }, fakeOptions("tu2"));

    expect(result).toEqual({ behavior: "deny", message: "User declined this action." });
    expect(onDecision).toHaveBeenCalledWith({ toolUseId: "tu2", toolName: "Bash", input: { command: "rm -rf /" }, approved: false });
  });

  it("fails closed for an unrecognized tool name -- asks rather than defaulting to allow", async () => {
    const confirmToolUse = vi.fn().mockResolvedValue(true);
    const canUseTool = makeCanUseTool(confirmToolUse, vi.fn());

    const result = await canUseTool("SomeFutureTool", {}, fakeOptions("tu3"));

    expect(confirmToolUse).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ behavior: "allow" });
  });
});

describe("describeToolCall", () => {
  it("describes Bash with the literal command", () => {
    expect(describeToolCall("Bash", { command: "pnpm vitest run" })).toBe("Run shell command: pnpm vitest run");
  });

  it("describes Edit/Write with the file path", () => {
    expect(describeToolCall("Edit", { file_path: "app/checkout/page.tsx" })).toBe("Edit app/checkout/page.tsx");
  });
});

describe("computeStatusBanner", () => {
  const textResult = (payload: unknown) => ({ content: [{ type: "text", text: JSON.stringify(payload) }] });

  it("reports nothing applied/verified for an empty transcript", () => {
    const banner = computeStatusBanner([]);
    expect(banner).toContain("No patch was applied");
    expect(banner).toContain("No test run was observed");
    expect(banner).toContain("NOT VERIFIED -- reproduce the bug again");
  });

  it("reports a full verified fix: patch applied, tests passed, compare_sessions shows resolution", () => {
    const transcript: ToolCallRecord[] = [
      { toolUseId: "t1", toolName: "Edit", input: { file_path: "app/checkout/page.tsx" }, approved: true },
      {
        toolUseId: "t2",
        toolName: "Bash",
        input: { command: "pnpm vitest run" },
        approved: true,
        result: { stdout: "Tests  3 passed (3)", stderr: "", interrupted: false },
      },
      {
        toolUseId: "t3",
        toolName: "mcp__sutriva__compare_sessions",
        input: { beforeSessionId: "before", afterSessionId: "after" },
        approved: true,
        result: textResult({ resolvedConsoleErrors: ["TypeError: ..."], resolvedEndpoints: [], newConsoleErrors: [], newOrChangedFailingEndpoints: [] }),
      },
    ];

    const banner = computeStatusBanner(transcript);
    expect(banner).toContain("✓ Patch applied");
    expect(banner).toContain("✓ Tests passed");
    expect(banner).toContain("VERIFIED -- compare_sessions shows the original issue is gone.");
  });

  it("reports tests failed when the output says so", () => {
    const transcript: ToolCallRecord[] = [
      {
        toolUseId: "t1",
        toolName: "Bash",
        input: { command: "npm test" },
        approved: true,
        result: { stdout: "", stderr: "1 failed, 0 passed", interrupted: false },
      },
    ];
    expect(computeStatusBanner(transcript)).toContain("✗ Tests failed");
  });

  it("does not count a declined Edit as a patch, and does not count an unapproved call at all", () => {
    const transcript: ToolCallRecord[] = [
      { toolUseId: "t1", toolName: "Edit", input: { file_path: "x.ts" }, approved: false },
    ];
    expect(computeStatusBanner(transcript)).toContain("No patch was applied");
  });

  it("reports NOT VERIFIED when compare_sessions ran but showed nothing resolved", () => {
    const transcript: ToolCallRecord[] = [
      {
        toolUseId: "t1",
        toolName: "mcp__sutriva__compare_sessions",
        input: {},
        approved: true,
        result: textResult({ resolvedConsoleErrors: [], resolvedEndpoints: [], newConsoleErrors: [], newOrChangedFailingEndpoints: [] }),
      },
    ];
    expect(computeStatusBanner(transcript)).toContain("NOT VERIFIED -- compare_sessions ran but did not show");
  });
});

// Regression test for a real bug found manually: the Agent SDK pulls the
// prompt generator eagerly, ahead of a turn fully finishing. Ungated, that
// meant nextUserInput() (reading a REPL line) and a mid-turn canUseTool
// confirmation (also reading a line) raced on the same readline interface,
// and a user's "n" answering a pending confirmation got silently consumed
// as a new chat message instead -- the confirmation just hung forever.
describe("createTurnGate / buildPromptStream", () => {
  it("blocks waitUntilReady until endTurn is called", async () => {
    const gate = createTurnGate();
    gate.startTurn();

    let resolved = false;
    void gate.waitUntilReady().then(() => {
      resolved = true;
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(resolved).toBe(false);

    gate.endTurn();
    await gate.waitUntilReady();
    expect(resolved).toBe(true);
  });

  it("does not call nextUserInput until the gate releases, even if the generator is pulled eagerly", async () => {
    const gate = createTurnGate();
    const nextUserInput = vi.fn().mockResolvedValue("hello");
    const stream = buildPromptStream("initial prompt", nextUserInput, gate);

    const first = await stream.next();
    expect(first.value).toMatchObject({ type: "user", message: { content: "initial prompt" } });

    // Simulate the SDK eagerly pulling ahead before the turn ends -- this
    // must suspend inside the generator rather than touching nextUserInput.
    let secondSettled = false;
    const secondPromise = stream.next().then((r) => {
      secondSettled = true;
      return r;
    });

    await new Promise((r) => setTimeout(r, 10));
    expect(secondSettled).toBe(false);
    expect(nextUserInput).not.toHaveBeenCalled();

    gate.endTurn();
    const second = await secondPromise;
    expect(secondSettled).toBe(true);
    expect(nextUserInput).toHaveBeenCalledTimes(1);
    expect(second.value).toMatchObject({ type: "user", message: { content: "hello" } });
  });

  it("ends the stream when nextUserInput resolves to null", async () => {
    const gate = createTurnGate();
    const nextUserInput = vi.fn().mockResolvedValue(null);
    const stream = buildPromptStream("initial", nextUserInput, gate);

    await stream.next();
    gate.endTurn();
    const result = await stream.next();
    expect(result.done).toBe(true);
  });
});
