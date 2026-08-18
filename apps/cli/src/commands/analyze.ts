import type { Command } from "commander";
import { createVisionProvider } from "@tracelens/providers";
import { analyzeSegment } from "@tracelens/timeline";
import { resolveVideoSession } from "../lib/resolve.js";

export function registerAnalyzeCommand(program: Command): void {
  program
    .command("analyze <video>")
    .description("Run targeted, dense analysis over a specific time range")
    .requiredOption("--start <seconds>", "Segment start (seconds)", (v) => Number(v))
    .requiredOption("--end <seconds>", "Segment end (seconds)", (v) => Number(v))
    .option("--question <text>", "Specific question to ask about this segment")
    .action(async (video: string, opts: { start: number; end: number; question?: string }) => {
      const { session } = await resolveVideoSession(video);
      const visionProvider = createVisionProvider();
      const result = await analyzeSegment(session.id, opts.start, opts.end, visionProvider, opts.question);
      console.log(`Segment ${opts.start}s-${opts.end}s (${result.sampledTimestamps.length} frame(s) sampled)\n`);
      console.log(result.summary);
      console.log(`\nConfidence: ${result.confidence}`);
    });
}
