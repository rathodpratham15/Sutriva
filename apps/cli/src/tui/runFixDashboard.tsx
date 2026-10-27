import React from "react";
import { render } from "ink";
import { FixDashboard } from "./FixDashboard.js";
import type { FixTranscriptEntry, PendingRequest, LiveFixStatus } from "./fixDashboardTypes.js";

export interface FixDashboardHandle {
  appendEntry: (entry: Omit<FixTranscriptEntry, "id">) => void;
  updateStatus: (status: LiveFixStatus) => void;
  updateElapsed: (seconds: number) => void;
  setPending: (pending: PendingRequest | null) => void;
  unmount: () => void;
}

const EMPTY_STATUS: LiveFixStatus = { patchApplied: false, testOutcome: "none", verification: "unverified" };

/**
 * Entries/status/pending are held here, outside React state, and pushed into
 * the component via Ink's own instance.rerender() on every change -- the
 * component itself only keeps local state for the text currently being
 * typed. This keeps the external I/O-driving code (fix.ts) simple: call a
 * plain function, don't thread React state through it.
 */
export function runFixDashboard(sessionId: string): FixDashboardHandle {
  let entries: FixTranscriptEntry[] = [];
  let status: LiveFixStatus = EMPTY_STATUS;
  let elapsedSeconds = 0;
  let pending: PendingRequest | null = null;
  let nextId = 0;

  const view = () => (
    <FixDashboard sessionId={sessionId} elapsedSeconds={elapsedSeconds} entries={entries} status={status} pending={pending} />
  );

  const instance = render(view());

  return {
    appendEntry(entry) {
      entries = [...entries, { ...entry, id: nextId++ }];
      instance.rerender(view());
    },
    updateStatus(next) {
      status = next;
      instance.rerender(view());
    },
    updateElapsed(seconds) {
      elapsedSeconds = seconds;
      instance.rerender(view());
    },
    setPending(next) {
      pending = next;
      instance.rerender(view());
    },
    unmount: instance.unmount,
  };
}
