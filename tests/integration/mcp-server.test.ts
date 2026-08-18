import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const serverEntry = path.join(repoRoot, "apps/mcp-server/src/index.ts");
const sampleVideo = path.join(repoRoot, "fixtures/videos/sample.mp4");

describe("TraceLens MCP server (end-to-end)", () => {
  let client: Client;
  let transport: StdioClientTransport;
  let dataDir: string;

  beforeAll(async () => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-mcp-test-"));
    transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", serverEntry],
      cwd: repoRoot,
      env: {
        ...(process.env as Record<string, string>),
        TRACELENS_DATA_DIR: dataDir,
        TRACELENS_VISION_PROVIDER: "mock",
      },
      stderr: "pipe",
    });
    client = new Client({ name: "tracelens-test-client", version: "0.1.0" });
    await client.connect(transport);
  }, 30_000);

  afterAll(async () => {
    await client?.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("lists the Phase 0 tool surface", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(["get_frame", "get_timeline", "inspect_video"]);
  });

  let sessionId: string;

  it("inspect_video builds a session and timeline", async () => {
    const result = await client.callTool({
      name: "inspect_video",
      arguments: { path: sampleVideo },
    });
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text?: string }[];
    const payload = JSON.parse(content[0]!.text!);
    expect(payload.eventCount).toBeGreaterThan(0);
    expect(payload.metadata.durationSeconds).toBeCloseTo(12, 0);
    sessionId = payload.sessionId;
  }, 30_000);

  it("get_timeline returns bounded, timestamped events", async () => {
    const result = await client.callTool({
      name: "get_timeline",
      arguments: { sessionId },
    });
    const content = result.content as { type: string; text?: string }[];
    const payload = JSON.parse(content[0]!.text!);
    expect(payload.events.length).toBeGreaterThan(0);
    expect(payload.events[0]).toHaveProperty("start");
    expect(payload.events[0]).toHaveProperty("description");
  });

  it("get_frame returns a viewable image for a targeted timestamp", async () => {
    const result = await client.callTool({
      name: "get_frame",
      arguments: { sessionId, timestamp: 6 },
    });
    const content = result.content as { type: string; data?: string; mimeType?: string }[];
    const image = content.find((c) => c.type === "image");
    expect(image).toBeDefined();
    expect(image!.mimeType).toBe("image/png");
    expect(image!.data!.length).toBeGreaterThan(100);
  }, 15_000);

  it("get_timeline rejects an unknown session with an actionable error", async () => {
    const result = await client.callTool({
      name: "get_timeline",
      arguments: { sessionId: "session_does_not_exist" },
    });
    expect(result.isError).toBe(true);
  });
});
