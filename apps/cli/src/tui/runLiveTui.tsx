import React from "react";
import { render } from "ink";
import type { TemporalEvent } from "@sutriva/core";
import { LiveDashboard } from "./LiveDashboard.js";

export interface RunLiveTuiOptions {
  sessionId: string;
  url?: string;
  branch?: string;
  subscribe: (listener: (event: TemporalEvent) => void) => () => void;
  onExitRequested: () => void;
}

export interface LiveTuiHandle {
  unmount: () => void;
}

/** Renders the live dashboard full-screen. Caller is responsible for stopping the live session itself when onExitRequested fires. */
export function runLiveTui(options: RunLiveTuiOptions): LiveTuiHandle {
  const instance = render(
    <LiveDashboard
      sessionId={options.sessionId}
      url={options.url}
      branch={options.branch}
      subscribe={options.subscribe}
      onExitRequested={options.onExitRequested}
    />,
  );
  return { unmount: instance.unmount };
}
