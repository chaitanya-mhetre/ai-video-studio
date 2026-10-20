"""B-roll with Veo 3.1 image-to-video, animating the Gemini plates (media.json "clips").
Usage: python3 scripts/veo.py [id ...]   (no ids = all missing clips). 8 s, 1080p, 3 in parallel.

Image-to-video (plate first, then animate) keeps the look consistent and lets you approve the frame cheaply
before paying for video. Prompts describe ONE slow camera move + small natural motion; ask for ambient sound only.
If a clip comes back "NO VIDEO" (raiMediaFilteredReasons — often the *audio* filter), reword and retry; after
2-3 failures fall back to scripts/kenburns.sh on the still."""

import base64
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _env import ROOT, key  # noqa: E402

OUT = ROOT / "public" / "broll"
BASE = "https://generativelanguage.googleapis.com/v1beta"
MODEL = "veo-3.1-generate-preview"
CFG = json.loads((ROOT / "media.json").read_text())


def call(url: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"x-goog-api-key": key(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def make(cid: str) -> None:
    clip = CFG["clips"][cid]
    img = base64.b64encode((ROOT / "public" / "img" / f"{clip['plate']}.jpg").read_bytes()).decode()
    op = call(f"{BASE}/models/{MODEL}:predictLongRunning", {
        "instances": [{"prompt": clip["prompt"] + CFG["look_video"], "image": {"bytesBase64Encoded": img, "mimeType": "image/jpeg"}}],
        "parameters": {"aspectRatio": CFG.get("aspect", "16:9"), "resolution": "1080p", "durationSeconds": 8, "personGeneration": "allow_adult"},
    })
    print(f"{cid}: started", flush=True)
    while True:
        time.sleep(12)
        st = call(f"{BASE}/{op['name']}")
        if st.get("done"):
            break
    if "error" in st:
        print(f"{cid}: ERROR {st['error']}", flush=True)
        return
    res = st["response"]["generateVideoResponse"]
    if not res.get("generatedSamples"):
        print(f"{cid}: NO VIDEO {json.dumps(res)[:400]}", flush=True)
        return
    req = urllib.request.Request(res["generatedSamples"][0]["video"]["uri"], headers={"x-goog-api-key": key()})
    with urllib.request.urlopen(req, timeout=300) as r:
        (OUT / f"{cid}.mp4").write_bytes(r.read())
    print(f"{cid}: done", flush=True)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    ids = sys.argv[1:] or [c for c in CFG["clips"] if not (OUT / f"{c}.mp4").exists()]
    with ThreadPoolExecutor(3) as ex:
        list(ex.map(make, ids))
