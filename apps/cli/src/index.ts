#!/usr/bin/env node
import { Command } from "commander";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInspectCommand } from "./commands/inspect.js";
import { registerTimelineCommand } from "./commands/timeline.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerAnalyzeCommand } from "./commands/analyze.js";
import { registerCleanCommand } from "./commands/clean.js";
import { registerSessionCommand } from "./commands/session.js";
import { registerDebugCommand } from "./commands/debug.js";
import { registerEvalCommand } from "./commands/eval.js";

const program = new Command();
program.name("tracelens").description("Temporal context and debugging system for Claude Code").version("0.1.0");

registerDoctorCommand(program);
registerInspectCommand(program);
registerTimelineCommand(program);
registerSearchCommand(program);
registerAnalyzeCommand(program);
registerSessionCommand(program);
registerDebugCommand(program);
registerEvalCommand(program);
registerCleanCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
