# Visuals: Gemini plates → Veo B-roll

## 1. Decide per scene what the picture is

| Scene need | Source | Why |
|---|---|---|
| The world/problem (storm, flood, queue, office) | Gemini plate → Veo clip | can't be filmed on demand |
| The product | real capture (`capture.mjs`) inside `LiveShot`, or a rebuilt mobile UI in React when no build is reachable | real beats fake; judges notice |
| A real person's words | their real footage, exact section | never generate a real person |
| Process / data / architecture | motion graphics in React | clearer than footage |
| Emotional close | Veo clip of generic people + logo card | |

## 2. Plates (`scripts/images.py`, model `gemini-3-pro-image`)

`generateContent` with `responseModalities: ["IMAGE"]`, `imageConfig: {aspectRatio: "16:9" | "9:16", imageSize: "2K"}`.
`gemini-3.1-flash-image` is cheaper/faster for drafts and accepts reference images (character sheets, style refs)
for consistency across a series.

**Prompt = cinematographer's description + shared LOOK suffix** (in `media.json`):

```
A Marathi farmer in his forties wearing a saffron pheta turban and a white shirt crouches in his damaged soybean
field and holds an Android smartphone close to the crop … the phone screen faces away from camera, soft morning light.
+ " Documentary photograph, full-frame camera, 35mm lens, natural light, muted earthy colour grade, soft contrast,
fine film grain, realistic, … no text, no logos, no watermark, no oversaturation, no HDR, no neon."
```

Rules that paid off:
- **Region + culture explicitly**: "rural Maharashtra", "white Gandhi cap", "nauvari saree", "black cotton soil".
  Without it you get generic stock-India.
- **Two LOOKs**: landscape plates say "no people's faces visible"; plates with people use a LOOK that asks for
  "authentic local people and clothing, natural skin". Mark those `"people": true`.
- **Screens face away from camera** — otherwise the model invents unreadable fake UI you'd have to hide.
- **No text, no logos** in every prompt; add your own type in Remotion.
- **Never name a real person** (blocked, and wrong). Officials appear as generic "a young government agriculture officer".
- Composition for overlays: leave calm space where captions go (bottom third for 16:9; upper two-thirds subject
  for Shorts with a calm bottom fifth).
- **Look at every plate** before animating (contact sheet). Regenerate by id: `python3 scripts/images.py grief`.

## 3. Veo B-roll (`scripts/veo.py`, model `veo-3.1-generate-preview`)

`POST /models/veo-3.1-generate-preview:predictLongRunning` with the plate as `image.bytesBase64Encoded`,
`parameters: {aspectRatio, resolution: "1080p", durationSeconds: 8, personGeneration: "allow_adult"}`; poll the
operation every 12 s; download `generatedSamples[0].video.uri` with the key header. 3 in parallel.

**Prompt = one slow camera move + small natural motion + the LOOK:**
`"The tired clerk lifts a file from the stack, flips through pages and sets it down with a sigh … slow push-in."`
+ `" Documentary cinematography, steady gimbal camera, slow deliberate movement, … Ambient sound only, no music,
no dialogue, no on-screen text."`

- Image-to-video keeps the grade and the people consistent with the approved plate.
- Ask for **ambient sound** — the storm clip's rain/wind became the montage ambience (`AMBIENT` in audio.tsx).
- 8 s clips stretch over longer scenes with `playbackRate` 0.55–0.7 plus a slow CSS push (`Broll` component).
  Slowed Veo footage reads as "cinematic", not as slow-mo.
- **Filtered result** (`NO VIDEO`, `raiMediaFilteredReasons`): often the *audio* safety filter. Reword (remove
  speech-like actions, "speaking to it" → "glances at its screen"), retry. After 2–3 failures:
  `scripts/kenburns.sh public/img/x.jpg public/broll/x.mp4` — a zoompan from the still; nobody noticed.
- Watch every clip at 1× before using it: hands with extra fingers, morphing faces, text appearing → regenerate or cut around it.
- Cost/time: each clip takes 1–3 min; Veo needs a billing-enabled project. Generate only what the storyboard uses.

## 4. Footage helpers

- `<Broll src rate push dur dim/>` — full-bleed, muted, slow scale push, optional dim.
- `<Scrim side="bottom" strength/>` — gradient so white type on footage stays legible without darkening everything.
- Cross-fade inside one scene: put a second `Broll` in a `<Sequence from={cueFrame}>` with an opacity ramp.
- Self-view / picture-in-picture: `OffthreadVideo` in a rounded box with `objectFit: cover` + `objectPosition`.
- Camera "shake" for a story beat (user's phone shaking): `translate(sin(f*1.7)*9px)` + 2–3 px blur, only on that turn.

## 5. Real third-party footage (speeches, news)

`scripts/fetch-clip.sh <url> 49:07.6 49:49.2 public/cm/quote.mp4 720` — yt-dlp needs a JS runtime now
(`--js-runtimes node`, latest yt-dlp via `uvx`; old builds return HTTP 403). Cut the exact quote, play it
**unaltered with its own audio**, add a lower-third (name, event, date) and a source line ("स्रोत: <channel>
अधिकृत YouTube चॅनेल · date"), subtitles timed from the official captions. Use the 5–8 s *before* the quote,
muted, under the narrator's introduction so the cut into the quote is continuous.
