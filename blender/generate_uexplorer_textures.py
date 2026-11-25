#!/usr/bin/env python3
"""
United Imaging uEXPLORER (Total-Body PET/CT) & uCT 960+ Cloud Blender Texture Generator
=======================================================================================
Run in your Cloud Blender / Python environment before `build_uexplorer.py`:
    python blender/generate_uexplorer_textures.py

Outputs into `blender/textures/`:
  1. uih_uexplorer_decal.png  — 2048x1024 RGBA Alpha-Clipped silver metallic wordmarks:
       Band 1: 'UNITED IMAGING' + [U] shield emblem (12 o'clock front medallion)
       Band 2: 'uEXPLORER' wordmark (upper-left architectural wing)
       Band 3: 'uCT 960+' wordmark (for --ct-only standalone CT derivation)
       Band 4: Large [U] shield emblem (left architectural cabinet wall)
  2. uexplorer_touchscreen_ui.jpg — Obsidian-black 4-panel clinical PET/CT UI
  3. starlight_canopy.jpg — Illuminated 76cm bore ambient sky vault
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "textures")
os.makedirs(OUT_DIR, exist_ok=True)


def get_font(size: int, bold: bool = False):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_uih_shield(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color):
    r = w // 2
    draw.rectangle([(x, y), (x + w, y + h - r)], fill=color)
    draw.pieslice([(x, y + h - 2 * r), (x + w, y + h)], 0, 180, fill=color)
    gap = max(3, int(w * 0.13))
    cx = x + w // 2 - gap // 2
    slot_bottom = y + int(h * 0.66)
    draw.rectangle([(cx, y - 2), (cx + gap, slot_bottom)], fill=(0, 0, 0, 0))
    hy = y + int(h * 0.34)
    draw.rectangle([(cx, hy), (x + w + 2, hy + gap)], fill=(0, 0, 0, 0))


def generate_decal_atlas():
    w, h = 2048, 1024
    img = Image.new("RGBA", (w, h), (115, 122, 132, 0))
    draw = ImageDraw.Draw(img)

    ink_dark = (94, 101, 112, 255)
    ink_soft = (118, 126, 138, 255)

    # Band 1: UNITED IMAGING + [U] Shield
    f_uih = get_font(90, bold=True)
    b1 = draw.textbbox((0, 0), "UNITED", font=f_uih)
    b2 = draw.textbbox((0, 0), "IMAGING", font=f_uih)
    right_x = 820
    draw.text((right_x - (b1[2] - b1[0]), 64), "UNITED", fill=ink_dark, font=f_uih)
    draw.text((right_x - (b2[2] - b2[0]), 172), "IMAGING", fill=ink_dark, font=f_uih)
    draw_uih_shield(draw, x=868, y=72, w=156, h=202, color=ink_dark)

    # Band 2: uEXPLORER
    f_reg = get_font(106, bold=False)
    f_bold = get_font(106, bold=True)
    draw.text((110, 430), "u", fill=ink_soft, font=f_reg)
    bu = draw.textbbox((0, 0), "u", font=f_reg)
    draw.text((110 + (bu[2] - bu[0]) + 6, 430), "EXPLORER", fill=ink_dark, font=f_bold)

    # Band 3: uCT 960+
    draw.text((110, 735), "uCT", fill=ink_soft, font=f_reg)
    bc = draw.textbbox((0, 0), "uCT", font=f_reg)
    draw.text((110 + (bc[2] - bc[0]) + 18, 735), "960+", fill=ink_dark, font=f_bold)

    # Band 4: Large Side-Wall [U] Shield
    draw_uih_shield(draw, x=1540, y=190, w=320, h=440, color=ink_soft)

    out_path = os.path.join(OUT_DIR, "uih_uexplorer_decal.png")
    img.save(out_path, optimize=True)
    print(f"[Texture] Saved {out_path}")


def generate_touchscreen_ui():
    w, h = 768, 384
    img = Image.new("RGB", (w, h), (8, 10, 14))
    draw = ImageDraw.Draw(img)

    x0, y0, x1, y1 = 124, 34, 644, 350
    draw.rounded_rectangle([(x0, y0), (x1, y1)], radius=10, fill=(13, 18, 26), outline=(34, 46, 62), width=2)

    draw.text((x0 + 26, y0 + 38), "Total-Body Dynamic 4D", fill=(238, 244, 250), font=get_font(24, bold=True))
    draw.text((x0 + 26, y0 + 82), "194 cm AFOV  ·  505 ps TOF  ·  160-Slice CT", fill=(86, 188, 248), font=get_font(14))
    draw.text((x0 + 26, y0 + 114), "76 cm Bore  ·  8 Rings / 564,480 LYSO", fill=(142, 156, 174), font=get_font(13))

    bar_y = y1 - 52
    draw.line([(x0 + 2, bar_y), (x1 - 2, bar_y)], fill=(28, 38, 52), width=2)
    for i in range(6):
        ix = x0 + 140 + i * 40
        iy = bar_y + 26
        col = (56, 189, 248) if i in (1, 3) else (190, 202, 218)
        draw.ellipse([(ix - 9, iy - 9), (ix + 9, iy + 9)], outline=col, width=2)

    out_path = os.path.join(OUT_DIR, "uexplorer_touchscreen_ui.jpg")
    img.save(out_path, quality=92, optimize=True)
    print(f"[Texture] Saved {out_path}")


def generate_starlight_canopy():
    w, h = 512, 256
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx / w) * 2 - 1
    ny = (yy / h) * 2 - 1
    glow = np.exp(-(nx ** 2 * 1.4 + ny ** 2 * 1.9))
    arr = np.zeros((h, w, 3), dtype=np.float32)
    arr[:, :, 0] = 210 + glow * 34
    arr[:, :, 1] = 232 + glow * 20
    arr[:, :, 2] = 250 + glow * 5
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    draw = ImageDraw.Draw(img)
    rng = np.random.default_rng(2026)
    for _ in range(140):
        sx, sy = int(rng.uniform(8, w - 8)), int(rng.uniform(8, h - 8))
        r = int(rng.choice([1, 1, 2]))
        c = (255, 255, 255) if rng.random() > 0.35 else (120, 215, 255)
        draw.ellipse([(sx - r, sy - r), (sx + r, sy + r)], fill=c)
    out_path = os.path.join(OUT_DIR, "starlight_canopy.jpg")
    img.save(out_path, quality=92, optimize=True)
    print(f"[Texture] Saved {out_path}")


if __name__ == "__main__":
    generate_decal_atlas()
    generate_touchscreen_ui()
    generate_starlight_canopy()
    print("[Texture] uEXPLORER & uCT cloud textures ready.")
