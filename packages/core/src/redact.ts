/**
 * Best-effort secret redaction for captured terminal output
 * (TraceLens_Master_Plan.md §22: "Do not capture secrets intentionally.
 * Provide redaction hooks."). This is a heuristic, not a guarantee -- it
 * catches common patterns (KEY=value assignments, bearer tokens, AWS access
 * keys, private key blocks) but cannot detect arbitrary secrets. Treat any
 * captured terminal output as potentially sensitive regardless.
 */
const REDACTION_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // KEY=value / KEY: value style assignments where the name looks secret-ish.
  {
    pattern: /\b([A-Za-z0-9_]*(?:API|SECRET|TOKEN|PASSWORD|PASSWD|PWD|KEY|CREDENTIAL)[A-Za-z0-9_]*)\s*[=:]\s*("[^"\n]+"|'[^'\n]+'|\S+)/gi,
    replacement: "$1=[redacted]",
  },
  // Authorization: Bearer <token> headers.
  { pattern: /\b(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, replacement: "$1[redacted]" },
  // AWS access key IDs.
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: "[redacted-aws-key]" },
  // PEM-style private key blocks.
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replacement: "[redacted-private-key]" },
];

export function redactSecrets(text: string): string {
  let result = text;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
