#!/usr/bin/env bash
# Cut an exact section of a public video (e.g. an official speech quote) at 720p/1080p.
# Only use footage you have the right to use, credit the source on screen, play it unaltered.
# Usage: scripts/fetch-clip.sh <url> <start mm:ss.s> <end mm:ss.s> <out.mp4> [height=1080]
# Needs uv + node (yt-dlp needs a JS runtime for YouTube now; old yt-dlp builds get HTTP 403).
set -euo pipefail
url=$1; from=$2; to=$3; out=$4; h=${5:-1080}
dl=$(mktemp -d)
uvx --from "yt-dlp[default]" yt-dlp --js-runtimes node -f "bv*[height<=$h]+ba/b[height<=$h]" \
  --download-sections "*$from-$to" --force-keyframes-at-cuts -o "$dl/clip.%(ext)s" "$url"
ffmpeg -v error -y -i "$dl"/clip.* -c:v libx264 -crf 17 -r 30 -c:a aac -ar 48000 "$out"
echo "wrote $out (source: $url $from–$to) — add it to public/ATTRIBUTION.md"
