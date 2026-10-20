# Render and QA

## 1. QA stills while building (cheap, do it after every scene)

```bash
npx tsx scripts/qa-frames.ts live offline        # → "live-a:5021 live-b:5402 offline-a:… " (40% in, 1 s before end)
node scripts/stills.mjs Film out/qa $(npx tsx scripts/qa-frames.ts live offline)
node scripts/stills.mjs Film out/qa live-call:5100   # any name:frame
scripts/contact-sheet.sh out/qa/sheet.jpg out/qa/*.jpg
```
`stills.mjs` bundles once and renders many frames at 0.5 scale — seconds per frame instead of a full render.
Look at the sheet (Read the image). Check: text clipped or overflowing, Devanagari matras cut, empty frames, wrong
scene at a cue, placeholder assets left in, unblurred personal data, real logos where there shouldn't be any,
legibility at 480 px.

## 2. Full render

```bash
# 1080p
npx remotion render src/index.ts Film out/film.mp4 --concurrency=5 --offthreadvideo-cache-size-in-bytes=536870912
# 720p (≈2× faster, used for the 7:50 Marathi film)
npx remotion render src/index.ts Film out/film-720p.mp4 --scale=0.6666666666666666 --concurrency=5 \
  --offthreadvideo-cache-size-in-bytes=536870912
# no music
… --props='{"bgm":false}'
scripts/master.sh out/film-720p.mp4 out/film-720p-master.mp4
scripts/check.sh out/film-720p-master.mp4
```
`remotion.config.ts`: jpeg frames q95, h264, CRF 16, overwrite on.

Gotchas:
- `--scale=0.6667` gives 1280.06 → non-integer height error. Use the full `0.6666666666666666`.
- **OOM kills** on long films with many `OffthreadVideo`s at 1080p: lower `--concurrency` (5 → 3), cap the
  offthread cache (512 MB), close other heavy processes, or render 720p.
- Other CPU hogs (a parallel build) can halve render speed — check `top` before a long render.
- Long renders: run in the background and wait on the PID (`tail --pid=<pid> -f /dev/null`), don't poll with a
  `pgrep` pattern that matches your own shell.
- Budget render time: a multi-minute film with many video layers takes tens of minutes at 1080p on a laptop; 720p cuts it substantially.

## 3. Final checks

1. `check.sh`: resolution, fps 30, h264, duration ≈ `TOTAL_FRAMES/30`, −14 LUFS, peak ≤ −1.
2. 1-fps strip of the final file → contact sheets → look at every frame of the delivery, not the Studio.
   `ffmpeg -i out/film.mp4 -vf fps=1,scale=480:-2 out/strip/%04d.jpg`
3. Listen to: the first 30 s, every dialogue scene, every music change, the end.
4. **Independent review:** spawn a fresh subagent with only the MP4/strips, the brief, the storyboard and the hard
   rules — not your reasoning — and ask for frame-numbered must-fix issues. Fix, re-render, repeat until empty.
5. Report honestly: what you watched/listened to and what you didn't.
