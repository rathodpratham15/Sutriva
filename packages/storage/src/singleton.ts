import { getDbPath } from "@tracelens/core";
import { TraceLensStore } from "./store.js";

let instance: TraceLensStore | undefined;

/** Process-wide store bound to the configured TRACELENS_DATA_DIR. */
export function getStore(): TraceLensStore {
  if (!instance) {
    instance = new TraceLensStore(getDbPath());
  }
  return instance;
}
