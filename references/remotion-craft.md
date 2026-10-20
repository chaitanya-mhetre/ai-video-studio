# Remotion craft

Remotion 4 (React → frames → h264). Template pinned to 4.0.524. Everything is a pure function of
`useCurrentFrame()` — no `Math.random`, `Date.now`, CSS animations or timers.

## 1. Project layout (template/)

```
media.json              plates + clips prompts, LOOK suffixes, aspect
src/vo-lines.json       script lines → voice.py
src/voiceover.json      measured seconds per line (written by voice.py)
src/words.json          word timestamps (English, words.py)
src/timeline.ts         SCENES table → TIMELINE, TOTAL_FRAMES, scene(), cue()
src/Film.tsx            COMPONENTS map + TransitionSeries + Soundtrack
src/audio.tsx           VO sequences, beds + ducking, SFX table, cut swooshes
src/scenes/*.tsx        one component per scene, local frames
src/ui.tsx              Title, Kicker, Sub, Caption, Note, deva()
src/components/         Broll/Scrim, LiveShot (+Window), Background
src/theme.ts            product tokens, FPS/WIDTH/HEIGHT
scripts/                voice, words, images, veo, kenburns, capture, fetch-*, stills, qa-frames, contact-sheet, master, check
public/                 vo/ img/ broll/ live/ music/ sfx/ brand/ ATTRIBUTION.md
```

Two films in one project (English + Marathi) = a second folder (`src/mr/`) with its own timeline/lines/audio and a
second `<Composition>` in Root.tsx; scripts take the folder as a flag. Shared components stay in `src/components`.

## 2. Timeline maths

```ts
{ id: "brand", vo: "m_brand", lead: 1.4, tail: 3.2 }            // VO scene
{ id: "live",  dialog: ["m_d1", …, "m_d7"], lead: 0.8, tail: 2 } // dialogue scene
{ id: "cm",    hold: CM_CLIP_S + 0.6, tail: 0 }                  // fixed-length (real clip, title)
```
duration = lead + VO (+ TURN_GAP between turns) + tail + TRANSITION; next scene starts at `start + duration − TRANSITION`;
`TOTAL = Σ durations − TRANSITION × (n−1)`. Each scene component receives `{duration, lead}` and works in local frames.

- `lead` default 12 f: breath before the narrator speaks. Bigger (1–1.4 s) after a chapter change or a logo reveal.
- `tail` 1.3–1.8 s normal; 3+ s after a question or a reveal so it lands; 5 s on the end card.
- Use `scene("id").turns`/`.voStart` in audio and in scenes that need to know who's speaking.
- Want the total? `npx tsx scripts/qa-frames.ts` prints it. Runtime over target → cut tails first, then lines.

## 3. Syncing to speech

`lead + cue("m_offline", "नेटवर्क मिळताच")` = local frame where that phrase starts. Use it for: title entrances,
list items appearing as they're named (`PILLS.map(p => rise(useSpringIn(lead + cue(vo, p.word))))`), state flips
(offline → online), camera pushes, SFX. A fragment that's not in the line throws at render — that's a feature:
it catches script edits that orphan a cue.

## 4. Shot vocabulary used

| Shot | Recipe |
|---|---|
| Title / logo | logo on white card (`Img` in a padded rounded box) above a kinetic `Title`; ≥30 still frames before the cut |
| Documentary caption | `Broll` + `Scrim` + lower-left `Caption` (rule draws, kicker, line) |
| Montage | 2–4 B-roll cuts inside one scene via `<Sequence from>` + 12-f opacity ramps |
| News bar / memo / clipping | generic React graphics (no real outlet branding), typewriter SFX on each |
| Big number | count-up with `interpolate` on the cue word, native digits for Indic |
| Real product | `LiveShot` with camera keys `{f, x, y, z}` + highlight `boxes` from `live-layout.json` |
| Phone UI | React phone frame rebuilding the app screens from its theme tokens (when no capture exists) |
| Process steps | `Step` badges + rows that appear on their cue words |
| AI video call | remote feed (Broll) + self-view PiP + viewfinder corners + LIVE timer + hint chips + transcript bubbles typing over each turn (`Call` in template) |
| Agents / pipeline | cards that light in sequence, connector lines drawn with `interpolate` on stroke-dashoffset |
| Real quote | `OffthreadVideo` full frame + lower-third + timed subtitles + source note |
| Outcome | Broll of people + strikethrough old value + big new value |
| Tagline | logo + 3 pills, each on its spoken word |
| End card | "Powered by" + company logo (white artwork → dark canvas) + thank-you + AI-visual disclosure, fade to black |

## 5. Motion rules

- Springs `{damping: 200}` (no overshoot) for a calm/government/B2B tone; one easing family:
  `EASE = bezier(0.16,1,0.3,1)`, `EASE_IO = bezier(0.65,0,0.35,1)`.
- Entrances animate 2–3 properties (`rise()` = opacity + translateY + blur); exits ~10 f, entrances ~20 f; stagger 3–6 f.
- Clamp every `interpolate`; ranges must be strictly increasing (a scene without VO has no voStart/voEnd → skip it).
- Transitions: documentary = dissolve with 6 px blur-in, 18 f; promo = zoom-fade (scale 1.04→1 + blur).
- Background: one continuous animated canvas under all scenes (drifting light pools + masked dot grid), so
  dissolves never flash to black.
- Footage: always a slow push (scale 1.02→1.12 over the scene); nothing static, nothing fast.

## 6. Typography

- Sizes measured on the 1920×1080 frame: headline ≥80 px, captions ≥56, secondary ≥32, labels ≥18. Check at 480 px wide.
- Load fonts with `@remotion/google-fonts` (blocks render until loaded). Quote family names with spaces.
- **Devanagari:** Noto Sans Devanagari; `lineHeight 1.32`; `paddingTop: size*0.06` per word (matras clip otherwise);
  **no negative letter-spacing** (breaks conjuncts); native digits via `deva()`; `whiteSpace: nowrap` per line and
  split long titles into explicit lines.
- Highlight words with `*asterisks*` in `Title` → gradient fill via `background-clip: text`.

## 7. Gotchas hit

- `premountFor={30}` on every sequence with video/images; don't combine `premountFor` with `layout="none"` (TS error).
- Spreading `rise(p)` *after* your own `opacity` overrides it — put custom opacity after the spread.
- `marginTop` on a full-frame flex child can expose a strip of the background; use `paddingBottom` on the container.
- `OffthreadVideo` + slow `playbackRate` is fine; set `--offthreadvideo-cache-size-in-bytes` on long renders.
- Text in 3D/scaled containers goes soft — use 2× captures and CSS `zoom` rather than `transform: scale` on text.
- `staticFile()` for everything in `public/`; never import media.
