import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile } from "remotion";
import { cue, scene, TIMELINE, TOTAL_FRAMES, type SceneId } from "./timeline";

// Bed level between lines, ducked level under narration, ramp frames. Voice lands ~10 dB over the bed.
const BED = 0.4;
const DUCK = 0.12;
const RAMP = 8;
// Encoded MP4 audio lags picture by ~2 frames (measured by cross-correlating SFX probes). Re-measure if codec/rate changes.
const OUTPUT_AUDIO_OFFSET_F = 2;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Sfx = { scene: SceneId; f: number | [string, number?]; src: string; volume: number; len?: number; note: string };

// One declarative table. `f` is frames from the scene start, or [fragment, nth] to pin to a spoken word of the scene's VO.
// Every row names the on-screen action it belongs to. Real samples only (scripts/fetch-mixkit.sh), no synthetic beeps.
const SFX: Sfx[] = [
  { scene: "title", f: 20, src: "transition/wind-pass-vibrate", volume: 0.2, len: 120, note: "air under the title" },
  { scene: "problem", f: ["faster"], src: "impact/bass-hit-short", volume: 0.25, note: "pile-up lands" },
  { scene: "product", f: ["verified"], src: "ui/switch-light", volume: 0.24, note: "verified tick" },
  { scene: "call", f: 6, src: "light/light-aura", volume: 0.18, len: 60, note: "call connects" },
  { scene: "outro", f: 4, src: "transition/air-woosh-deep", volume: 0.24, len: 80, note: "logo lifts in" },
];

const TRANSITION_SWOOSH = ["transition/swoosh-slow", "transition/transition-soft"];

/** Duck every bed under any VO window (scenes without VO are skipped — interpolate needs increasing input). */
const duck = (f: number) => {
  let open = 1;
  for (const s of TIMELINE) if (s.turns.length) open = Math.min(open, interpolate(f, [s.voStart - RAMP, s.voStart, s.voEnd, s.voEnd + RAMP], [1, 0, 0, 1], clamp));
  return DUCK + (BED - DUCK) * open;
};

// Several beds = a score that changes mood with the story (grave → hopeful → swell). One bed is fine for a promo.
const BEDS = [{ src: "music/bed.mp3", from: 0, to: TOTAL_FRAMES, gain: 1, fadeIn: 30, fadeOut: 45 }];

const at = (frame: number) => Math.max(0, Math.round(frame - OUTPUT_AUDIO_OFFSET_F));
const sfxFrame = (s: Sfx) => {
  const sc = scene(s.scene);
  return typeof s.f === "number" ? sc.start + s.f : sc.voStart + (s.f[0] ? cue(sc.vo!, s.f[0], s.f[1] ?? 0) : 0);
};

export const Soundtrack: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <>
    {TIMELINE.flatMap((s) =>
      s.turns.map((t) => (
        <Sequence key={`vo-${t.vo}`} from={s.start + t.from} durationInFrames={t.to - t.from + 15} layout="none" name={`VO ${t.vo}`}>
          <Audio src={staticFile(`vo/${t.vo}.wav`)} />
        </Sequence>
      )),
    )}
    {SFX.map((s, i) => (
      <Sequence key={i} from={at(sfxFrame(s))} durationInFrames={s.len ?? 45} layout="none" name={s.note}>
        <Audio src={staticFile(`sfx/${s.src}.mp3`)} volume={s.volume} />
      </Sequence>
    ))}
    {TIMELINE.slice(1).map((s, i) => (
      <Sequence key={`cut-${s.id}`} from={at(s.start - 8)} durationInFrames={40} layout="none" name={`cut into ${s.id}`}>
        <Audio src={staticFile(`sfx/${TRANSITION_SWOOSH[i % 2]}.mp3`)} volume={0.1} />
      </Sequence>
    ))}
    {bgm &&
      BEDS.map((b) => (
        <Sequence key={b.src} from={b.from} durationInFrames={b.to - b.from} layout="none" name={b.src}>
          <Audio src={staticFile(b.src)} loop volume={(f) => b.gain * duck(b.from + f) * interpolate(f, [0, b.fadeIn, b.to - b.from - b.fadeOut, b.to - b.from], [0, 1, 1, 0], clamp)} />
        </Sequence>
      ))}
  </>
);
