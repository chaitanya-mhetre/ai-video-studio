#!/usr/bin/env bash
# Final gate on a delivered MP4: resolution, fps, codec, duration, loudness (target -14 LUFS, true peak <= -1 dBTP).
# Usage: scripts/check.sh out/film-master.mp4
set -euo pipefail
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size -of default=nw=1 "$1"
ffmpeg -hide_banner -nostats -i "$1" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -A15 Summary | grep -E 'I:|Peak:'
