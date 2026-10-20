# Vertical Shorts (1080×1920)

Distilled from the Youtube-Shorts ("Inkonomics") pipeline: bilingual EN/HI money-story Shorts, 35–60 s.

## Differences from the 16:9 film

| | Film | Short |
|---|---|---|
| Canvas | 1920×1080 | 1080×1920 (`WIDTH/HEIGHT` in theme.ts; `aspect: "9:16"` in media.json) |
| Length | 3–8 min | 35–60 s, hook in first 2.5 s, loopable ending |
| Text | titles + captions on cue words | **word-group captions** for every spoken word |
| Visual | Veo clips | stills with Ken Burns / parallax (cheaper, 10–14 scenes) |
| Music duck | per VO window | per word (0.18 → 0.06 within 0.25 s of a word, 0.2 s ramps) |
| Pacing | lead/tail per scene | mood pauses between lines: calm 0.35 s, dramatic 0.6, excited 0.2, end hold 0.5 |

## Captions

- Group 2–4 words; break on a ≥0.35 s gap, a >0.6 s pause or punctuation; a sentence end always closes the group
  (a caption never spans two scenes). Each group stays until the next starts (≤0.5 s extra).
- Show the **script's** words aligned onto Whisper timestamps — never Whisper's spelling.
- Style: a font covering Latin + Devanagari (Baloo 2), 96 px, weight 800, 10 px dark stroke with
  `paintOrder: "stroke fill"`, spring pop-in; unspoken words at 55% opacity; the scene's highlight word in the accent colour.
- Safe zones: keep captions at top ≈1150 px; reserve 400 px at the bottom and 150 px on the right for YouTube's UI.

## Images

- `gemini-3.1-flash-image` with reference images (style ref, mascot, character sheets made first at 1:1) for
  consistency across scenes; generate scenes 4 at a time.
- Subject in the upper two-thirds, calm bottom fifth and right edge (captions + UI).
- Claude scores each image 0–10 on a contact sheet (subject, style match, artefacts, composition); regenerate
  failures up to 3×.
- Parallax: `rembg` foreground cut-out, kept only if it covers 3–85% of the frame; heavy (≈9 GB RAM) — one at a time.
- Gemini may return JPEG bytes when you asked for PNG — detect and convert.

## Gates

Story schema checked before any paid call (word budget = target seconds × words/s; every claim has ≥2 sources),
WER limits on narration (EN 0.15, HI 0.30, numbers must be heard), render probe (resolution, fps, codec, duration
±0.2 s, loudness), then human-style checkpoints (hook, retention, payoff, loop; compliance, sources, AI disclosure).
Budget caps per batch (e.g. 80 image calls, 250 TTS calls). Upload stays manual.
