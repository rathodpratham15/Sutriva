import { describe, it, expect } from "vitest";
import { redactSecrets } from "@sutriva/core";

describe("redactSecrets", () => {
  it("redacts KEY=value style assignments for secret-looking names", () => {
    const input = "Starting with API_KEY=sk-ant-abc123 and DB_PASSWORD=hunter2";
    const result = redactSecrets(input);
    expect(result).not.toContain("sk-ant-abc123");
    expect(result).not.toContain("hunter2");
    expect(result).toContain("API_KEY=[redacted]");
    expect(result).toContain("DB_PASSWORD=[redacted]");
  });

  it("redacts Bearer tokens", () => {
    const input = "curl -H 'Authorization: Bearer abc.def123-XYZ' https://api.example.com";
    const result = redactSecrets(input);
    expect(result).not.toContain("abc.def123-XYZ");
    expect(result).toContain("Bearer [redacted]");
  });

  it("redacts AWS access key IDs", () => {
    const input = "AWS_ACCESS_KEY_ID is AKIAABCDEFGHIJKLMNOP, keep it secret";
    const result = redactSecrets(input);
    expect(result).not.toContain("AKIAABCDEFGHIJKLMNOP");
  });

  it("redacts PEM private key blocks", () => {
    const input = "-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJ...\n-----END RSA PRIVATE KEY-----";
    const result = redactSecrets(input);
    expect(result).not.toContain("MIIBogIBAAJ");
    expect(result).toContain("[redacted-private-key]");
  });

  it("leaves ordinary output untouched", () => {
    const input = "Running 12 tests...\nAll tests passed!\nBuild succeeded.";
    expect(redactSecrets(input)).toBe(input);
  });
});
