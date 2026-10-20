#!/usr/bin/env bash
# Tile QA stills into one image (6 per row, 480 px wide each), in argument order, to check a whole film at a glance.
# Usage: scripts/contact-sheet.sh out/qa/sheet.jpg out/qa/*.jpg
set -euo pipefail
out=$1; shift
tmp=$(mktemp -d); i=0
for f in "$@"; do cp "$f" "$tmp/$(printf %04d $i).jpg"; i=$((i + 1)); done
ffmpeg -v error -y -i "$tmp/%04d.jpg" -vf "scale=480:-2,tile=6x$(( (i + 5) / 6 )):padding=4:color=black" -frames:v 1 "$out"
echo "contact sheet → $out ($i frames)"
