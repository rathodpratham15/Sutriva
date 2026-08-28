import type { TemporalEvent } from "@sutriva/core";

/**
 * Lightweight, bounded evidence correlation (TraceLens_Master_Plan.md §24):
 * links a new event to a plausible preceding "cause" purely by type sequence
 * and time proximity -- e.g. click -> request -> failed response -> console
 * error. This is deliberately *not* a claim of causality: it only populates
 * `relatedEventIds` so Claude can look up what happened immediately before,
 * and reason about observed/likely/possible using its own judgment (§23/§27)
 * -- Sutriva itself never asserts "X caused Y".
 */
export interface CorrelationOptions {
  /** Max seconds between an interaction and a network event it might have triggered. */
  networkAfterInteractionSeconds?: number;
  /** Max seconds between a network event and a console error it might explain. */
  consoleAfterNetworkSeconds?: number;
}

const DEFAULT_NETWORK_AFTER_INTERACTION_SECONDS = 3;
const DEFAULT_CONSOLE_AFTER_NETWORK_SECONDS = 3;

function mostRecentWithin(
  candidates: TemporalEvent[],
  type: TemporalEvent["type"],
  atOrBefore: number,
  windowSeconds: number,
): TemporalEvent | undefined {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]!;
    if (candidate.type !== type) continue;
    const delta = atOrBefore - candidate.timestamp.start;
    if (delta < 0) continue; // candidate is not actually before the new event
    if (delta <= windowSeconds) return candidate;
    return undefined; // recentEvents is time-ordered, so nothing earlier will be closer
  }
  return undefined;
}

/**
 * Returns the IDs of plausible preceding "cause" events for `newEvent`, given
 * `recentEvents` in chronological order (oldest first). Never includes
 * `newEvent` itself. Returns an empty array when nothing matches -- most
 * events (most frames, most console.log lines) have no correlated cause.
 */
export function findRelatedEventIds(
  newEvent: Pick<TemporalEvent, "type" | "timestamp" | "description">,
  recentEvents: TemporalEvent[],
  options: CorrelationOptions = {},
): string[] {
  const networkWindow = options.networkAfterInteractionSeconds ?? DEFAULT_NETWORK_AFTER_INTERACTION_SECONDS;
  const consoleWindow = options.consoleAfterNetworkSeconds ?? DEFAULT_CONSOLE_AFTER_NETWORK_SECONDS;
  const related: string[] = [];

  if (newEvent.type === "network") {
    const cause = mostRecentWithin(recentEvents, "interaction", newEvent.timestamp.start, networkWindow);
    if (cause) related.push(cause.id);
  }

  if (newEvent.type === "console" && /error|exception/i.test(newEvent.description)) {
    const cause = mostRecentWithin(recentEvents, "network", newEvent.timestamp.start, consoleWindow);
    if (cause) related.push(cause.id);
  }

  return related;
}
