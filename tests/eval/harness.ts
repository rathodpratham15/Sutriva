#!/usr/bin/env node
/**
 * TraceLens evaluation harness (TraceLens_Master_Plan.md Sec18/Sec29-30).
 *
 * Automates what can be automated deterministically, without a paid model
 * API call, per the plan's "do not make normal tests depend on paid model
 * APIs" and "the benchmark should be deterministic where possible":
 *
 *   - Temporal localization: how close the nearest sampled event is to the
 *     scenario's known failure timestamp.
 *   - Evidence retrieval: whether get_evidence around that timestamp
 *     returns anything at all.
 *   - Context efficiency: sampled-frame count vs. every-frame-at-native-fps
 *     ("baseline"), and a single targeted frame's byte size vs. the whole
 *     video file's -- the concrete version of the plan's "baseline (full
 *     video context) vs. TraceLens (progressive disclosure)" comparison.
 *   - Latency: wall-clock time for the ingest pipeline.
 *
 * Root-cause accuracy, code localization, and patch success genuinely
 * require an agent to read the repository and reason -- there is no
 * deterministic, offline way to compute them, and this harness will not
 * fake it with a real API call baked into a benchmark script. Those columns
 * are reported as "manual" with the exact prompt to run in Claude Code to
 * grade them by hand against expectedFiles/rootCause.
 */
