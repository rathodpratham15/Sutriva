#!/usr/bin/env node
/**
 * Thin executable entry point -- kept separate from harness.ts so that
 * importing the harness for testing (tests/eval/run-eval.test.ts) never
 * triggers main() as a side effect of the import itself. Deliberately not
 * using an `import.meta.url === process.argv[1]` "am I the entry point"
 * check: that comparison is fragile across how tsx gets invoked (works when
 * run via a package script, silently never matches when spawned directly as
 * a child process), so it's simpler and more robust to just not need it.
 */
import { main } from "./harness.js";

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
