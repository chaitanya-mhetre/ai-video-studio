"""Voiceover with Gemini TTS, best-of-N takes chosen by Whisper.

For each line in src/vo-lines.json: generate N takes, clean each (high-pass, trim edge silence, -16 LUFS),
transcribe with faster-whisper, keep the take whose transcript best matches the script (ties -> closest to
the target pace). Writes public/vo/<id>.wav and src/voiceover.json ({id: seconds}) which sizes every scene.

vo-lines.json rows: {"id", "spoken", "expect"?, "voice"?, "style"?, "skip_asr"?}
  spoken   text sent to TTS (spell acronyms for the voice: "A.I.", "O.P.D.")
  expect   what Whisper should hear if it differs ("AI", "OPD", digits)
  voice    per-line voice (dialogue: one voice per speaker)
  style    per-line director's note; default STYLE below
  skip_asr true for short dialogue/coaching lines Whisper can't judge — then CHECK BY EAR

Usage: python3 scripts/voice.py [--lang en|mr|hi|...] [--only id,id] [--takes 2] [--voice Charon] [--tempo 1.0] [--fresh]
Needs GEMINI_API_KEY, ffmpeg, uv (for faster-whisper).
"""

import argparse
import base64
import difflib
import json
import re
import subprocess
import sys
import time
import unicodedata
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _env import ROOT, key  # noqa: E402

MODEL = "gemini-3.8-flash-tts"  # check the current TTS model id in Google AI Studio docs
OUT = ROOT / "public" / "vo"
TAKES = ROOT / ".cache" / "vo-takes"
ASR = ["uv", "run", "--no-project", "--quiet", "--python", "3.12", "--with", "faster-whisper", "python"]

STYLE = {
    "en": "A calm, assured documentary narrator. Warm and clear, measured pace, quiet gravitas. "
          "Confident but never salesy; lands each number deliberately. Read exactly this text and nothing else.",
    "mr": "A deep, authoritative Marathi documentary narrator with a resonant baritone. Grave, measured and cinematic, "
          "native Marathi pronunciation, unhurried, with weight on every phrase. Read exactly this text and nothing else.",
    "hi": "A warm, authoritative Hindi documentary narrator. Native Hindi pronunciation, measured and cinematic. "
          "Read exactly this text and nothing else.",
}

CLEAN = (
    "highpass=f=70,"
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,"
    "loudnorm=I=-16:TP=-1.5:LRA=11"
)


def tts(text: str, voice: str, style: str, out: Path) -> None:
    body = {
        "model": MODEL,
        "input": [{"type": "user_input", "content": [{"type": "text", "text": text,
                   "annotations": [{"type": "speech_metadata", "style": style}]}]}],
        "response_format": {"type": "audio", "mime_type": "audio/wav", "sample_rate": 24000},
        "generation_config": {"speech_config": [{"voice": voice}]},
    }
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        data=json.dumps(body).encode(),
        headers={"x-goog-api-key": key(), "Content-Type": "application/json"},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data = json.load(r)
            break
        except Exception as e:  # rate limits / transient
            if attempt == 3:
                raise
            print(f"    retry after {e}", flush=True)
            time.sleep(8 * (attempt + 1))
    audio = data.get("output_audio") or next(
        (c for st in data.get("steps", []) for c in st.get("content", []) if c.get("type") == "audio"), None)
    if not audio:
        sys.exit(f"no audio in response: {json.dumps(data)[:400]}")
    out.write_bytes(base64.b64decode(audio["data"]))


