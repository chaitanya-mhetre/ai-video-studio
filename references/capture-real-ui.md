# Capturing the real product

Judges and clients recognise rebuilt "fake" UI. Capture the real one.

## Capture (`scripts/capture.mjs`, puppeteer)

- Viewport 1920×1080 at `deviceScaleFactor: 2`, `fullPage: true` → sharp when the camera zooms 1.6–2×.
- Edit `SHOTS`: `[name, path, {boxKey: "text the card starts with"}]`. The script finds the smallest element whose
  text starts with that label, walks up to the nearest rounded card (>300 px wide) and stores its page box in
  `src/live-layout.json` → highlight boxes land exactly on real cards.
- Login from env (`APP_URL`, `APP_USER`, `APP_PASS`), never hard-coded. Prefer local/staging with seeded fake data.
- **Read-only**: navigate and read; never submit, approve, delete or change settings on a live system. Asking a
  read-only assistant a question (and waiting ~45 s for the answer) is fine.
- **PII**: `SENSITIVE` regexes (IDs, phones, emails, real names) blur matching leaf elements *in the page* before the
  screenshot. Check every capture by eye afterwards — regexes miss things.
- Anything typed on screen (demo credentials in a login scene) is public once the video is. Use a demo account.

## Use (`LiveShot`)

```tsx
<LiveShot src="a453" width={1480}
  cam={[{ f: 0, x: 960, y: 540, z: 1 }, { f: at, x: 960, y: 540, z: 1 }, { f: at + 30, x: 1300, y: 420, z: 1.6 }]}
  boxes={[{ ...box("a453", "fraud"), from: at + 30, color: C.critical }]} />
```
- Camera keys are page coordinates in the 1920×1080 layout + zoom; eased with `EASE_IO`, clamped to page edges.
- Hold wide first (orientation), then push to the area the narration names, on its cue word.
- `project(cam, f, width, px, py)` gives where a page point is on screen — for callouts outside the window.
- Window chrome shows the real domain (`url` prop).
- A cursor, if any, is the last child of the root, in canvas coordinates (see remotion-promo skill).
