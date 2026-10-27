import pc from "picocolors";
import type { TemporalEvent } from "@sutriva/core";
import { isConsoleError, isNetworkFailure } from "@sutriva/timeline";

/**
 * One shared event-type -> color mapping, so plain CLI output (timeline,
 * search, session report) and the live TUI (src/tui) agree on what color
 * means what instead of drifting into two independent palettes. Ink's <Text
 * color="..."> accepts these same names directly; `colorizeEvent` below is
 * the picocolors equivalent for plain stdout.
 */
export type EventColorName = "red" | "cyan" | "magenta" | "blue" | "green" | "yellow" | "gray";

export function eventColorName(event: Pick<TemporalEvent, "type" | "description">): EventColorName {
  if (
    (event.type === "console" && isConsoleError(event as TemporalEvent)) ||
    (event.type === "network" && isNetworkFailure(event as TemporalEvent))
  ) {
    return "red";
  }
  switch (event.type) {
    case "visual":
      return "magenta";
    case "network":
      return "cyan";
    case "interaction":
    case "dom":
      return "blue";
    case "terminal":
      return "green";
    case "audio":
      return "yellow";
    case "git":
    case "system":
    case "console":
    default:
      return "gray";
  }
}

const colorFns: Record<EventColorName, (text: string) => string> = {
  red: pc.red,
  cyan: pc.cyan,
  magenta: pc.magenta,
  blue: pc.blue,
  green: pc.green,
  yellow: pc.yellow,
  gray: pc.gray,
};

export function colorizeEvent(event: Pick<TemporalEvent, "type" | "description">, text: string): string {
  return colorFns[eventColorName(event)](text);
}

export { pc };
