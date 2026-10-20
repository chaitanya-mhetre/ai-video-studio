"""Word timestamps for public/vo/*.wav -> src/words.json ({id: [[word, start_s], ...]}), used by cue().
English (and other Latin-script) narration only; for Indic scripts cue() falls back to character position.
Usage: python3 scripts/words.py [--lang en]"""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
lang = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "en"
model = "small.en" if lang == "en" else "medium"
code = rf'''
import json,sys,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel('{model}',device='cpu',compute_type='int8')
pcm=lambda p: np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True).stdout,np.float32)
out={{}}
for p in sys.argv[1:]:
    segs,_=m.transcribe(pcm(p),language='{lang}',word_timestamps=True)
    out[p]=[[w.word.strip(),round(w.start,2)] for s in segs for w in s.words]
print(json.dumps(out))
'''
files = [str(p) for p in sorted((ROOT / "public" / "vo").glob("*.wav"))]
r = subprocess.run(["uv", "run", "--no-project", "--quiet", "--python", "3.12", "--with", "faster-whisper", "python", "-c", code, *files], capture_output=True, text=True, check=True)
data = json.loads(r.stdout.strip().splitlines()[-1])
(ROOT / "src" / "words.json").write_text(json.dumps({Path(k).stem: v for k, v in data.items()}, indent=0, ensure_ascii=False))
print("wrote src/words.json for", len(data), "clips")
