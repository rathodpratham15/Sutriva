import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { runScenario } from "./harness.js";
import { EVAL_SCENARIOS } from "./scenarios.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const fixturesDir = path.join(repoRoot, "fixtures/videos/eval");

const fixturesExist = EVAL_SCENARIOS.every((s) => existsSync(path.join(fixturesDir, s.video)));

describe.skipIf(!fixturesExist)("runScenario (eval harness)", () => {
  // One shared data dir for the whole suite, not one per test: the storage
  // singleton (packages/storage/src/singleton.ts) caches its DB connection
  // on first use and does not re-read TRACELENS_DATA_DIR afterwards -- the
  // same as a real single `tracelens eval` process, which only ever sees
  // one value for the env var during its lifetime. Swapping it per-test
  // would leave the cached connection pointed at an already-deleted
  // directory while inspectVideo's content-hash cache still "remembers"
  // sessions from an earlier test, serving artifact paths that no longer
  // exist.
  let dataDir: string;

  beforeAll(() => {
    dataDir = mkdtempSync(path.join(tmpdir(), "tracelens-eval-test-"));
    process.env.TRACELENS_DATA_DIR = dataDir;
  });

  afterAll(() => {
    delete process.env.TRACELENS_DATA_DIR;
    rmSync(dataDir, { recursive: true, force: true });
  });

  it("computes deterministic, positive metrics for every scenario", async () => {
    for (const scenario of EVAL_SCENARIOS) {
      const result = await runScenario(scenario);

      expect(result.name).toBe(scenario.name);
      expect(result.temporalLocalization.closestDeltaSeconds).toBeGreaterThanOrEqual(0);
      expect(result.evidenceRetrieval.count).toBeGreaterThan(0);
      expect(result.contextEfficiency.tracelensSampledFrames).toBeGreaterThan(0);
      expect(result.contextEfficiency.tracelensSampledFrames).toBeLessThan(result.contextEfficiency.baselineFrameCount);
      // The whole point of progressive disclosure: one targeted frame must cost less
      // than the estimated "send every native-fps frame" baseline, not more.
      expect(result.contextEfficiency.singleFrameBytes).toBeLessThan(result.contextEfficiency.estimatedBaselineImageBytes);
      expect(result.contextEfficiency.byteReductionPercent).toBeGreaterThan(0);
      expect(result.ingestLatencyMs).toBeGreaterThanOrEqual(0);
    }
  }, 30_000);

  it("passes temporal localization and evidence retrieval for all three demo bugs", async () => {
    for (const scenario of EVAL_SCENARIOS) {
      const result = await runScenario(scenario);
      expect(result.temporalLocalization.pass, `${scenario.name}: temporal localization`).toBe(true);
      expect(result.evidenceRetrieval.pass, `${scenario.name}: evidence retrieval`).toBe(true);
    }
  }, 30_000);
});

describe("EVAL_SCENARIOS", () => {
  it("has a unique name and at least one expected file per scenario", () => {
    const names = new Set(EVAL_SCENARIOS.map((s) => s.name));
    expect(names.size).toBe(EVAL_SCENARIOS.length);
    for (const scenario of EVAL_SCENARIOS) {
      expect(scenario.expectedFiles.length).toBeGreaterThan(0);
      expect(scenario.rootCause.length).toBeGreaterThan(0);
    }
  });
});
