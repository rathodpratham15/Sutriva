import { SutrivaError } from "./errors.js";

/**
 * better-sqlite3's prebuilt native binding requires Node >= 22 -- on Node 20
 * it doesn't fail cleanly, it segfaults the process the first time the
 * database is opened. Checking this explicitly, before storage is touched,
 * turns that segfault into an actionable error.
 */
export const MIN_SUPPORTED_NODE_MAJOR = 22;

export function unsupportedNodeVersionError(nodeVersion: string): SutrivaError {
  return new SutrivaError(
    "UNSUPPORTED_NODE_VERSION",
    `Sutriva requires Node.js >= ${MIN_SUPPORTED_NODE_MAJOR}, but this process is running Node ${nodeVersion}.`,
    "Run `nvm use` (this repo's .nvmrc pins Node 22) or otherwise switch to Node 22+. Running on an older Node won't error cleanly -- better-sqlite3's native binding segfaults instead.",
  );
}

/** Call at the top of every entrypoint, before storage is touched. */
export function assertSupportedNodeVersion(nodeVersion: string = process.versions.node): void {
  const major = Number(nodeVersion.split(".")[0]);
  if (major < MIN_SUPPORTED_NODE_MAJOR) {
    throw unsupportedNodeVersionError(nodeVersion);
  }
}
