# Script and voice

## 1. Brief (before writing a word)

Write it down and confirm with the user. Every later decision is checked against it.

| Field | Example (Marathi documentary) |
|---|---|
| Purpose / venue | Government presentation + YouTube; Marathi audience |
| Core claim | Digital, transparent crop-loss panchnama in days, not months |
| Must-show | storm damage → admin pressure → product → survey process → AI assessment → CM quote → outcome |
| Runtime / aspect | 6–7 min target (landed 7:50 after "make the process more descriptive"), 16:9 |
| Language | Everything Marathi: VO, on-screen text, people on screen |
| Real footage | CM quote clip from an official upload, exact section, unaltered |
| Limits | No extra state branding beyond script; no AI depictions of real people; no real outlet logos |
| Data policy | Real farmer names/IDs blurred; demo creds only |
| Delivery | 720p for speed (1080p optional), −14 LUFS |

User-stated constraints are hard constraints. When the client's script has a broken line (e.g. a truncated
amount "शासन ५, रुपयांची"), reword it so it's correct rather than reading the error aloud — and say so.

## 2. Writing lines for TTS

- **One line per scene**, ≤ ~25 words for documentary narration, ≤ ~12 for promo. Long lines → split the scene.
- **`spoken` is for the voice, `expect` is for Whisper.** Spell what the TTS should say ("A.I.", "O.P.D.",
  "Ten rupees") and give the literal transcript in `expect` when they differ ("AI", "OPD", "10").
- **Numbers:** in Indic narration write numbers as words if the TTS stumbles; on screen use native digits.
- **Mixed language:** in Hindi/Marathi lines keep English product words in Latin script ("eSurvey", "AI") —
  full transliteration sounded rushed (Youtube-Shorts finding). Exception: when the brand is *spoken* in the
  local script (`ई-सर्व्हे`), write it that way and cue on that spelling.
- **Pace:** write to length rather than speeding the voice. Learned rates: EN ≈ 2.2 words/s (≈130–150 wpm for a
  documentary narrator), HI ≈ 1.85 words/s. Charon reads ~120 wpm; `--tempo 1.07` tightened English without
  artefacts. Marathi was left at 1.0.
- **Script hygiene:** no unverifiable stats; every number on screen has a row in `ATTRIBUTION.md`.

### `src/vo-lines.json` row

```json
{ "id": "m_d4", "voice": "Algenib", "skip_asr": true,
  "style": "A Marathi farmer on a video call, natural and slightly unsure.",
  "spoken": "असं बरोबर आहे का? आता दिसतंय का?" }
```

## 3. Gemini TTS (what `scripts/voice.py` does)

- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/interactions` with
  `model: "gemini-3.8-flash-tts"` (check the current id in AI Studio — the Shorts project used
  `gemini-3.1-flash-tts-preview`), `response_format: {type: audio, mime_type: audio/wav, sample_rate: 24000}`,
  `generation_config.speech_config: [{voice}]`, and a **style annotation** (`speech_metadata.style`) = the director's note.
- Response audio is in `output_audio.data` or inside `steps[].content[]` — handle both.
- Retries with backoff (rate limits are common when generating 30+ lines × 2–3 takes).
- **Director's note pattern:** persona + delivery + "Read exactly this text and nothing else." Without the last
  sentence the model occasionally adds words.

### Voices that worked

| Use | Voice | Note |
|---|---|---|
| English documentary narrator | Charon | calm, grave; tempo 1.07 |
| Marathi documentary narrator | Charon + Marathi style prompt | "deep, authoritative… native Marathi pronunciation" |
| AI assistant (dialogue) | Kore | friendly, clear |
| Farmer / user (dialogue) | Algenib | natural male |
| Hindi narrator (Shorts) | Fenrir | |

Pick voices by listening to 2–3 candidates on one real line; don't choose from names.

## 4. Take selection (best-of-N)

For every line: N takes (default 2, use 3 for hard lines) → clean → Whisper → score.

- **Clean chain:** `highpass=70`, trim leading silence, reverse, trim, reverse, `loudnorm I=-16 TP=-1.5 LRA=11`, 48 kHz mono.
- **Score:** `difflib.SequenceMatcher` ratio between script and transcript. Latin → words; any non-ASCII script →
  letters + combining marks (Whisper splits Devanagari words inconsistently, characters are robust).
- **Tie-break:** closest to target pace.
- **Thresholds:** EN 0.85, Indic 0.75 (Whisper `medium`; `base`/`small` are poor at Marathi).
- Takes are cached in `.cache/vo-takes/` → a crashed run resumes; `--fresh` regenerates; `--only id,id` targets lines.

### Failure modes seen

- **Score 0 / garbage take** (tagline once came back as noise). Regenerate with `--takes 3 --fresh --only <id>`.
- **Whisper mishears digits** (Hindi especially) → reword the line; don't lower the threshold.
- **`skip_asr` lines** (dialogue, short coaching lines) are scored 1.0, so the *pace* tie-break picks — and once
  picked a garbled take. Always listen to `.cache/vo-takes/<id>-*.wav` and copy the good one to `public/vo/<id>.wav`,
  then update its duration in `src/voiceover.json`
  (`ffprobe -v error -show_entries format=duration -of csv=p=0 public/vo/<id>.wav`).

## 5. Word timing

- **English:** `python3 scripts/words.py` → `src/words.json` (faster-whisper `small.en`, `word_timestamps=True`).
  `cue(vo, "verified")` returns the frame of the first word starting with that text; `cue(vo, "the", 2)` = third.
- **Indic:** no words.json; `cue()` estimates from the fragment's character position in `spoken`. Accurate to
  ~0.5 s, plenty for titles/SFX. If something must land on a syllable, do forced alignment for that line only.
- Better (Shorts pipeline): align the *script* words onto Whisper's timestamps so captions show script spelling,
  not Whisper's.

## 6. Dialogue scenes (AI ↔ user)

- Each turn is its own line with its own `voice` and `style`, `skip_asr: true`.
- Timeline: `{ id: "live", dialog: ["m_d1", …, "m_d7"], lead: 0.8, tail: 2.0 }` — turns chained with a 12-frame gap;
  each scene gets `turns: [{vo, from, to}]` for the picture (who's speaking, transcript typing) and the audio.
- Write it as a real coaching exchange with a visible payoff: assistant asks → user does it wrong (shaky
  camera) → assistant corrects → user shows the evidence (split the pod: "शेंग फोडा, दाणे दाखवा") → confirmation.

## 7. Offline / no-key alternative

Chatterbox (Resemble AI, MIT) runs locally (`ChatterboxTTS.from_pretrained(device)`; `generate(text,
audio_prompt_path=ref, exaggeration=0.45, cfg_weight=0.5)`), multilingual variant exists. Same clean → Whisper →
pick loop; free the TTS model (`del` + `gc.collect()`) before loading Whisper. Only clone a voice you own the rights to.

Gemini TTS can sound thin; an extra mastering chain helps for Shorts: `highpass 90, EQ −3 dB@250 Hz, +3 dB@3.5 kHz,
+2 dB shelf@10 kHz, de-esser, 3:1 compressor`, then loudnorm.
