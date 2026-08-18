import type { Command } from "commander";

export function registerDebugCommand(program: Command): void {
  program
    .command("debug [video]")
    .description("Start a replay or live debugging session (live mode lands in a later phase)")
    .option("--live", "Start a live debugging session instead of replaying a video")
    .action((video: string | undefined, opts: { live?: boolean }) => {
      if (opts.live) {
        console.log(
          "Live debugging (`tracelens debug --live`) is planned for a later implementation phase " +
            "(browser/terminal/Git instrumentation). Not yet implemented.",
        );
        return;
      }
      if (!video) {
        console.log("Usage: tracelens debug <video.mp4>");
        process.exitCode = 1;
        return;
      }
      console.log(
        `Replay debugging over ${video} is driven by Claude Code via the MCP tools (inspect_video, get_timeline, ` +
          "get_frame), not this CLI directly. Start the MCP server (see README) and ask Claude to debug the video, " +
          `or explore it yourself with:\n  tracelens inspect "${video}"\n  tracelens timeline "${video}"`,
      );
    });
}
