import { spawn } from "node:child_process";

/**
 * Minimal Git context for correlating evidence with source: current branch,
 * commit, working-tree status, and recent history. Full diffs and the
 * evidence-correlation graph are a later phase (TraceLens_Master_Plan.md
 * Phase 4) -- this is deliberately just enough for a hypothesis to reference
 * "which files changed recently", not a complete source-correlation engine.
 */
export interface RecentCommit {
  hash: string;
  message: string;
  date: string;
}

export interface GitContext {
  /** False when `cwd` isn't inside a Git working tree -- everything else is omitted in that case. */
  isRepo: boolean;
  root?: string;
  branch?: string;
  commit?: string;
  commitMessage?: string;
  /** True if there are uncommitted changes (tracked or untracked). */
  dirty?: boolean;
  /** Paths with uncommitted changes, bounded to MAX_CHANGED_FILES. */
  changedFiles?: string[];
  recentCommits?: RecentCommit[];
}

const MAX_CHANGED_FILES = 50;
const DEFAULT_RECENT_COMMITS = 5;
const MAX_RECENT_COMMITS = 20;

function runGit(cwd: string, args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function tryRunGit(cwd: string, args: string[]): Promise<string | undefined> {
  const result = await runGit(cwd, args).catch(() => undefined);
  if (!result || result.code !== 0) return undefined;
  return result.stdout.trim();
}

/** Returns Git context for `cwd`, or `{ isRepo: false }` if it isn't inside a Git working tree. */
export async function getGitContext(
  cwd: string,
  options: { recentCommitsLimit?: number } = {},
): Promise<GitContext> {
  const root = await tryRunGit(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) return { isRepo: false };

  const [branch, commit, commitMessage, statusOutput, logOutput] = await Promise.all([
    tryRunGit(root, ["rev-parse", "--abbrev-ref", "HEAD"]),
    tryRunGit(root, ["rev-parse", "HEAD"]),
    tryRunGit(root, ["log", "-1", "--pretty=%s"]),
    tryRunGit(root, ["status", "--porcelain"]),
    tryRunGit(root, [
      "log",
      `-n${Math.min(options.recentCommitsLimit ?? DEFAULT_RECENT_COMMITS, MAX_RECENT_COMMITS)}`,
      "--date=iso-strict",
      "--pretty=format:%H%x1f%s%x1f%ad%x1e",
    ]),
  ]);

  const changedFiles = statusOutput
    ? statusOutput
        .split("\n")
        .filter(Boolean)
        .map((line) => line.slice(3).trim())
        .slice(0, MAX_CHANGED_FILES)
    : [];

  const recentCommits: RecentCommit[] = logOutput
    ? logOutput
        .split("\x1e")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [hash, message, date] = entry.split("\x1f");
          return { hash: hash ?? "", message: message ?? "", date: date ?? "" };
        })
    : [];

  return {
    isRepo: true,
    root,
    branch: branch === "HEAD" ? undefined : branch,
    commit,
    commitMessage,
    dirty: changedFiles.length > 0,
    changedFiles,
    recentCommits,
  };
}
