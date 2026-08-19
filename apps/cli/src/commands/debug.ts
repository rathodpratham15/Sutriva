import type { Command } from "commander";
import { startLiveSession } from "@tracelens/live";

export function registerDebugCommand(program: Command): void {
  program
    .command("debug [video]")
    .description("Start a replay or live debugging session")
    .option("--live", "Start a live browser debugging session instead of replaying a video")
    .option("--url <url>", "Initial URL to open (live mode only)")
    .option("--headless", "Run without a visible browser window (live mode only -- for automation/testing)")
    .action(async (video: string | undefined, opts: { live?: boolean; url?: string; headless?: boolean }) => {
      if (opts.live) {
        await runLiveSession(opts);
        return;
      }
      if (!video) {
        console.log("Usage: tracelens debug <video.mp4>  |  tracelens debug --live");
        process.exitCode = 1;
        return;
      }
      console.log(
        `Replay debugging over ${video} is driven by Claude Code via the MCP tools (inspect_video, get_timeline, ` +
          "get_frame) or the /debug-video slash command. Start the MCP server (see README) and ask Claude to debug " +
          `the video, or explore it yourself with:\n  tracelens inspect "${video}"\n  tracelens timeline "${video}"`,
      );
    });
}

async function runLiveSession(opts: { url?: string; headless?: boolean }): Promise<void> {
  const handle = await startLiveSession({
    url: opts.url,
    headless: opts.headless ?? false,
    onLog: (line) => console.log(line),
  });

  console.log(`Live session started: ${handle.sessionId}`);
  console.log(
    "Follow along in Claude Code -- ask it to call get_current_context or get_timeline with this sessionId, " +
      'or just say "look at this" / "what just happened?" once the TraceLens MCP server is connected.',
  );
  console.log("Press Ctrl+C to stop.\n");

  // A real terminal Ctrl+C delivers SIGINT to the whole foreground process
  // group, which includes the browser subprocess Playwright launched -- so
  // the browser can die out from under us mid-shutdown. Guard against that
  // leaving the CLI hanging (or an unhandled rejection silently killing the
  // process before it can print anything) with both a global safety net and
  // a hard timeout around stop() itself.
  process.on("unhandledRejection", (reason) => {
    console.error("Unexpected error while the live session was running:", reason);
  });

  // Resolve (rather than process.exit()) so Node exits naturally once this
  // promise settles -- process.exit() can truncate pending async stdout
  // writes (e.g. when stdout is a pipe/file, not a TTY), silently dropping
  // the final summary line.
  await new Promise<void>((resolve) => {
    let stopping = false;
    const shutdown = () => {
      if (stopping) return;
      stopping = true;
      process.off("SIGINT", shutdown);
      process.off("SIGTERM", shutdown);
      console.log("\nStopping live session...");

      const stopped = handle.stop().then(
        (summary) =>
          `Session ${handle.sessionId} ended -- ${summary.eventCount} event(s) over ${summary.durationSeconds.toFixed(1)}s.`,
        (err) => `Error while stopping live session (data up to now is still saved): ${(err as Error).message ?? err}`,
      );
      const timedOut = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 5000));

      Promise.race([stopped, timedOut]).then((result) => {
        if (result === "timeout") {
          // stop() itself is still hanging (e.g. the browser subprocess died
          // out from under Playwright mid-close) -- the underlying pending
          // operation may keep the event loop alive forever, so force exit
          // once the message has had a moment to flush.
          console.log(`Session ${handle.sessionId}: stop() did not finish within 5s -- exiting anyway.`);
          setTimeout(() => process.exit(1), 50);
        } else {
          console.log(result);
          resolve();
        }
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });
}
