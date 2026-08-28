import { describe, it, expect } from "vitest";
import path from "node:path";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { getGitContext, getDiffStat, getWorkingTreeDiff } from "@sutriva/git";

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
    const dir = mkdtempSync(path.join(tmpdir(), "sutriva-not-a-repo-"));
    try {
      const context = await getGitContext(dir);
      expect(context).toEqual({ isRepo: false });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("getDiffStat / getWorkingTreeDiff", () => {
  function makeScratchRepo(): string {
    const dir = mkdtempSync(path.join(tmpdir(), "sutriva-diff-test-"));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git("init", "-q");
    git("config", "user.email", "test@example.com");
    git("config", "user.name", "Test");
    writeFileSync(path.join(dir, "file.txt"), "line1\nline2\n");
    git("add", "file.txt");
    git("commit", "-q", "-m", "initial commit");
    return dir;
  }

  it("returns an empty-ish diff/stat for a clean working tree", async () => {
    const dir = makeScratchRepo();
    try {
      expect((await getDiffStat(dir))?.trim()).toBe("");
      expect((await getWorkingTreeDiff(dir))?.diff.trim()).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reflects an uncommitted change", async () => {
    const dir = makeScratchRepo();
    try {
      writeFileSync(path.join(dir, "file.txt"), "line1\nline2 changed\nline3\n");
      const stat = await getDiffStat(dir);
      expect(stat).toContain("file.txt");
      const diff = await getWorkingTreeDiff(dir);
      expect(diff!.diff).toContain("file.txt");
      expect(diff!.diff).toContain("line2 changed");
      expect(diff!.truncated).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("truncates a large diff to maxLines and flags it", async () => {
    const dir = makeScratchRepo();
    try {
      writeFileSync(path.join(dir, "file.txt"), Array.from({ length: 500 }, (_, i) => `line ${i}`).join("\n"));
      const diff = await getWorkingTreeDiff(dir, { maxLines: 10 });
      expect(diff!.truncated).toBe(true);
      expect(diff!.diff.split("\n").length).toBeLessThanOrEqual(10);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
