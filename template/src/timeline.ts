import { FPS } from "./theme";
import lines from "./vo-lines.json";
import voiceover from "./voiceover.json";
import words from "./words.json";

type VoId = keyof typeof voiceover;

/**
 * The one table that drives picture, VO, music ducking, SFX and QA frames.
 * - `vo` scene: lead + measured VO clip + tail.
 * - `dialog` scene: several clips (e.g. two TTS voices) chained with TURN_GAP between turns.
 * - `hold` scene: fixed seconds, no narration (title cards, a real speech clip, a logo hold).
 * Change the script → re-run voice.py → durations update everywhere. Never hand-type frame numbers.
 */
const SCENES: { id: string; vo?: VoId; dialog?: VoId[]; hold?: number; lead?: number; tail: number }[] = [
  { id: "title", hold: 5, tail: 0 },
  { id: "problem", vo: "problem", lead: 0.8, tail: 1.4 },
  { id: "product", vo: "product", tail: 1.6 },
  { id: "call", dialog: ["call_ai", "call_user"], lead: 0.6, tail: 1.6 },
  { id: "outro", vo: "outro", tail: 3.0 },
];

export type SceneId = (typeof SCENES)[number]["id"];

export const VO_LEAD = 12;
export const TRANSITION = 18;
const TURN_GAP = 12;

export const TIMELINE = (() => {
  let cursor = 0;
  return SCENES.map(({ id, vo, dialog, hold, lead, tail }) => {
    const clips = dialog ?? (vo ? [vo] : []);
    const leadF = clips.length ? (lead ? Math.round(lead * FPS) : VO_LEAD) : 0;
    const start = cursor;
    let t = leadF;
    const turns = clips.map((v) => {
      const len = Math.ceil(voiceover[v] * FPS);
      const turn = { vo: v, from: t, to: t + len };
      t += len + TURN_GAP;
      return turn;
    });
    const voFrames = turns.length ? turns[turns.length - 1].to - leadF : 0;
    const duration = clips.length ? leadF + voFrames + Math.ceil(tail * FPS) + TRANSITION : Math.ceil((hold ?? 0) * FPS) + TRANSITION;
    cursor += duration - TRANSITION;
    return { id, vo, turns, duration, start, lead: leadF, voStart: start + leadF, voEnd: start + leadF + voFrames };
  });
})();

export const TOTAL_FRAMES = TIMELINE.reduce((s, x) => s + x.duration, 0) - TRANSITION * (TIMELINE.length - 1);
export const scene = (id: SceneId) => TIMELINE.find((s) => s.id === id)!;

const SPOKEN = Object.fromEntries(lines.map((l) => [l.id, l.spoken])) as Record<string, string>;
const WORDS = words as Record<string, [string, number][]>;

/**
 * Frames from the start of a VO clip to where `fragment` is spoken (n-th occurrence).
 * Uses Whisper word timestamps (scripts/words.py → words.json) when present; otherwise estimates from the
 * fragment's character position (±~0.5 s — fine for Indic scripts where word timestamps are unreliable).
 */
export const cue = (vo: VoId, fragment: string, n = 0): number => {
  const list = WORDS[vo];
  if (list?.length) {
    const hits = list.filter(([w]) => w.toLowerCase().replace(/^[-–"']/, "").startsWith(fragment.toLowerCase()));
    if (hits[n]) return Math.round(hits[n][1] * FPS);
  }
  const text = SPOKEN[vo];
  let i = -1;
  for (let k = 0; k <= n; k++) i = text.indexOf(fragment, i + 1);
  if (i < 0) throw new Error(`cue: "${fragment}"#${n} not in ${vo}`);
  return Math.round((i / text.length) * voiceover[vo] * FPS);
};

export type SceneProps = { duration: number; lead: number };
