/**
 * Agentic evaluation harness (docs/evaluation.md "Agentic evaluation").
 *
 * The deterministic harness (harness.ts) reports root-cause accuracy, code
 * localization, and patch success as "manual" on principle -- this file is
 * the explicitly opt-in, real-API-call alternative: it actually drives
 * Claude Code headlessly through the exact `/debug-video` workflow against
 * a disposable git worktree, then grades the result deterministically
 * (keyword overlap for root cause, file-set overlap for localization, and a
 * per-scenario DOM/layout assertion -- not a second model call -- for patch
 * success). It is NOT run by `pnpm test`/`pnpm eval`/CI: it costs a real
 * Claude API call per scenario and takes minutes, not milliseconds.
 *
 * Isolation: each scenario gets its own `git worktree` (a full checkout at
 * HEAD, sharing this repo's object store) so Claude's patch can never touch
 * the actual working tree, and `git worktree remove --force` always cleans
 * it up, success or failure.
 */
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdirSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertSupportedNodeVersion } from "@tracelens/core";
import { startLiveSession } from "@tracelens/live";
import { compareSessions, type SessionComparisonResult } from "@tracelens/timeline";
import { EVAL_SCENARIOS, type EvalScenario } from "./scenarios.js";
import { EVAL_REPROS, EVAL_FIX_VERIFICATIONS } from "./repros.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const evalFixturesDir = path.join(repoRoot, "fixtures/videos/eval");
const APP_PORT = 4300;
const ROOT_CAUSE_OVERLAP_THRESHOLD = 0.4;

export interface AgenticScenarioResult {
  name: string;
  claude: { costUsd: number; isError: boolean; durationMs: number };
  codeLocalization: { changedFiles: string[]; expectedFiles: string[]; matchedExpectedFiles: string[]; pass: boolean };
  rootCauseAccuracy: { hypothesisExcerpt: string; expectedRootCause: string; keywordOverlapRatio: number; pass: boolean };
  patchVerification: {
    beforeFixed: boolean;
    beforeDetail: string;
    afterFixed: boolean;
    afterDetail: string;
    pass: boolean;
    compareSessionsSummary: string;
  };
}

