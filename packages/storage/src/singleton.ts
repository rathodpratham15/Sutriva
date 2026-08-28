import { getDbPath } from "@sutriva/core";
import { SutrivaStore } from "./store.js";

let instance: SutrivaStore | undefined;

/** Process-wide store bound to the configured SUTRIVA_DATA_DIR. */
export function getStore(): SutrivaStore {
  if (!instance) {
    instance = new SutrivaStore(getDbPath());
  }
  return instance;
}
