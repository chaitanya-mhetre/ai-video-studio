#!/usr/bin/env bash
# Download the curated Mixkit SFX set into public/sfx/ (Mixkit Sound Effects Free License: commercial use OK,
# no attribution required, but the sounds may NOT be redistributed as a standalone library — that's why this
# repo ships IDs, not files). Music: scripts/fetch-mixkit.sh music <mixkit-music-id> <name>
# Re-check https://mixkit.co/license/ before release. Record every file you use in public/ATTRIBUTION.md.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" = music ]; then
  mkdir -p public/music; curl -fsSL "https://assets.mixkit.co/music/$2/$2.mp3" -o "public/music/$3.mp3"
  echo "public/music/$3.mp3 ← https://assets.mixkit.co/music/$2/$2.mp3"; exit
fi
while read -r path id; do
  [ -z "$path" ] && continue
  mkdir -p "public/sfx/$(dirname "$path")"
  [ -e "public/sfx/$path.mp3" ] || curl -fsSL "https://assets.mixkit.co/active_storage/sfx/$id/$id-preview.mp3" -o "public/sfx/$path.mp3"
done <<'LIST'
camera/click-camera 1133
impact/bass-hit-short 2299
impact/hit-weak 2148
impact/impact-cine-big 788
impact/impact-deep-whoosh 1143
impact/impact-epic-trailer 2908
light/light-aura 2581
light/light-sweep-magic 2586
light/shimmer-sparkle-sweep 2633
light/sparkle-touch 3083
text/typewriter-hit-hard 1364
text/typewriter-hit-soft 1366
transition/air-woosh-deep 2604
transition/air-woosh-quick 2605
transition/sweep-short 175
transition/swoosh-quick 166
transition/swoosh-slow 163
transition/transition-soft 2608
transition/transition-tech-slide 3120
transition/whoosh-fast 1490
transition/wind-pass-vibrate 2705
ui/switch-click-quick 2582
ui/switch-light 2579
ui/switch-tap 2585
LIST
echo "sfx ready in public/sfx/"
