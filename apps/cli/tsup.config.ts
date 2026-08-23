import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  dts: false,
  sourcemap: false,
  splitting: false,
  // Inline the internal @tracelens/* workspace packages (they aren't published
  // separately) but leave real npm dependencies -- especially better-sqlite3's
  // native binding and playwright's browser download -- external, so they're
  // installed normally from the published package's own "dependencies".
  noExternal: [/^@tracelens\//],
});
