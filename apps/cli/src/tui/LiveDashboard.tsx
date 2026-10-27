import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useInput, useStdin } from "ink";
import type { TemporalEvent } from "@sutriva/core";
import { isConsoleError, isNetworkFailure } from "@sutriva/timeline";
import { eventColorName } from "../lib/colors.js";

export interface LiveDashboardProps {
  sessionId: string;
  url?: string;
  branch?: string;
  /** Registers a listener for every captured event; returns an unsubscribe function. */
  subscribe: (listener: (event: TemporalEvent) => void) => () => void;
  onExitRequested: () => void;
}

const MAX_VISIBLE_EVENTS = 18;

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Full-screen live dashboard for `sutriva debug --live --tui`: a streaming,
 * color-coded event feed (same type -> color mapping as the plain-text CLI
 * commands, via lib/colors.ts) plus running counts and the session's Git
 * state, instead of a flat scrolling console.log feed.
 */
export const LiveDashboard: React.FC<LiveDashboardProps> = ({ sessionId, url, branch, subscribe, onExitRequested }) => {
  const [events, setEvents] = useState<TemporalEvent[]>([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [consoleErrorCount, setConsoleErrorCount] = useState(0);
  const [networkFailureCount, setNetworkFailureCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      setEvents((prev) => [...prev.slice(-(MAX_VISIBLE_EVENTS - 1)), event]);
      setTotalEventCount((n) => n + 1);
      if (isConsoleError(event)) setConsoleErrorCount((n) => n + 1);
      if (isNetworkFailure(event)) setNetworkFailureCount((n) => n + 1);
    });
    const tick = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 1000);
    return () => {
      unsubscribe();
      clearInterval(tick);
    };
  }, [subscribe]);

  // Ink puts stdin in raw mode, which stops the terminal from turning Ctrl+C
  // into a real SIGINT -- it just arrives here as a keypress instead, so it
  // has to be handled explicitly rather than relying on a process signal.
  // Raw mode isn't available on every stdin (e.g. a non-TTY/piped process,
  // as in CI or a non-interactive invocation) -- useInput throws there if
  // left unconditionally active, so it's gated on isRawModeSupported.
  // Ctrl+C still works in that case: without raw mode the terminal delivers
  // a real SIGINT, which the caller's own process.on("SIGINT", ...) catches.
  const { isRawModeSupported } = useStdin();
  useInput(
    (input, key) => {
      if (input === "q" || (key.ctrl && input === "c")) onExitRequested();
    },
    { isActive: isRawModeSupported },
  );

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="green">
          Sutriva -- live session
        </Text>
        <Text dimColor>{formatElapsed(elapsed)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>session: {sessionId}</Text>
        {url ? <Text dimColor>url: {url}</Text> : null}
        {branch ? <Text dimColor>branch: {branch}</Text> : null}
      </Box>

      <Box marginBottom={1}>
        <Text>
          events: <Text bold>{totalEventCount}</Text>{"   "}
          console errors:{" "}
          <Text bold color={consoleErrorCount > 0 ? "red" : undefined}>
            {consoleErrorCount}
          </Text>{"   "}
          network failures:{" "}
          <Text bold color={networkFailureCount > 0 ? "red" : undefined}>
            {networkFailureCount}
          </Text>
        </Text>
      </Box>

      <Box flexDirection="column">
        {events.length === 0 ? <Text dimColor>Waiting for activity -- interact with the browser window...</Text> : null}
        {events.map((event) => (
          <Text key={event.id} color={eventColorName(event)}>
            {event.timestamp.start.toFixed(2).padStart(8)}s [{event.type}] {event.description.slice(0, 100)}
          </Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press q or Ctrl+C to stop.</Text>
      </Box>
    </Box>
  );
};
