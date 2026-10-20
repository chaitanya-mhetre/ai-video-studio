#!/usr/bin/env bash
# Still → 8 s slow push-in clip (fallback when Veo filters a clip, or for zero-cost drafts).
# Usage: scripts/kenburns.sh public/img/x.jpg public/broll/x.mp4 [seconds=8] [WxH=1920x1080]
set -euo pipefail
in=$1; out=$2; secs=${3:-8}; size=${4:-1920x1080}; n=$((secs * 30))
ffmpeg -v error -y -loop 1 -i "$in" -vf "scale=-2:2160,zoompan=z='1+0.12*on/$n':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$n:s=$size:fps=30,format=yuv420p" \
  -t "$secs" -c:v libx264 -crf 18 "$out"
echo "wrote $out"