import path from "node:path";
import { statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { inspectVideo, getTimeline, getEvidenceAround, getFrame } from "@tracelens/timeline";
import { MockVisionProvider } from "@tracelens/providers";
import { EVAL_SCENARIOS, type EvalScenario } from "./scenarios.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const fixturesDir = path.join(repoRoot, "fixtures/videos/eval");

export interface ScenarioResult {
  name: string;
  temporalLocalization: { closestDeltaSeconds: number; toleranceSeconds: number; pass: boolean };
  evidenceRetrieval: { count: number; pass: boolean };
  contextEfficiency: {
    baselineFrameCount: number;
    tracelensSampledFrames: number;
    frameReductionPercent: number;
    videoFileBytes: number;
    singleFrameBytes: number;
    /** Estimated bytes a naive "send every native-fps frame as an image" baseline would need -- baselineFrameCount * singleFrameBytes. */
    estimatedBaselineImageBytes: number;
    byteReductionPercent: number;
  };
  ingestLatencyMs: number;
  rootCauseAccuracy: string;
  codeLocalization: string;
  patchSuccess: string;
}

function round(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export async function runScenario(scenario: EvalScenario): Promise<ScenarioResult> {
  const videoPath = path.join(fixturesDir, scenario.video);

  const start = Date.now();
  const visionProvider = new MockVisionProvider();
  const result = await inspectVideo(videoPath, { visionProvider });
  const ingestLatencyMs = Date.now() - start;

  const events = getTimeline(result.session.id, {});
  const closestDeltaSeconds =
    events.length === 0
      ? Infinity
      : Math.min(...events.map((e) => Math.abs(e.timestamp.start - scenario.failureTimestamp)));

  const evidence = getEvidenceAround(result.session.id, scenario.failureTimestamp, scenario.toleranceSeconds);

  const baselineFrameCount = Math.max(1, Math.round(result.metadata.durationSeconds * result.metadata.fps));
  const tracelensSampledFrames = events.length;
  const videoFileBytes = statSync(videoPath).size;
  const frame = await getFrame(result.session.id, scenario.failureTimestamp);
  const singleFrameBytes = Buffer.from(frame.base64, "base64").length;
  // What a naive "decode and send every native-fps frame as an image" baseline would cost --
  // NOT the compressed video file size, which isn't a fair comparison to raw decoded frames
  // (a short, mostly-static clip's h264 compression can beat a single lossless PNG frame).
  const estimatedBaselineImageBytes = baselineFrameCount * singleFrameBytes;

  const manualGradingHint = `manual -- run \`claude\` then \`/debug-video ${path.relative(repoRoot, videoPath)}\` and grade against expectedFiles/rootCause below`;

  return {
    name: scenario.name,
    temporalLocalization: {
      closestDeltaSeconds: round(closestDeltaSeconds),
      toleranceSeconds: scenario.toleranceSeconds,
      pass: closestDeltaSeconds <= scenario.toleranceSeconds,
    },
    evidenceRetrieval: { count: evidence.length, pass: evidence.length > 0 },
    contextEfficiency: {
      baselineFrameCount,
      tracelensSampledFrames,
      frameReductionPercent: round((1 - tracelensSampledFrames / baselineFrameCount) * 100, 1),
      videoFileBytes,
      singleFrameBytes,
      estimatedBaselineImageBytes,
      byteReductionPercent: round((1 - singleFrameBytes / estimatedBaselineImageBytes) * 100, 1),
    },
    ingestLatencyMs,
    rootCauseAccuracy: manualGradingHint,
    codeLocalization: manualGradingHint,
    patchSuccess: manualGradingHint,
  };
}

function printReport(results: ScenarioResult[], scenarios: EvalScenario[]): void {
  console.log("\nTraceLens Evaluation Report\n" + "=".repeat(27) + "\n");
  for (const result of results) {
    const scenario = scenarios.find((s) => s.name === result.name)!;
    console.log(`## ${result.name}`);
    console.log(`   ${scenario.description}`);
    console.log(
      `   Temporal localization : ${result.temporalLocalization.pass ? "PASS" : "FAIL"} ` +
        `(nearest event ${result.temporalLocalization.closestDeltaSeconds}s from expected ${scenario.failureTimestamp}s, ` +
        `tolerance ${result.temporalLocalization.toleranceSeconds}s)`,
    );
    console.log(
      `   Evidence retrieval    : ${result.evidenceRetrieval.pass ? "PASS" : "FAIL"} (${result.evidenceRetrieval.count} evidence item(s) found around the failure)`,
    );
    console.log(
      `   Context efficiency    : ${result.contextEfficiency.tracelensSampledFrames} sampled frame(s) vs. ` +
        `${result.contextEfficiency.baselineFrameCount} at native fps (${result.contextEfficiency.frameReductionPercent}% fewer); ` +
        `a single targeted get_frame call is ${result.contextEfficiency.byteReductionPercent}% smaller than sending every ` +
        `native-fps frame as an image would be (${result.contextEfficiency.singleFrameBytes}B vs an estimated ` +
        `${result.contextEfficiency.estimatedBaselineImageBytes}B; the compressed video file itself is ${result.contextEfficiency.videoFileBytes}B, ` +
        "not a fair comparison to raw decoded frames)",
    );
    console.log(`   Ingest latency        : ${result.ingestLatencyMs}ms (mock provider, offline)`);
    console.log(`   Root-cause accuracy   : ${result.rootCauseAccuracy}`);
    console.log(`   Code localization     : ${result.codeLocalization}`);
    console.log(`   Patch success         : ${result.patchSuccess}`);
    console.log(`   Expected files        : ${scenario.expectedFiles.join(", ")}`);
    console.log(`   Expected root cause   : ${scenario.rootCause}`);
    console.log("");
  }

  const passCount = results.filter((r) => r.temporalLocalization.pass && r.evidenceRetrieval.pass).length;
  console.log(`Automated checks: ${passCount}/${results.length} scenarios pass both temporal localization and evidence retrieval.`);
  console.log(
    "Root-cause accuracy / code localization / patch success require an actual agent session to grade -- " +
      "see the per-scenario instructions above, or docs/evaluation.md.",
  );
}

export async function main(): Promise<void> {
  const missing = EVAL_SCENARIOS.filter((s) => !statSync(path.join(fixturesDir, s.video), { throwIfNoEntry: false }));
  if (missing.length > 0) {
    console.error(
      `Missing fixture(s): ${missing.map((s) => s.video).join(", ")}\n` +
        "Generate them first with: pnpm fixtures:eval:generate",
    );
    process.exitCode = 1;
    return;
  }

  const results: ScenarioResult[] = [];
  for (const scenario of EVAL_SCENARIOS) {
    console.log(`Running scenario: ${scenario.name}...`);
    results.push(await runScenario(scenario));
  }

  printReport(results, EVAL_SCENARIOS);

  const reportPath = path.join(repoRoot, ".tracelens-eval-report.json");
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON report written to ${path.relative(repoRoot, reportPath)}`);
}