def units(text: str) -> list[str]:
    """Comparison units. Latin: lowercase words. Other scripts: letters + combining marks (Whisper splits Indic words loosely)."""
    if re.search(r"[^\x00-\x7F]", text):
        return [c for c in text if c.isalnum() or unicodedata.category(c).startswith("M")]
    text = text.lower().replace("-", " ")
    text = re.sub(r"\b(\w)\.(?=\w\.)", r"\1", text).replace(".", " ")
    return re.findall(r"[a-z0-9']+", text)


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def transcribe(paths: list[Path], lang: str) -> dict[str, str]:
    # ffmpeg decodes to 16 kHz float32 (faster-whisper's own av decoder breaks in some envs).
    model = "base.en" if lang == "en" else "medium"  # small/base are poor at Indic languages
    code = (
        "import json,sys,subprocess,numpy as np\nfrom faster_whisper import WhisperModel\n"
        f"m=WhisperModel('{model}',device='cpu',compute_type='int8')\n"
        "pcm=lambda p: np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout,np.float32)\n"
        "print(json.dumps({p:' '.join(s.text for s in m.transcribe(pcm(p),language='" + lang + "',beam_size=5)[0]) for p in sys.argv[1:]}))"
    )
    out = subprocess.run([*ASR, "-c", code, *map(str, paths)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout.strip().splitlines()[-1])


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lang", default="en")
    ap.add_argument("--only", default="")
    ap.add_argument("--takes", type=int, default=2)
    ap.add_argument("--voice", default="Charon")
    ap.add_argument("--tempo", type=float, default=1.0, help="atempo on the chosen take; ~1.07 tightens slow English narrators")
    ap.add_argument("--wpm", type=float, default=150, help="target pace for tie-breaks (Latin words/min)")
    ap.add_argument("--fresh", action="store_true")
    args = ap.parse_args()

    lines = json.loads((ROOT / "src" / "vo-lines.json").read_text())
    only = set(filter(None, args.only.split(",")))
    lines = [ln for ln in lines if not only or ln["id"] in only]
    if args.fresh:
        for ln in lines:
            for p in TAKES.glob(f"{ln['id']}-*.wav"):
                p.unlink()
    TAKES.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    for ln in lines:  # takes are cached, so a killed run resumes
        for t in range(args.takes):
            clean = TAKES / f"{ln['id']}-{t}.wav"
            if clean.exists():
                continue
            raw = TAKES / f"{ln['id']}-{t}-raw.wav"
            tts(ln["spoken"], ln.get("voice", args.voice), ln.get("style", STYLE.get(args.lang, STYLE["en"])), raw)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", CLEAN, "-ar", "48000", "-ac", "1", str(clean)], check=True)
            raw.unlink()
            print(f"  generated {ln['id']} take {t}", flush=True)

    checked = [ln for ln in lines if not ln.get("skip_asr")]
    heard = transcribe([TAKES / f"{ln['id']}-{t}.wav" for ln in checked for t in range(args.takes)], args.lang) if checked else {}

    manifest = ROOT / "src" / "voiceover.json"
    durations = json.loads(manifest.read_text()) if manifest.exists() else {}
    threshold = 0.85 if args.lang == "en" else 0.75
    for ln in lines:
        best = None
        for t in range(args.takes):
            p = TAKES / f"{ln['id']}-{t}.wav"
            secs = duration(p)
            target = units(ln.get("expect", ln["spoken"]))
            match = 1.0 if ln.get("skip_asr") else difflib.SequenceMatcher(None, target, units(heard[str(p)])).ratio()
            pace = abs(len(target) / secs * 60 - args.wpm)
            print(f"  {ln['id']} take {t}: match={match:.2f} {secs:.2f}s  heard='{heard.get(str(p), '').strip()}'", flush=True)
            score = (round(match, 2), -pace)
            if best is None or score > best[0]:
                best = (score, p)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(best[1]), "-af", f"atempo={args.tempo}", str(OUT / f"{ln['id']}.wav")], check=True)
        durations[ln["id"]] = round(duration(OUT / f"{ln['id']}.wav"), 3)
        if ln.get("skip_asr"):
            print(f"  ?? {ln['id']} not ASR-checked — listen to {TAKES}/{ln['id']}-*.wav and copy the clean one", flush=True)
        elif best[0][0] < threshold:
            print(f"  !! {ln['id']} best match only {best[0][0]:.2f} — check by ear, reword or add --takes", flush=True)
    manifest.write_text(json.dumps(durations, indent=2) + "\n")


if __name__ == "__main__":
    main()