function waitForServer(url: string, timeoutMs = 20000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) return reject(new Error(`Server at ${url} did not start in time`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

function startApp(cwd: string, port: number): ChildProcessWithoutNullStreams {
  const server = spawn("pnpm", ["--filter", "buggy-app", "exec", "next", "start", "--port", String(port)], {
    cwd,
    stdio: "pipe",
  });
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  return server;
}

async function recordRepro(scenarioName: string, baseUrl: string): Promise<{ sessionId: string; verification: import("./repros.js").FixVerification }> {
  const handle = await startLiveSession({ headless: true, repositoryRoot: repoRoot });
  await EVAL_REPROS[scenarioName]!(handle.page, baseUrl);
  const verification = await EVAL_FIX_VERIFICATIONS[scenarioName]!(handle.page);
  await handle.stop();
  return { sessionId: handle.sessionId, verification };
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "to", "of", "in", "on", "and", "or", "that", "this", "it",
  "for", "with", "as", "by", "causes", "cause", "because", "not", "but", "than", "so", "at",
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/** Deterministic proxy for "did Claude identify the right root cause" -- not a second model call, see module doc comment. */
export function keywordOverlapRatio(expected: string, actual: string): number {
  const expectedWords = significantWords(expected);
  if (expectedWords.size === 0) return 1;
  const actualWords = significantWords(actual);
  let matched = 0;
  for (const word of expectedWords) if (actualWords.has(word)) matched++;
  return matched / expectedWords.size;
}

function uniqueWorktreeDir(): string {
  return path.join(os.tmpdir(), `tracelens-agentic-eval-${crypto.randomUUID()}`);
}

async function withWorktree<T>(fn: (worktreeDir: string) => Promise<T>): Promise<T> {
  const worktreeDir = uniqueWorktreeDir();
  execFileSync("git", ["worktree", "add", "--detach", worktreeDir, "HEAD"], { cwd: repoRoot, stdio: "inherit" });
  try {
    return await fn(worktreeDir);
  } finally {
    execFileSync("git", ["worktree", "remove", "--force", worktreeDir], { cwd: repoRoot, stdio: "inherit" });
  }
}

export async function runAgenticScenario(scenario: EvalScenario): Promise<AgenticScenarioResult> {
  const sourceVideo = path.join(evalFixturesDir, scenario.video);
  if (!existsSync(sourceVideo)) {
    throw new Error(`Missing fixture ${scenario.video} -- run \`pnpm fixtures:eval:generate\` first.`);
  }

  return withWorktree(async (worktreeDir) => {
    const baseUrl = `http://localhost:${APP_PORT}`;

    console.log(`[${scenario.name}] installing dependencies in the disposable worktree...`);
    execFileSync("pnpm", ["install"], { cwd: worktreeDir, stdio: "inherit" });

    console.log(`[${scenario.name}] building demo/buggy-app (pre-patch)...`);
    execFileSync("pnpm", ["--filter", "buggy-app", "build"], { cwd: worktreeDir, stdio: "inherit" });

    console.log(`[${scenario.name}] recording the BEFORE repro...`);
    let app = startApp(worktreeDir, APP_PORT);
    await waitForServer(baseUrl);
    const before = await recordRepro(scenario.name, baseUrl);
    app.kill("SIGTERM");
    if (before.verification.fixed) {
      console.warn(
        `[${scenario.name}] WARNING: the BEFORE repro already looks "fixed" (${before.verification.detail}) -- ` +
          "the harness's own baseline may be wrong, treat this scenario's result with suspicion.",
      );
    }

    const worktreeVideoDir = path.join(worktreeDir, "fixtures/videos/eval");
    mkdirSync(worktreeVideoDir, { recursive: true });
    const worktreeVideoPath = path.join(worktreeVideoDir, scenario.video);
    copyFileSync(sourceVideo, worktreeVideoPath);

    console.log(`[${scenario.name}] running Claude Code headlessly (/debug-video)...`);
    const commandTemplate = readFileSync(path.join(worktreeDir, ".claude/commands/debug-video.md"), "utf8").replace(
      /^---[\s\S]*?---\n/,
      "",
    );
    const prompt = commandTemplate.replace("$ARGUMENTS", path.relative(worktreeDir, worktreeVideoPath));

    const claudeStart = Date.now();
    const claudeStdout = execFileSync(
      "claude",
      ["-p", prompt, "--output-format", "json", "--permission-mode", "bypassPermissions"],
      { cwd: worktreeDir, encoding: "utf8", maxBuffer: 100 * 1024 * 1024, timeout: 10 * 60 * 1000, env: process.env },
    );
    const claudeDurationMs = Date.now() - claudeStart;
    const claudeResult = JSON.parse(claudeStdout) as { result: string; total_cost_usd: number; is_error: boolean };

    const changedFilesRaw = execFileSync("git", ["diff", "--name-only"], { cwd: worktreeDir, encoding: "utf8" });
    const changedFiles = changedFilesRaw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const matchedExpectedFiles = scenario.expectedFiles.filter((f) => changedFiles.includes(f));

    const fullResultText = claudeResult.result ?? "";
    // Claude's headless report doesn't reliably use the exact literal
    // "Hypothesis:" heading from .claude/commands/debug-video.md's template
    // (markdown bolding/heading variants, or paraphrased headings like "Root
    // cause") -- match a few variants, but always grade keyword overlap
    // against the FULL response text, never a truncated slice: a real run
    // showed Claude prefacing its report with unrelated narration, which a
    // naive "first 500 chars" grade would score against instead of the
    // actual hypothesis. The excerpt below is for human-readable display
    // only, not for grading.
    const hypothesisMatch = /(?:\*\*|#+\s*)?Hypothesis:?(?:\*\*)?\s*([\s\S]*?)(?:\n\s*\n|\n\s*(?:\*\*|#+\s*)?Fix:?|$)/i.exec(fullResultText);
    const hypothesisExcerpt = (hypothesisMatch?.[1] ?? fullResultText).trim().slice(0, 500);
    const overlapRatio = keywordOverlapRatio(scenario.rootCause, hypothesisMatch?.[1] ?? fullResultText);

    console.log(`[${scenario.name}] rebuilding demo/buggy-app (post-patch) and recording the AFTER repro...`);
    execFileSync("pnpm", ["--filter", "buggy-app", "build"], { cwd: worktreeDir, stdio: "inherit" });
    app = startApp(worktreeDir, APP_PORT);
    await waitForServer(baseUrl);
    const after = await recordRepro(scenario.name, baseUrl);
    app.kill("SIGTERM");

    const comparison: SessionComparisonResult = compareSessions(before.sessionId, after.sessionId);

    return {
      name: scenario.name,
      claude: { costUsd: claudeResult.total_cost_usd, isError: claudeResult.is_error, durationMs: claudeDurationMs },
      codeLocalization: {
        changedFiles,
        expectedFiles: scenario.expectedFiles,
        matchedExpectedFiles,
        pass: matchedExpectedFiles.length > 0,
      },
      rootCauseAccuracy: {
        hypothesisExcerpt,
        expectedRootCause: scenario.rootCause,
        keywordOverlapRatio: Math.round(overlapRatio * 100) / 100,
        pass: overlapRatio >= ROOT_CAUSE_OVERLAP_THRESHOLD,
      },
      patchVerification: {
        beforeFixed: before.verification.fixed,
        beforeDetail: before.verification.detail,
        afterFixed: after.verification.fixed,
        afterDetail: after.verification.detail,
        pass: after.verification.fixed,
        compareSessionsSummary: comparison.summary,
      },
    };
  });
}

function printReport(results: AgenticScenarioResult[]): void {
  console.log("\nTraceLens Agentic Evaluation Report\n" + "=".repeat(36) + "\n");
  let totalCostUsd = 0;
  for (const r of results) {
    totalCostUsd += r.claude.costUsd;
    console.log(`## ${r.name}`);
    console.log(`   Claude run            : ${r.claude.isError ? "ERROR" : "ok"}, $${r.claude.costUsd.toFixed(4)}, ${(r.claude.durationMs / 1000).toFixed(1)}s`);
    console.log(
      `   Code localization     : ${r.codeLocalization.pass ? "PASS" : "FAIL"} (touched ${r.codeLocalization.changedFiles.length} file(s); ` +
        `matched ${r.codeLocalization.matchedExpectedFiles.length}/${r.codeLocalization.expectedFiles.length} expected: ` +
        `${r.codeLocalization.expectedFiles.join(", ")})`,
    );
    console.log(
      `   Root-cause accuracy   : ${r.rootCauseAccuracy.pass ? "PASS" : "FAIL"} (keyword overlap ${r.rootCauseAccuracy.keywordOverlapRatio}, ` +
        `threshold ${ROOT_CAUSE_OVERLAP_THRESHOLD})`,
    );
    console.log(`     expected: ${r.rootCauseAccuracy.expectedRootCause}`);
    console.log(`     Claude's hypothesis: ${r.rootCauseAccuracy.hypothesisExcerpt || "(none extracted)"}`);
    console.log(
      `   Patch success          : ${r.patchVerification.pass ? "PASS" : "FAIL"} (before: ${r.patchVerification.beforeDetail}; ` +
        `after: ${r.patchVerification.afterDetail}; compare_sessions: ${r.patchVerification.compareSessionsSummary})`,
    );
    console.log("");
  }
  const passCount = results.filter((r) => r.codeLocalization.pass && r.rootCauseAccuracy.pass && r.patchVerification.pass).length;
  console.log(`${passCount}/${results.length} scenarios pass all three (code localization, root-cause accuracy, patch success).`);
  console.log(`Total cost: $${totalCostUsd.toFixed(4)}`);
}

export async function main(): Promise<void> {
  assertSupportedNodeVersion();
  const missing = EVAL_SCENARIOS.filter((s) => !existsSync(path.join(evalFixturesDir, s.video)));
  if (missing.length > 0) {
    console.error(`Missing fixture(s): ${missing.map((s) => s.video).join(", ")}\nGenerate them first with: pnpm fixtures:eval:generate`);
    process.exitCode = 1;
    return;
  }

  const results: AgenticScenarioResult[] = [];
  for (const scenario of EVAL_SCENARIOS) {
    results.push(await runAgenticScenario(scenario));
  }
  printReport(results);
}
