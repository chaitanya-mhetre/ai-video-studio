"""Photographic plates with Gemini image generation, from media.json "plates".
Usage: python3 scripts/images.py [id ...]   (no ids = all missing plates; pass ids to regenerate)

Prompt rules that worked: describe the shot like a cinematographer (lens, light, camera height), add the shared
LOOK suffix for a consistent grade, ban text/logos/watermarks, keep phone screens facing away (no fake UI to
proofread), and never name real people — generate generic, era/region-correct people instead."""

import base64
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _env import ROOT, key  # noqa: E402

OUT = ROOT / "public" / "img"
MODEL = "gemini-3-pro-image"  # higher quality; gemini-3.1-flash-image is cheaper/faster for drafts


def gen(pid: str, plate: dict, cfg: dict) -> None:
    look = cfg["look_people"] if plate.get("people") else cfg["look_image"]
    body = {
        "contents": [{"parts": [{"text": plate["prompt"] + look}]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": cfg.get("aspect", "16:9"), "imageSize": "2K"}},
    }
    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": key(), "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    for part in data["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            # Always .jpg: Veo's image-to-video wants a known mime; Gemini may return PNG or JPEG bytes.
            raw = OUT / f"{pid}.raw"
            raw.write_bytes(base64.b64decode(part["inlineData"]["data"]))
            import subprocess
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-q:v", "2", str(OUT / f"{pid}.jpg")], check=True)
            raw.unlink()
            print("wrote", pid, flush=True)
            return
    print("no image for", pid, json.dumps(data)[:300], flush=True)


if __name__ == "__main__":
    cfg = json.loads((ROOT / "media.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    ids = sys.argv[1:] or [p for p in cfg["plates"] if not (OUT / f"{p}.jpg").exists()]
    for pid in ids:
        gen(pid, cfg["plates"][pid], cfg)
