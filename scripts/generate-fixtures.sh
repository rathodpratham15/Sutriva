#!/usr/bin/env bash
# Generates deterministic synthetic MP4 fixtures for tests and demos using
# ffmpeg's lavfi test sources -- no binary assets committed to the repo.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$DIR/fixtures/videos"
mkdir -p "$OUT"

echo "Generating $OUT/sample.mp4 (12s, color bars with a mid-clip color change + timecode + tone)"
ffmpeg -y \
  -f lavfi -i "color=c=blue:s=640x360:d=6,drawtext=text='OK':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -f lavfi -i "color=c=red:s=640x360:d=6,drawtext=text='ERROR 500':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -f lavfi -i "sine=frequency=440:duration=12" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -map 2:a \
  -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest \
  "$OUT/sample.mp4" -loglevel error

echo "Generating $OUT/checkout-bug.mp4 (14s, simulates the demo checkout-500 bug)"
ffmpeg -y \
  -f lavfi -i "color=c=0x1e293b:s=640x360:d=8,drawtext=text='Checkout page':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -f lavfi -i "color=c=0x7f1d1d:s=640x360:d=6,drawtext=text='500 Internal Server Error':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0[v]" \
  -map "[v]" \
  -c:v libx264 -pix_fmt yuv420p \
  "$OUT/checkout-bug.mp4" -loglevel error

echo "Done. Fixtures:"
ls -la "$OUT"
