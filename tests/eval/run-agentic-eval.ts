#!/usr/bin/env node
/**
 * Thin executable entry point for the agentic eval harness -- see
 * agentic-harness.ts's module doc comment for what this does and why it's
 * separate from the default `pnpm eval`. Costs real Claude API calls; not
 * run by `pnpm test` or CI.
 */
import { main } from "./agentic-harness.js";

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
