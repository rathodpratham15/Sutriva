import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { pathNotAllowedError } from "./errors.js";

/**
 * Resolves and validates a user-supplied filesystem path. Rejects null bytes
 * and non-existent paths so MCP tools never pass unchecked strings to fs/ffmpeg.
 */
export function resolveExistingFile(inputPath: string): string {
  if (inputPath.includes("\0")) {
    throw pathNotAllowedError(inputPath);
  }
  const resolved = path.resolve(inputPath);
  if (!existsSync(resolved) || !statSync(resolved).isFile()) {
    throw pathNotAllowedError(inputPath);
  }
  return resolved;
}

/** Ensures `candidate` resolves to a path inside `root` (prevents traversal via artifact IDs). */
export function assertWithinRoot(candidate: string, root: string): string {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relative = path.relative(resolvedRoot, resolvedCandidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw pathNotAllowedError(candidate);
  }
  return resolvedCandidate;
}
