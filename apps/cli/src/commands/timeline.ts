import type { Command } from "commander";
import { getTimeline } from "@sutriva/timeline";
import { resolveVideoSession } from "../lib/resolve.js";
import { colorizeEvent, pc } from "../lib/colors.js";

export function registerTimelineCommand(program: Command): void {
  program
    .command("timeline <video>")
    .description("Print the temporal event timeline for a video")
    .option("--limit <n>", "Max events to print", (v) => Number(v), 100)
    .option("--json", "Output raw JSON")
    .action(async (video: string, opts: { limit: number; json?: boolean }) => {
      const { session } = await resolveVideoSession(video);
      const events = getTimeline(session.id, { limit: opts.limit });
      if (opts.json) {
        console.log(JSON.stringify(events, null, 2));
        return;
      }
      console.log(pc.bold(`Session ${session.id} -- ${events.length} event(s)`) + "\n");
      for (const event of events) {
        const line = `${event.timestamp.start.toFixed(2).padStart(8)}s  [${event.type}]  ${event.description}`;
        console.log(colorizeEvent(event, line));
      }
    });
}
