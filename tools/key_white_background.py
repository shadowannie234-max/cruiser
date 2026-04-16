"""
Make near-white pixels transparent on bottle PNGs (studio white background).
Run from project root: python tools/key_white_background.py
Can be imported: key_image_rgba(img, white_distance=...) -> Image
"""
from __future__ import annotations

import math
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Install Pillow: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FILES = [
    "bottle-slate-blue.png",
    "bottle-sage-green.png",
    "bottle-dusty-rose.png",
    "bottle-dark-teal.png",
    "bottle-tide-wide.png",
    "bottle-cruiser-glass.png",
]

# Default distance from pure white (RGB) to treat as background
WHITE_DISTANCE = 42
# Stronger key for assets that keep a light fringe on colored backgrounds
FILE_WHITE_DISTANCE = {
    "bottle-cruiser-glass.png": 58,
}


def key_pixel(
    r: int, g: int, b: int, a: int, d_max: float
) -> tuple[int, int, int, int]:
    if a == 0:
        return r, g, b, 0
    d = math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2)
    if d >= d_max:
        return r, g, b, a
    t = d_max * 0.55
    if d <= t:
        return r, g, b, 0
    fade = (d - t) / (d_max - t)
    return r, g, b, int(round(a * fade))


def key_image_rgba(
    im: Image.Image, *, white_distance: float | None = None
) -> Image.Image:
    d_max = white_distance if white_distance is not None else WHITE_DISTANCE
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            px[x, y] = key_pixel(r, g, b, a, d_max)
    return im


def process(path: Path) -> None:
    d_max = FILE_WHITE_DISTANCE.get(path.name, WHITE_DISTANCE)
    im = key_image_rgba(Image.open(path), white_distance=d_max)
    im.save(path, optimize=True)
    print(f"Keyed {path.name} (distance={d_max})")


def main() -> None:
    for name in FILES:
        p = ASSETS / name
        if not p.is_file():
            raise SystemExit(f"Missing {p}")
        process(p)


if __name__ == "__main__":
    main()
