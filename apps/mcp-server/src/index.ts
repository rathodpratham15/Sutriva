#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { assertSupportedNodeVersion } from "@tracelens/core";
import { registerTools } from "./tools.js";

async function main() {
  assertSupportedNodeVersion();
  const server = new McpServer({ name: "tracelens", version: "0.1.0" });
  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TraceLens MCP server running on stdio");
}

main().catch((err) => {
  console.error("TraceLens MCP server failed to start:", err);
  process.exit(1);
});
