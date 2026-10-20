// Print `name:frame` pairs (40% into each scene and 1 s before its end) for scripts/stills.mjs.
// Usage: npx tsx scripts/qa-frames.ts [sceneId ...]
import { TIMELINE, TOTAL_FRAMES } from "../src/timeline";

const only = new Set(process.argv.slice(2));
const out = TIMELINE.filter((s) => !only.size || only.has(s.id)).flatMap((s) => [`${s.id}-a:${s.start + Math.round(s.duration * 0.4)}`, `${s.id}-b:${s.start + s.duration - 30}`]);
console.log(out.join(" "));
console.error(`total ${TOTAL_FRAMES} frames (${(TOTAL_FRAMES / 30).toFixed(1)} s)`);
