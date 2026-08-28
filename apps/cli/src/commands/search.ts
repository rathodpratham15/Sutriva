import type { Command } from "commander";
import { searchSession } from "@sutriva/timeline";
import { resolveVideoSession } from "../lib/resolve.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <video> <query>")
    .description("Search a video's timeline for events matching a text query")
    .action(async (video: string, query: string) => {
      const { session } = await resolveVideoSession(video);
      const events = searchSession(session.id, query);
      if (events.length === 0) {
        console.log(`No events matching "${query}" in session ${session.id}.`);
        return;
      }
      console.log(`${events.length} match(es) for "${query}":\n`);
      for (const event of events) {
        console.log(`${event.timestamp.start.toFixed(2).padStart(8)}s  [${event.type}]  ${event.description}`);
      }
    });
}
