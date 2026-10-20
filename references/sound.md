# Sound

Layers, quietest to loudest in the listener's attention: music beds → ambience → cut swooshes → SFX → narration.
All of it lives in `src/audio.tsx` and is driven by the same `TIMELINE`.

## 1. Narration

One `<Sequence from={scene.start + turn.from}>` per clip (+15 f tail so the reverb isn't cut). Clips are pre-normalised to
−16 LUFS by `voice.py`, so they sit evenly without per-line gain.

## 2. Music beds

- Source: Mixkit Stock Music (free licence, commercial OK, no attribution, not for broadcast/games/CD).
  `scripts/fetch-mixkit.sh music 184 music-vastness`. Record title + URL in `ATTRIBUTION.md` at download time.
- **A score, not a loop:** the Marathi film used three beds that follow the story —
  grave ("Vastness", problem act) → hopeful from the logo reveal ("Possible Dreams", product act) → swell that
  starts 1.5 s before the real speech clip ends ("Beautiful Dream", finale). Overlap the beds by ~1 s with fades
  (fadeIn 20–60 f, fadeOut 40–90 f) so changes feel like a cue, not a cut.
- No bed under a real speech clip — let the speaker breathe; bring the finale in under its last words.
- `loop` on every bed (`@remotion/media` `<Audio loop>`), volume as a function of frame.

## 3. Ducking

```ts
BED 0.40 between lines, DUCK 0.12 under narration, RAMP 8 f
open = min over VO windows of interpolate(f, [voStart−RAMP, voStart, voEnd, voEnd+RAMP], [1,0,0,1])
volume(f) = gain × (DUCK + (BED−DUCK) × open) × fadeInOut(f)
```
That puts the voice ~10–11 dB over the bed. Shorts used a word-level duck (0.18 → 0.06 whenever a word is within
0.25 s) — tighter, suits wall-to-wall talking.

## 4. SFX table

```ts
{ scene: "capture", f: ["फोटो"], src: "camera/click-camera", volume: 0.34, note: "shutter" }
{ scene: "title",   f: 30,       src: "transition/wind-pass-vibrate", volume: 0.22, len: 150, note: "wind under the title" }
```
- `f` = frames from scene start, or `[fragment, nth]` pinned to the spoken word. `note` = the on-screen action (it
  is also the Sequence name in Studio, so the timeline is self-documenting).
- Volumes: hero hits (logo reveal, the big question) 0.3–0.45, max ~3 per film; normal 0.2–0.3; under narration ≤0.25.
- Repeated hits alternate two samples with stepping volume (no machine-gun).
- Real samples only (whoosh, impact, shutter, typewriter, switch, sparkle). No synthetic beeps/bloops/"success" chimes.
- A soft swoosh (vol 0.1) 8 f before every cut, alternating two files — skip cuts into a speech clip.
- `OUTPUT_AUDIO_OFFSET_F = 2`: the encoded MP4's audio lagged picture by ~2 frames (measured by cross-correlating SFX
  probes); every SFX is placed 2 f early. Re-measure if Remotion/codec/sample-rate changes.

## 5. Ambience

Veo clips generated with "ambient sound only" carry usable rain/wind/field sound. Play the clip's audio under its scene
(`AMBIENT` table, volume ~0.3, 20 f fade in / 30 f out) while the picture uses the muted `Broll`.

## 6. Master (`scripts/master.sh in.mp4 out.mp4`)

Two-pass `loudnorm` to **−14 LUFS integrated, TP −1.5, LRA 11, linear**, then `alimiter limit=0.84`; video copied,
audio AAC 256k 48 kHz; prints the ebur128 summary. Target: −14 ± 0.5 LUFS, peak ≤ −1 dBFS.
Result on the Marathi documentary: −14.1 LUFS / −1.1 dBFS.

Also render a **no-music** version (`--props='{"bgm":false}'`) — editors and translators ask for it.
