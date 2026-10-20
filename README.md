# ai-video-studio — a Claude Code skill for AI-made films

Script in, mastered MP4 out. This skill teaches Claude Code (Anthropic's CLI agent) the full pipeline we used to make
a 4-minute English hackathon demo and a 7:50 Marathi cinematic documentary:

```
script ──► Gemini TTS (best-of-N, Whisper-checked) ──► measured durations drive the timeline
brief  ──► Gemini image plates ──► Veo 3.1 image-to-video B-roll
product ─► Puppeteer captures (PII blurred) ──► 2D camera + highlight boxes
                         └──► Remotion (React) edit: word-synced motion, dialogue scenes, real clips, subtitles
                              └──► music beds + ducking + SFX table ──► render ──► −14 LUFS master ──► QA contact sheets
```

Claude does the directing (brief, script edits, scene design, React code, QA by looking at stills); Gemini/Veo
generate voice and footage; Remotion renders; ffmpeg masters.

## What's in here

| Path | What |
|---|---|
| `SKILL.md` | The skill: when to use it, the 12-step pipeline, principles, hard rules |
| `references/` | Deep dives Claude reads on demand: script & voice, visuals (Gemini/Veo), Remotion craft, sound, capture, render & QA, Shorts, case studies |
| `template/` | A working Remotion project (5 example scenes: title, documentary caption, real-UI camera, AI video call, powered-by end card) + all pipeline scripts |

## Install

```bash
git clone <this repo> ~/.claude/skills/ai-video-studio        # personal skill
# or per project:  <project>/.claude/skills/ai-video-studio
```
Then, once per machine: install Node, ffmpeg and uv (see Requirements). For each new video:

```bash
cp -r ~/.claude/skills/ai-video-studio/template my-film && cd my-film
npm i
cp .env.example .env        # paste your GEMINI_API_KEY into .env
```

That's all the setup. Claude Code discovers the skill from `SKILL.md`'s frontmatter. Ask e.g. *"make a 3-minute demo video for this repo"* or
*"turn this Marathi script into a documentary"*, or invoke it explicitly with `/ai-video-studio`.

## Requirements

| Tool | Why | Install |
|---|---|---|
| Node 20+ / npm | Remotion | nodejs.org |
| Python 3.10+ | pipeline scripts (stdlib only) | |
| ffmpeg + ffprobe | audio clean-up, Ken Burns, contact sheets, mastering | `apt install ffmpeg` / `brew install ffmpeg` |
| uv | runs faster-whisper and yt-dlp in throwaway envs | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Chrome/Chromium libs | Remotion headless render, Puppeteer | Remotion downloads its own headless shell |
| Claude Code | the director | `npm i -g @anthropic-ai/claude-code` |

### Keys

| Variable | Needed for | Where |
|---|---|---|
| `GEMINI_API_KEY` | TTS, image plates, Veo | https://aistudio.google.com/apikey — **Veo needs billing enabled** |
| `APP_URL`, `APP_USER`, `APP_PASS` | optional: capturing your product's real screens | a demo/staging account |

**That's the complete list.** One Gemini key covers voice, images and Veo. No Pexels, Pixabay, ElevenLabs, OpenAI
or YouTube key is needed — music and SFX come from Mixkit, which needs no key.

Put them in the project's `.env`: copy `template/.env.example` (it lists exactly these variables). `.env` is git-ignored. Scripts send the key only in
the `x-goog-api-key` header and never print it. **Never commit a key.**

No key at all? Use local Chatterbox TTS (see `references/script-and-voice.md` §7), motion graphics + real captures
instead of Veo, and `kenburns.sh` on your own photos.

### Models used (check for newer ids)

| Job | Model |
|---|---|
| Narration / dialogue | `gemini-3.8-flash-tts` (Interactions API), voices Charon, Kore, Algenib, Fenrir |
| Image plates | `gemini-3-pro-image` (quality) / `gemini-3.1-flash-image` (drafts, reference images) |
| B-roll | `veo-3.1-generate-preview`, image-to-video, 8 s, 1080p |
| QA transcription | faster-whisper `base.en` / `small.en` (English), `medium` (Indic), local CPU |

## Quick start (by hand)

```bash
cp -r ~/.claude/skills/ai-video-studio/template my-film && cd my-film
npm i && cp .env.example .env            # add GEMINI_API_KEY
scripts/fetch-mixkit.sh                  # SFX (by ID; Mixkit licence)
scripts/placeholders.sh                  # grey stand-ins so it renders now
npx remotion studio                      # preview

# real assets
scripts/placeholders.sh --clear
edit src/vo-lines.json  → python3 scripts/voice.py --lang en && python3 scripts/words.py
edit media.json         → python3 scripts/images.py && python3 scripts/veo.py
scripts/fetch-mixkit.sh music 184 bed    # or any licensed track → public/music/bed.mp3
edit src/timeline.ts, src/scenes/*, src/audio.tsx

# QA + deliver
node scripts/stills.mjs Film out/qa $(npx tsx scripts/qa-frames.ts) && scripts/contact-sheet.sh out/qa/sheet.jpg out/qa/*.jpg
npx remotion render src/index.ts Film out/film.mp4
scripts/master.sh out/film.mp4 out/film-master.mp4 && scripts/check.sh out/film-master.mp4
```

Run `scripts/placeholders.sh --clear` before generating real assets — it deletes exactly the stand-ins it made
(the generators skip files that already exist).

## Cost & time (rough)

- TTS: 30–40 lines × 2–3 takes per film — small cost, minutes.
- Images: ~10–20 plates, regenerate a few.
- Veo: the expensive part — each 8 s clip costs real money and 1–3 min; generate only storyboarded clips, approve
  the still first.
- Render: tens of minutes for a multi-minute film at 1080p; 720p is much faster.

## Ethics & licensing (non-negotiable)

- No AI-generated depictions of real, identifiable people. Real people appear only in real footage you have the
  right to use, unaltered, credited on screen.
- Generated visuals are disclosed on the end card.
- No real news-outlet branding in mock news graphics.
- Personal data blurred before capture; demo credentials only.
- Every music/SFX/footage file and on-screen statistic recorded in `public/ATTRIBUTION.md`. Mixkit sounds are
  downloaded by ID (their licence forbids redistributing them as a library), not committed.

## Credits

Created by **Chaitanya Mhetre** — [@chaitanya-mhetre](https://github.com/chaitanya-mhetre)
