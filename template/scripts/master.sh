#!/usr/bin/env bash
# Two-pass loudness master for a rendered MP4: -14 LUFS integrated, true peak <= -1 dBTP.
# Video stream is copied untouched. Usage: scripts/master.sh in.mp4 out.mp4
set -euo pipefail
in=$1; out=$2
stats=$(ffmpeg -hide_banner -nostats -i "$in" -map 0:a -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$stats" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -hide_banner -v error -y -i "$in" -map 0:v -map 0:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,alimiter=limit=0.84:level=false" \
  -ar 48000 -c:a aac -b:a 256k "$out"
ffmpeg -hide_banner -nostats -i "$out" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary | grep -E 'I:|Peak:'
