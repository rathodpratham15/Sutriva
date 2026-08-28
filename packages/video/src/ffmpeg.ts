import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { missingFfmpegError, invalidVideoError } from "@sutriva/core";

let ffmpegChecked = false;

/** Runs a binary and collects stdout/stderr. Never throws on non-zero exit -- callers inspect `code`. */
function run(bin: string, args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(missingFfmpegError());
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

export async function assertFfmpegAvailable(): Promise<void> {
  if (ffmpegChecked) return;
  const probe = await run("ffprobe", ["-version"]).catch(() => null);
  const ffmpeg = await run("ffmpeg", ["-version"]).catch(() => null);
  if (!probe || probe.code !== 0 || !ffmpeg || ffmpeg.code !== 0) {
    throw missingFfmpegError();
  }
  ffmpegChecked = true;
}

export interface FfprobeStream {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
}

export interface FfprobeResult {
  format?: { duration?: string; size?: string; format_name?: string };
  streams?: FfprobeStream[];
}

export async function probeRaw(filePath: string): Promise<FfprobeResult> {
  await assertFfmpegAvailable();
  const { code, stdout, stderr } = await run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);
  if (code !== 0) {
    throw invalidVideoError(filePath, stderr.trim() || `ffprobe exited with code ${code}`);
  }
  try {
    return JSON.parse(stdout) as FfprobeResult;
  } catch {
    throw invalidVideoError(filePath, "ffprobe returned malformed JSON");
  }
}

function parseFrameRate(rate: string | undefined): number {
  if (!rate) return 0;
  const [num, den] = rate.split("/").map(Number);
  if (!num) return 0;
  if (!den) return num;
  return num / den;
}

export interface ExtractedVideoInfo {
  durationSeconds: number;
  fps: number;
  width: number;
  height: number;
  hasAudio: boolean;
  codec?: string;
}

export function toVideoInfo(probe: FfprobeResult, filePath: string): ExtractedVideoInfo {
  const videoStream = probe.streams?.find((s) => s.codec_type === "video");
  if (!videoStream) {
    throw invalidVideoError(filePath, "no video stream found");
  }
  const hasAudio = Boolean(probe.streams?.some((s) => s.codec_type === "audio"));
  const duration = Number(probe.format?.duration ?? 0);
  const fps = parseFrameRate(videoStream.avg_frame_rate) || parseFrameRate(videoStream.r_frame_rate) || 30;
  return {
    durationSeconds: Number.isFinite(duration) ? duration : 0,
    fps,
    width: videoStream.width ?? 0,
    height: videoStream.height ?? 0,
    hasAudio,
    codec: videoStream.codec_name,
  };
}

/** Extracts a single frame nearest `timestampSeconds` to `outPath` (created if missing). */
export async function extractFrame(filePath: string, timestampSeconds: number, outPath: string): Promise<void> {
  await assertFfmpegAvailable();
  const clamped = Math.max(0, timestampSeconds);
  const { code, stderr } = await run("ffmpeg", [
    "-y",
    "-ss",
    clamped.toFixed(3),
    "-i",
    filePath,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    outPath,
  ]);
  if (code !== 0) {
    throw invalidVideoError(filePath, stderr.trim() || `ffmpeg frame extraction exited with code ${code}`);
  }
  // ffmpeg can exit 0 with an empty output file -- e.g. seeking at/past a
  // video's exact reported duration yields "Output file is empty" while
  // still returning success. Treat that as a failure rather than letting a
  // missing file surface as a confusing ENOENT deeper in the pipeline.
  if (!existsSync(outPath)) {
    throw invalidVideoError(
      filePath,
      `ffmpeg produced no frame at t=${clamped.toFixed(3)}s (exited 0 but wrote no output -- likely seeking at or past the video's actual end)`,
    );
  }
}

/** Extracts the audio track as 16kHz mono WAV, suitable for transcription providers. */
export async function extractAudio(filePath: string, outPath: string): Promise<void> {
  await assertFfmpegAvailable();
  const { code, stderr } = await run("ffmpeg", [
    "-y",
    "-i",
    filePath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    outPath,
  ]);
  if (code !== 0) {
    throw invalidVideoError(filePath, stderr.trim() || `ffmpeg audio extraction exited with code ${code}`);
  }
}
