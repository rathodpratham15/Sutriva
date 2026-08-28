#!/usr/bin/env node
import { Command } from "commander";
import { assertSupportedNodeVersion } from "@sutriva/core";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerTimelineCommand } from "./commands/timeline.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerAnalyzeCommand } from "./commands/analyze.js";
import { registerCleanCommand } from "./commands/clean.js";
import { registerSessionCommand } from "./commands/session.js";
import { registerDebugCommand } from "./commands/debug.js";
import { registerExecCommand } from "./commands/exec.js";
import { registerEvalCommand } from "./commands/eval.js";

const program = new Command();
program.name("sutriva").description("Sutriva gives coding agents temporal memory").version("0.1.0");

registerDoctorCommand(program);
registerInspectCommand(program);
registerTimelineCommand(program);
registerSearchCommand(program);
registerAnalyzeCommand(program);
registerSessionCommand(program);
registerDebugCommand(program);
registerExecCommand(program);
registerEvalCommand(program);
registerCleanCommand(program);

// `doctor` and `--help`/`--version` must keep working on an unsupported Node
// so a user hitting the version problem can actually diagnose it -- every
// other command touches storage (better-sqlite3), which segfaults on Node < 22.
const args = process.argv.slice(2);
const bypassesVersionCheck = args.length === 0 || ["doctor", "help", "-h", "--help", "-V", "--version"].includes(args[0]!);
if (!bypassesVersionCheck) {
  try {
    assertSupportedNodeVersion();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
