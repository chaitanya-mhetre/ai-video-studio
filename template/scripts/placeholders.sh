#!/usr/bin/env bash
# Make the template render before any paid generation: silent VO clips sized from voiceover.json,
# grey plates/B-roll, placeholder logos and capture, a silent music bed. Never overwrites real files.
# Every file created is listed in .placeholders; `scripts/placeholders.sh --clear` deletes exactly those
# (do this before generating real assets — images.py/veo.py skip files that already exist).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" = --clear ]; then
  [ -f .placeholders ] && xargs -r rm -f < .placeholders && rm .placeholders; echo "placeholders cleared"; exit
fi
mk() { [ -e "$1" ] || { local out=$1; shift; mkdir -p "$(dirname "$out")"; ffmpeg -v error -y "$@" "$out"; echo "$out" >> .placeholders; echo "placeholder $out"; }; }
for id in $(node -e 'console.log(Object.keys(require("./src/voiceover.json")).join(" "))'); do
  d=$(node -e "console.log(require('./src/voiceover.json')['$id'])")
  mk public/vo/$id.wav -f lavfi -i anullsrc=r=48000:cl=mono -t "$d"
done
for id in $(node -e 'console.log(Object.keys(require("./media.json").clips).join(" "))'); do
  mk public/broll/$id.mp4 -f lavfi -i "color=c=0x445048:s=1920x1080:r=30" -t 8 -c:v libx264 -pix_fmt yuv420p
done
mk public/brand/logo.png -f lavfi -i "color=c=0x0f7a3d:s=480x120" -frames:v 1
mk public/brand/company-white.png -f lavfi -i "color=c=white:s=560x140" -frames:v 1
mk public/live/app.png -f lavfi -i "color=c=0xe8f3ec:s=3840x2160" -frames:v 1
mk public/music/bed.mp3 -f lavfi -i anullsrc=r=48000:cl=stereo -t 30
