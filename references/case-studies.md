# Case studies

## 1. eSurvey — Google hackathon demo (English, 3:57)

**Brief:** 3:30–3:50 submission video for a post-disaster crop-loss platform built on Google tech. Show the real
product, the farmer's guided self-survey, satellite + Gemini agent assessment, blind dual officer verification.
Clean modern look matching the product's green tokens, no neon "AI" style.

**Structure (20 scenes):** open (hail B-roll) → cost of the status quo (sourced stats) → today's process → brand →
flow overview → real login → calamity event → capture → field walk to stations → **Gemini Live coaching in Marathi**
→ offline-first upload → ingest/evidence gates → Earth Engine satellite → Gemini agents → fraud guard → officer
decision → field trial numbers → architecture → Google stack → outro.

**What made it work**
- Real console captures (`LiveShot`) with highlight boxes from `live-layout.json`; real names/IDs blurred in-page.
- Charon narrator at tempo 1.07; one Marathi coaching line in Kore inside the English film (`skip_asr`).
- Word-timestamp `cue()` from Whisper `small.en`, so every card lands on its word.
- Official Google Cloud icons for the stack scene; every statistic sourced in `ATTRIBUTION.md`.
- 6 Veo clips (hail, walk, film, pod, drone, drought) from Gemini plates.

## 2. eSurvey — Marathi cinematic documentary (7:50)

**Brief:** client's Marathi script (6–7 min), everything in Marathi, Marathi people on screen, the CM's exact quote
from an official upload in scene 5, good low BGM, no extra state branding, fix a truncated line.
Later asks: make the survey/assessment process more descriptive; add the AI↔farmer live-call demo
("शेंग फोडून दाखवा"); eSurvey logo above the title; end on "Powered by" + company logo, then thank you.

**Structure (32 scenes, 3 acts):**
1. *Problem* — title, spine of Maharashtra, storm montage, struggle + generic news bar, CM/government memos, mountain of
   panchnamas, political pressure (generic debate graphic), paper process, the question.
2. *Solution* — logo reveal, system, no more queues, capture, geofence (camera unlocks only inside the plot),
   4 survey stations, live-call intro, **7-turn AI↔farmer dialogue**, offline-first upload, data flow, 6 evidence
   gates, satellite, 4 AI specialists → one assessment, fraud detection, a bogus claim caught, blind officers +
   senior decides, officer report.
3. *Outcome* — CM intro (muted pre-roll + lower-third), CM quote clip with Marathi subtitles + source, "महिनाभर →
   अवघ्या काही दिवसांत", tagline pills, Powered by + thanks + AI-visuals disclosure.

**Numbers:** 36 TTS lines (Charon with a Marathi documentary style prompt; dialogue Kore/Algenib), 11 new plates,
11 new Veo clips + 6 reused from the English film (one replaced by Ken Burns after 3 audio-filter refusals), 3 music beds, ~30 SFX cues, 14,105 frames.
Rendered 720p (1080p OOM'd on the first try), mastered −14.1 LUFS / −1.1 dBFS, 305 MB.

**Lessons**
- Whisper `medium` + character-level matching made Marathi take selection reliable; `base` was useless.
- Pace-only tie-break on unscored dialogue picked a garbled take → listen to dialogue takes.
- Proportional `cue()` was accurate enough for Marathi titles and SFX.
- Two-voice dialogue + typing transcript + shaky-camera beat made the AI-assistant idea instantly understandable to
  a non-technical audience — the most-requested addition.
- Descriptive process scenes added a minute; agree whether runtime or completeness wins before adding scenes.

## 3. Inkonomics — YouTube Shorts factory (EN/HI, 35–60 s)

Python CLI orchestrating `research → story.json → voice → align → assemble → images → layers → props → render →
checks → pack`, with Claude Code skills for the judgment steps (writing, image scoring, checkpoints). Gemini TTS
(Charon/Fenrir) with Chatterbox fallback, `gemini-3.1-flash-image` with character sheets, Remotion 1080×1920 with
word-group captions. See `shorts.md`.

## 4. PontiCare — SaaS promo (EN, Remotion, zero API keys)

Code-driven promo: product UI rebuilt in React from the landing site's tokens (`Stage` = headline + tilted window),
cursor with click ripple, Chatterbox local TTS (+ optional owned reference voice), Whisper-picked takes (CHECK under
0.9), one ducked Mixkit bed, SFX table, J-cut whooshes 8 f before cuts, measured 2-frame audio offset, same
`master.sh`. Proves the pipeline works fully offline when no cloud key is allowed.
