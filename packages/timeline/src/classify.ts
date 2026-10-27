import type { TemporalEvent } from "@sutriva/core";

/**
 * Shared event-classification heuristics -- "what counts as an error" used to
 * live as three slightly-different regexes (compareSessions, getCurrentContext,
 * and now generateSessionReport). One definition here instead.
 */

export function isConsoleError(event: TemporalEvent): boolean {
  return event.type === "console" && /error|exception/i.test(event.description);
}

export interface ParsedNetworkResponse {
  endpoint: string;
  status: number;
}

/** Parses a "METHOD url -> status" description, e.g. "POST /api/checkout -> 500". */
export function parseNetworkResponse(description: string): ParsedNetworkResponse | undefined {
  const match = description.match(/^(\S+)\s+(.+?)\s+->\s+(\d+)\b/);
  if (!match) return undefined;
  return { endpoint: `${match[1]} ${match[2]}`, status: Number(match[3]) };
}

/** True for a >=400 response status, or a request that failed outright (no response at all). */
export function isNetworkFailureDescription(description: string): boolean {
  const parsed = parseNetworkResponse(description);
  if (parsed) return parsed.status >= 400;
  return /failed:/i.test(description);
}

export function isNetworkFailure(event: TemporalEvent): boolean {
  return event.type === "network" && isNetworkFailureDescription(event.description);
}

/** True for any event that represents an observed problem, regardless of type. */
export function isIssue(event: TemporalEvent): boolean {
  return isConsoleError(event) || isNetworkFailure(event);
}
