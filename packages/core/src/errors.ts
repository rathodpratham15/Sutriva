export class TraceLensError extends Error {
  readonly code: string;
  readonly hint?: string;

  constructor(code: string, message: string, hint?: string) {
    super(hint ? `${message}\n\n${hint}` : message);
    this.name = "TraceLensError";
    this.code = code;
    this.hint = hint;
  }
}

export function missingFfmpegError(): TraceLensError {
  return new TraceLensError(
    "FFMPEG_NOT_FOUND",
    "FFmpeg was not found on this system.",
    "Install FFmpeg:\n  macOS:   brew install ffmpeg\n  Ubuntu:  sudo apt install ffmpeg\n  Windows: https://ffmpeg.org/download.html",
  );
}

export function invalidVideoError(path: string, detail: string): TraceLensError {
  return new TraceLensError(
    "INVALID_VIDEO",
    `"${path}" could not be read as a video: ${detail}`,
    "Confirm the file exists, is a supported container (mp4/mov/webm), and is not corrupted. Try: ffprobe <path>",
  );
}

export function pathNotAllowedError(path: string): TraceLensError {
  return new TraceLensError(
    "PATH_NOT_ALLOWED",
    `Path "${path}" is not accessible.`,
    "TraceLens only reads files that exist on disk and are explicitly referenced. Check the path and permissions.",
  );
}

export function providerNotConfiguredError(
  provider: string,
  envVar: string,
  mockSwitchVar: string = "TRACELENS_VISION_PROVIDER",
): TraceLensError {
  return new TraceLensError(
    "PROVIDER_NOT_CONFIGURED",
    `${provider} is not configured.`,
    `Set the ${envVar} environment variable, or configure ${mockSwitchVar}=mock for offline/deterministic use.`,
  );
}

export function malformedProviderResponseError(provider: string, detail: string): TraceLensError {
  return new TraceLensError(
    "MALFORMED_PROVIDER_RESPONSE",
    `${provider} returned a response TraceLens could not parse: ${detail}`,
    "This is usually transient. Retry the request; if it persists, check TRACELENS_VISION_MODEL is a currently supported model.",
  );
}

export function sessionNotFoundError(sessionId: string): TraceLensError {
  return new TraceLensError(
    "SESSION_NOT_FOUND",
    `No session found with id "${sessionId}".`,
    "Call inspect_video or inspect_session first to create or list sessions.",
  );
}
