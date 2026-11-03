import type { LiveFixStatus } from "../lib/fixAgent.js";

export type FixTranscriptEntryKind = "assistant" | "tool-use" | "user" | "system";

export interface FixTranscriptEntry {
  id: number;
  kind: FixTranscriptEntryKind;
  text: string;
}

/** Whatever is currently waiting on the next line of input -- a free-form chat turn, or a y/n tool-use confirmation. At most one at a time. */
export interface PendingRequest {
  kind: "turn" | "confirm";
  promptLabel: string;
  /** The full action description, for a "confirm" request's dedicated permission panel -- e.g. the literal shell command or file path. */
  detail?: string;
  onSubmit: (value: string) => void;
}

export type { LiveFixStatus };
