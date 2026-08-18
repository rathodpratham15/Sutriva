import type { Command } from "commander";
import { createVisionProvider } from "@tracelens/providers";
import { inspectVideo } from "@tracelens/timeline";

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect <video>")
    .description("Ingest a video: extract metadata, sample frames, build a timeline")
    .option("--focus <text>", "Hint for the vision provider, e.g. \"look for errors\"")
    .option("--max-frames <n>", "Max sampled frames", (v) => Number(v))
    .option("--interval <seconds>", "Target seconds between samples", (v) => Number(v))
    .action(async (video: string, opts: { focus?: string; maxFrames?: number; interval?: number }) => {
      const visionProvider = createVisionProvider();
      const result = await inspectVideo(video, {
        visionProvider,
        focus: opts.focus,
        maxFrames: opts.maxFrames,
        intervalSeconds: opts.interval,
      });
      console.log(`Session:   ${result.session.id}${result.reused ? " (reused)" : ""}`);
      console.log(`Provider:  ${visionProvider.name}`);
      console.log(`Duration:  ${result.metadata.durationSeconds.toFixed(2)}s`);
      console.log(`FPS:       ${result.metadata.fps.toFixed(2)}`);
      console.log(`Size:      ${result.metadata.width}x${result.metadata.height}`);
      console.log(`Audio:     ${result.metadata.hasAudio ? "yes" : "no"}`);
      console.log(`Hash:      ${result.metadata.contentHash.slice(0, 16)}...`);
      console.log(`Events:    ${result.eventCount}`);
      console.log(`\nNext: tracelens timeline "${video}"`);
    });
}
