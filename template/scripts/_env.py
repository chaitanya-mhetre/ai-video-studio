"""Shared: API key lookup. Reads GEMINI_API_KEY from the environment, else from ./.env in the project root.
The key is only ever sent in the x-goog-api-key header — never in a URL, never printed."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def key(name: str = "GEMINI_API_KEY") -> str:
    if os.environ.get(name):
        return os.environ[name]
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit(f"{name} not set (export it or add it to {env})")
