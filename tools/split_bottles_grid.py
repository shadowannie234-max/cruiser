"""
Split assets/bottles-grid.png (2x2 bottle collage) into four PNGs.
Run from project root: python tools/split_bottles_grid.py
"""
from pathlib import Path

import sys

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Install Pillow: pip install Pillow")

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
from key_white_background import key_image_rgba

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
GRID = ASSETS / "bottles-grid.png"
NAMES = [
    ("bottle-slate-blue.png", 0, 0),
    ("bottle-sage-green.png", 1, 0),
    ("bottle-dusty-rose.png", 0, 1),
    ("bottle-dark-teal.png", 1, 1),
]


def main() -> None:
    if not GRID.is_file():
        raise SystemExit(f"Missing {GRID} — add your 2x2 bottle collage there first.")
    img = Image.open(GRID).convert("RGBA")
    w, h = img.size
    cw, ch = w // 2, h // 2
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name, gx, gy in NAMES:
        box = (gx * cw, gy * ch, (gx + 1) * cw, (gy + 1) * ch)
        cropped = img.crop(box)
        key_image_rgba(cropped).save(ASSETS / name)
    print(f"Wrote {len(NAMES)} files into {ASSETS}")


if __name__ == "__main__":
    main()
