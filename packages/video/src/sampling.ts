/**
 * Progressive sampling: cheap fixed-interval sampling bounded to a maximum
 * frame count. Dense/scene-change/event-driven sampling around a region of
 * interest is layered on top via `denseSampleAround` once something looks
 * interesting -- we never extract every frame by default.
 */
export interface SamplingOptions {
  /** Target spacing between samples, in seconds. */
  intervalSeconds?: number;
  /** Hard cap on number of frames sampled, regardless of duration. */
  maxFrames?: number;
}

const DEFAULT_INTERVAL_SECONDS = 2;
const DEFAULT_MAX_FRAMES = 24;

export function sampleTimestamps(durationSeconds: number, options: SamplingOptions = {}): number[] {
  if (durationSeconds <= 0) return [0];
  const maxFrames = options.maxFrames ?? DEFAULT_MAX_FRAMES;
  const requestedInterval = options.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS;
  // If the requested interval would exceed the frame budget, widen it.
  const minInterval = durationSeconds / maxFrames;
  const interval = Math.max(requestedInterval, minInterval);

  const timestamps: number[] = [];
  for (let t = 0; t <= durationSeconds; t += interval) {
    timestamps.push(Number(t.toFixed(3)));
  }
  const last = Number(durationSeconds.toFixed(3));
  if (timestamps[timestamps.length - 1] !== last) {
    timestamps.push(last);
  }
  return timestamps.slice(0, maxFrames);
}

/** Dense sampling in a narrow window, used once a coarse pass finds something interesting. */
export function denseSampleAround(
  centerSeconds: number,
  durationSeconds: number,
  windowSeconds = 3,
  stepSeconds = 0.5,
): number[] {
  const start = Math.max(0, centerSeconds - windowSeconds);
  const end = Math.min(durationSeconds, centerSeconds + windowSeconds);
  const timestamps: number[] = [];
  for (let t = start; t <= end; t += stepSeconds) {
    timestamps.push(Number(t.toFixed(3)));
  }
  return timestamps;
}
