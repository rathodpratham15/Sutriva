import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { resolveExistingFile, assertWithinRoot, TraceLensError } from "@tracelens/core";

const thisFile = fileURLToPath(import.meta.url);

describe("resolveExistingFile", () => {
  it("resolves a real file to an absolute path", () => {
    expect(resolveExistingFile(thisFile)).toBe(thisFile);
  });

  it("rejects a missing file", () => {
    expect(() => resolveExistingFile("/definitely/not/a/real/path.mp4")).toThrow(TraceLensError);
  });

  it("rejects null bytes", () => {
    expect(() => resolveExistingFile("foo\0bar")).toThrow(TraceLensError);
  });
});

describe("assertWithinRoot", () => {
  it("allows paths inside the root", () => {
    expect(() => assertWithinRoot("/data/sessions/a.png", "/data")).not.toThrow();
  });

  it("rejects traversal outside the root", () => {
    expect(() => assertWithinRoot("/data/../etc/passwd", "/data")).toThrow(TraceLensError);
  });
});
