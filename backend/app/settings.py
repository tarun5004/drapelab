from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
DATA_DIR = Path(os.getenv("DRAPELAB_DATA_DIR", ROOT / ".drapelab"))
GEMINI_MODEL = os.getenv("DRAPELAB_GEMINI_MODEL", "gemini-3.1-flash-image")
