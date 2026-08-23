#!/usr/bin/env bash
# Verifies the Phase 7 "clean install" checklist item: clone this repo fresh
# (a real `git clone`, not a copy of the working tree -- so .git-derived
# features like git context detection are exercised honestly), then run the
# same install/build/quality gates a new contributor or CI would run.
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d -t tracelens-clean-install)"
trap 'rm -rf "$tmp_dir"' EXIT

echo "==> Cloning $repo_root into $tmp_dir"
git clone "$repo_root" "$tmp_dir" --quiet

cd "$tmp_dir"

echo "==> node -v (must satisfy engines.node >=22)"
node -v

echo "==> pnpm install"
pnpm install

echo "==> pnpm cli doctor"
pnpm cli doctor

echo "==> pnpm fixtures:generate"
pnpm fixtures:generate

echo "==> pnpm build"
pnpm build

echo "==> pnpm typecheck"
pnpm typecheck

echo "==> pnpm lint"
pnpm lint

echo "==> pnpm test"
pnpm test

echo
echo "Clean install verified OK."
