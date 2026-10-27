import { describe, it, expect, vi } from "vitest";
import { makeCanUseTool, computeStatusBanner, describeToolCall, type ToolCallRecord } from "../../apps/cli/src/lib/fixAgent.js";

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
