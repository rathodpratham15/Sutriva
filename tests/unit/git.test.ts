import { describe, it, expect } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { getGitContext } from "@tracelens/git";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

describe("getGitContext", () => {
  it("detects this repository's branch, commit, and recent history", async () => {
    const context = await getGitContext(repoRoot);
    expect(context.isRepo).toBe(true);
    expect(context.root).toBeTruthy();
    expect(context.commit).toMatch(/^[a-f0-9]{40}$/);
    expect(Array.isArray(context.changedFiles)).toBe(true);
    expect(context.recentCommits!.length).toBeGreaterThan(0);
    expect(context.recentCommits![0]).toHaveProperty("hash");
    expect(context.recentCommits![0]).toHaveProperty("message");
  });

  it("respects the recentCommitsLimit option", async () => {
    const context = await getGitContext(repoRoot, { recentCommitsLimit: 2 });
    expect(context.recentCommits!.length).toBeLessThanOrEqual(2);
  });

  it("returns isRepo: false for a directory outside any Git working tree", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "tracelens-not-a-repo-"));
    try {
      const context = await getGitContext(dir);
      expect(context).toEqual({ isRepo: false });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
