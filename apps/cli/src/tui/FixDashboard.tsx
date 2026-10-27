import React, { useEffect, useState } from "react";
import { Box, Static, Text } from "ink";
import TextInput from "ink-text-input";
import type { FixTranscriptEntry, PendingRequest, LiveFixStatus } from "./fixDashboardTypes.js";

export interface FixDashboardProps {
  sessionId: string;
  elapsedSeconds: number;
  entries: FixTranscriptEntry[];
  status: LiveFixStatus;
  pending: PendingRequest | null;
}

function entryColor(kind: FixTranscriptEntry["kind"]): string | undefined {
  switch (kind) {
    case "tool-use":
      return "cyan";
    case "user":
      return "green";
    case "system":
      return "yellow";
    default:
      return undefined;
  }
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The fix REPL's full-screen dashboard: a scrolling conversation transcript
 * (rendered via Ink's <Static> -- each entry is shown exactly once and then
 * becomes permanent terminal scrollback, never re-rendered, which is what
 * makes long prose-heavy assistant messages work here unlike a from-scratch
 * redraw-every-tick dashboard) plus a persistent status footer that updates
 * live from the same tool-call transcript computeStatusBanner reads at the
 * end -- so the footer is never ahead of or inconsistent with the final
 * summary.
 */
export const FixDashboard: React.FC<FixDashboardProps> = ({ sessionId, elapsedSeconds, entries, status, pending }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [pending]);

  return (
    <Box flexDirection="column">
      <Static items={entries}>
        {(entry) => (
          <Box key={entry.id}>
            <Text color={entryColor(entry.kind)}>{entry.text}</Text>
          </Box>
        )}
      </Static>

      <Box borderStyle="round" borderColor="green" flexDirection="column" paddingX={1} marginTop={1}>
        <Box justifyContent="space-between">
          <Text bold color="green">
            Sutriva fix -- {sessionId}
          </Text>
          <Text dimColor>{formatElapsed(elapsedSeconds)}</Text>
        </Box>

        <Text>
          patch:{" "}
          <Text bold color={status.patchApplied ? "green" : undefined}>
            {status.patchApplied ? "applied" : "none yet"}
          </Text>
          {"   "}
          tests:{" "}
          <Text bold color={status.testOutcome === "passed" ? "green" : status.testOutcome === "failed" ? "red" : undefined}>
            {status.testOutcome === "none" ? "not run" : status.testOutcome}
          </Text>
          {"   "}
          verification:{" "}
          <Text bold color={status.verification === "verified" ? "green" : undefined}>
            {status.verification}
          </Text>
        </Text>

        <Box marginTop={1}>
          <Text bold>{pending ? pending.promptLabel : "sutriva fix>"} </Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              if (!pending) return;
              pending.onSubmit(submitted);
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
