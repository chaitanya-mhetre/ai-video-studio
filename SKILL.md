---
name: ai-video-studio
description: End-to-end AI film pipeline: script → Gemini TTS voiceover (any language, multi-voice dialogue) → Gemini image plates → Veo 3.1 B-roll → Remotion edit (timeline driven by measured VO, word-synced motion, real product captures, music ducking, SFX) → loudness master → frame-by-frame QA. Use whenever the user wants to make, extend or fix a product demo, hackathon submission video, cinematic documentary, explainer, launch film, YouTube video or Short with AI voice/visuals — including non-English (Marathi, Hindi, other Indic) narration, "make a video from this script", "add voiceover/music", "generate B-roll", or "the video looks cheap/out of sync".
---

# AI Video Studio

Turns a script (or just a product) into a finished, mastered MP4 that looks like a film, not a slideshow:
generated narration and footage where reality can't be filmed, **real** product UI where it can, every
on-screen beat landing on the spoken word, and a clean −14 LUFS mix.

Proven on: a 3:57 English Google-hackathon demo (20 scenes, real console captures, Gemini Live call) and a
7:50 Marathi cinematic documentary (32 scenes, 36 TTS lines incl. a two-voice AI↔farmer dialogue, 17 Veo
clips in use, a real CM speech clip with subtitles, three-movement score). See `references/case-studies.md`.

## The pipeline (do it in this order)

Mistakes are cheap before step 4 and expensive after it. Each step has a reference — read it when you reach it.

| # | Step | Output | Read |
|---|---|---|---|
| 1 | **Brief** — purpose, audience, one core claim, must-show list, runtime, aspect, language(s), data policy, branding limits | brief in chat, confirmed | `references/script-and-voice.md` §1 |
| 2 | **Script → `src/vo-lines.json`** — one line per scene, written to be spoken; spell acronyms for the voice | lines | `script-and-voice.md` §2 |
| 3 | **Scaffold** — `cp -r <skill>/template <project>`; `npm i`; put `GEMINI_API_KEY` in `.env`; `scripts/placeholders.sh` so it renders immediately (`--clear` before real generation) | renderable project | `references/remotion-craft.md` §1 |
| 4 | **Voice** — `python3 scripts/voice.py --lang <code>` (best-of-N takes, Whisper-checked) → `public/vo/*.wav` + `src/voiceover.json`. English: also `scripts/words.py` | measured clips | `script-and-voice.md` §3–6 |
| 5 | **Timeline** — edit `SCENES` in `src/timeline.ts`; durations come from the measured VO, never typed by hand | scene table | `remotion-craft.md` §2 |
| 6 | **Visual plan** — per scene: generated plate/clip, real capture, motion-graphic, or real third-party footage | `media.json` | `references/visuals-gemini-veo.md` |
| 7 | **Generate** — `scripts/images.py` → look at every plate → `scripts/veo.py` → watch every clip; fallbacks `kenburns.sh` | `public/img`, `public/broll` | `visuals-gemini-veo.md` |
| 8 | **Capture real UI** (if a product exists) — `scripts/capture.mjs`, read-only, PII blurred in-page | `public/live/*.png` + layout | `references/capture-real-ui.md` |
| 9 | **Build scenes** one at a time; time beats with `lead + cue(vo, "word")`; QA stills after each | `src/scenes/*.tsx` | `remotion-craft.md` §3–7 |
| 10 | **Sound** — `fetch-mixkit.sh`, music beds + ducking + SFX table in `src/audio.tsx` | soundtrack | `references/sound.md` |
| 11 | **QA** — `npx tsx scripts/qa-frames.ts` → `node scripts/stills.mjs` → `contact-sheet.sh` → look | sheets | `references/render-and-qa.md` |
| 12 | **Render → master → check** — render, `master.sh`, `check.sh`; independent review | final MP4 | `render-and-qa.md` |

Deliver: mastered MP4 (with music), optional no-music cut, `public/ATTRIBUTION.md` filled, and a short note of
anything unverified (e.g. "not watched end-to-end", "dialogue takes picked by ear").

## Principles that made these films work

1. **The voiceover is the clock.** Generate and measure VO *before* animating. Scene length = lead + clip + tail
   (+ transition overlap). Change a line → re-run `voice.py` → the whole film re-times. Hand-typed frame numbers rot.
2. **Sync to words, not seconds.** `cue("m_days", "अवघ्या")` returns the frame that word is spoken; titles, SFX and
   camera moves hang off it. English uses Whisper word timestamps; Indic scripts use character-position
   estimates (±0.5 s) because Whisper's word splits are unreliable there.
3. **Real where it exists, generated where it can't be filmed.** Real product screens (captured, not rebuilt),
   real quotes (exact clip, unaltered, credited). Generated imagery only for illustrative scenes — and disclosed
   on the end card.
4. **One consistent look.** A shared `LOOK` suffix on every image/video prompt (lens, light, grade, "no text, no
   logos"), plates first, then image-to-video. Approve stills (cheap) before paying for video (expensive).
5. **Verify with eyes and ears, not assumptions.** Whisper scores every narration take; stills of every scene go
   on a contact sheet; loudness is measured on the final file. Dialogue/short lines Whisper can't judge are
   listened to — a "best-scoring" take was garbled once.
6. **Respect the language.** Native digits (`deva(2026)` → २०२६), Noto Sans Devanagari, no negative tracking,
   line-height ≥1.3, a narrator style prompt written for that language, Whisper `medium` for checking.
7. **Calm motion.** Springs `damping: 200`, one easing family, dissolves ≤18 f, slow pushes on footage, holds
   long enough to read. Documentary ≠ TikTok.

## Hard rules

- **Keys:** read from env / `.env` only, sent as the `x-goog-api-key` header, never printed, never committed.
- **Real people:** never generate an image or video depicting a real, identifiable person (politicians, officials,
  customers). Use their real footage (with rights + credit) or nothing.
- **Real data:** blur names/IDs/phones in captures before screenshotting; read-only navigation on live systems;
  anything typed on screen (demo creds) becomes public — use demo accounts.
- **No fake outlets:** news tickers, newspaper clippings, debate panels are generic — no real channel logos/mastheads.
- **Stats need sources** in `ATTRIBUTION.md`; never invent a number to fill a card.
- **Branding** only as briefed (a client may forbid extra state/government branding — ask).
- **Music/SFX** must have a recorded licence; Mixkit sounds are fetched by ID, not redistributed.

## Fast paths

- *"Just a 60 s promo for my app"* → steps 1–4, 8–12; skip Veo; one music bed; zoom-fade transitions.
  For promo shot craft (camera moves, cursor, fly-ins) also use the **remotion-promo** skill if installed.
- *"Vertical Short"* → 1080×1920, word-group captions, safe zones; read `references/shorts.md`.
- *"Translate this film"* → new `vo-lines.json` set, `voice.py --lang xx`, same scenes; swap on-screen strings and
  font; re-check every `cue()` fragment (they're in the spoken language).
- *"It's taking too long"* → render at 720p (`--scale=0.6666666666666666`), lower concurrency if RAM-bound.

## Environment

Node 20+, Python 3.10+, ffmpeg/ffprobe, `uv` (runs faster-whisper and yt-dlp in throwaway envs), Chrome deps for
Remotion. Paid: a Google AI Studio key with billing for Veo. Costs and quotas: `README.md`.
