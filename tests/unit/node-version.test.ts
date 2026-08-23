import { describe, it, expect } from "vitest";
import { assertSupportedNodeVersion, MIN_SUPPORTED_NODE_MAJOR, TraceLensError } from "@tracelens/core";

describe("assertSupportedNodeVersion", () => {
  it("passes for a Node version at or above the minimum", () => {
    expect(() => assertSupportedNodeVersion(`${MIN_SUPPORTED_NODE_MAJOR}.0.0`)).not.toThrow();
    expect(() => assertSupportedNodeVersion(`${MIN_SUPPORTED_NODE_MAJOR + 1}.2.3`)).not.toThrow();
  });

  it("throws an actionable TraceLensError for an unsupported Node version", () => {
    expect(() => assertSupportedNodeVersion("20.18.2")).toThrow(TraceLensError);
    try {
      assertSupportedNodeVersion("20.18.2");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(TraceLensError);
      expect((err as TraceLensError).code).toBe("UNSUPPORTED_NODE_VERSION");
      expect((err as TraceLensError).message).toContain("20.18.2");
      expect((err as TraceLensError).message).toContain("nvm use");
    }
  });
});
