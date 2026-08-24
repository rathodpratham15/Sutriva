import path from "node:path";
import { mkdirSync } from "node:fs";

/**
 * All TraceLens state lives under a single local data directory. Nothing here
 * is ever uploaded automatically -- see docs/privacy.md.
 */
export function getDataDir(): string {
  const dir = process.env.TRACELENS_DATA_DIR ?? path.join(process.cwd(), ".tracelens");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getArtifactsDir(): string {
  const dir = path.join(getDataDir(), "artifacts");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDbPath(): string {
  return path.join(getDataDir(), "tracelens.db");
}

export function getVisionProviderName(): string {
  if (process.env.TRACELENS_VISION_PROVIDER) return process.env.TRACELENS_VISION_PROVIDER;
  return process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock";
}

export function getVisionModel(): string {
  return process.env.TRACELENS_VISION_MODEL ?? "claude-opus-5";
}

export function getTranscriptionProviderName(): string {
  if (process.env.TRACELENS_TRANSCRIPTION_PROVIDER) return process.env.TRACELENS_TRANSCRIPTION_PROVIDER;
  return process.env.ELEVENLABS_API_KEY ? "elevenlabs" : "mock";
}

export function getTranscriptionModel(): string {
  return process.env.TRACELENS_TRANSCRIPTION_MODEL ?? "scribe_v1";
}
