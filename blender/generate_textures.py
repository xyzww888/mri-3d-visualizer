#!/usr/bin/env python3
"""
Authentic United Imaging (联影医疗) uMR Omega 3.0T Texture Suite
================================================================
Crafted directly from official uMR Omega studio photography:
  1. uih_brand_decal.png (RGBA Alpha-Mask):
     - 'UNITED IMAGING' + authentic [U] shield emblem (12 o'clock front face)
     - 'uMR Omega' wordmark (upper-left architectural wing)
     - 'uAIFI Inside' wordmark (4 o'clock right cheek)
     - Large minimalist [U] shield emblem (left side cabinet wall)
     Rendered with alphaMode='MASK' so letters sit directly on seamless pure white!
  2. touchscreen_ui.png:
     - Minimalist obsidian black-glass clinical UI matching real uMR Omega side consoles
  3. starlight_canopy.png:
     - Calming ice-blue/white fiber-optic Starlight bore ceiling vault
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
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_uih_shield(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color):
    """
    Draws the authentic United Imaging 'U' geometric shield emblem:
    Vertical left pillar + curved bottom U-bowl + split upper-right block,
    separated by clean transparent architectural precision channels.
    """
    r = w // 2
    # Solid U-shield silhouette
    draw.rectangle([(x, y), (x + w, y + h - r)], fill=color)
    draw.pieslice([(x, y + h - 2 * r), (x + w, y + h)], 0, 180, fill=color)

    # Carve clean transparent U-slot & horizontal upper-right precision notch
    gap = max(3, int(w * 0.13))
    cx = x + w // 2 - gap // 2
    slot_bottom = y + int(h * 0.66)
    draw.rectangle([(cx, y - 2), (cx + gap, slot_bottom)], fill=(0, 0, 0, 0))

    # Horizontal split bar across right half (signature UIH shield detail!)
    hy = y + int(h * 0.34)
    draw.rectangle([(cx, hy), (x + w + 2, hy + gap)], fill=(0, 0, 0, 0))


def generate_uih_brand_decal():
    """
    Generates a 2048x1024 high-DPI RGBA alpha-clipped metallic silver-gray decal atlas:
      - Band 1 (PIL y:  40..320, x:  80..1160): UNITED IMAGING + [U] shield (12 o'clock)
      - Band 2 (PIL y: 400..600, x:  80..1160): uMR Omega (top-left front wing)
      - Band 3 (PIL y: 700..900, x:  80..1160): uAIFI Inside (4 o'clock front cheek)
      - Band 4 (PIL y: 160..860, x: 1480..1960): Large [U] shield (left cabinet side wall)
    """
    w, h = 2048, 1024
    img = Image.new("RGBA", (w, h), (115, 122, 132, 0))
    draw = ImageDraw.Draw(img)

    ink_dark = (96, 103, 114, 255)
    ink_soft = (118, 126, 138, 255)

    # 1. 12 o'clock 'UNITED / IMAGING' + [U] Shield
    f_uih = get_font(92, bold=True)
    b1 = draw.textbbox((0, 0), "UNITED", font=f_uih)
    b2 = draw.textbbox((0, 0), "IMAGING", font=f_uih)
    w1, w2 = b1[2] - b1[0], b2[2] - b2[0]
    right_align_x = 820
    draw.text((right_align_x - w1, 64), "UNITED", fill=ink_dark, font=f_uih)
    draw.text((right_align_x - w2, 172), "IMAGING", fill=ink_dark, font=f_uih)
    draw_uih_shield(draw, x=868, y=72, w=156, h=202, color=ink_dark)

    # 2. Top-left wing 'uMR Omega'
    f_umr_reg = get_font(112, bold=False)
    f_umr_bold = get_font(112, bold=True)
    draw.text((120, 430), "uMR", fill=ink_soft, font=f_umr_reg)
    bm = draw.textbbox((0, 0), "uMR", font=f_umr_reg)
    draw.text((120 + (bm[2] - bm[0]) + 16, 430), "Omega", fill=ink_dark, font=f_umr_bold)

    # 3. Right cheek 'uAIFI Inside'
    f_aifi = get_font(88, bold=True)
    f_ins = get_font(62, bold=False)
    draw.text((120, 740), "uAIFI", fill=ink_dark, font=f_aifi)
    ba = draw.textbbox((0, 0), "uAIFI", font=f_aifi)
    draw.text((120 + (ba[2] - ba[0]) + 22, 764), "Inside", fill=ink_soft, font=f_ins)

    # 4. Large Side-Wall [U] Shield Emblem
    draw_uih_shield(draw, x=1540, y=190, w=320, h=440, color=ink_soft)

    out_path = os.path.join(OUT_DIR, "uih_brand_decal.png")
    img.save(out_path, optimize=True)
    print(f"[Texture] Saved {out_path}")


def generate_touchscreen_ui():
    """
    Generates the sleek, minimalist obsidian-black clinical console UI seen on the
    flush horizontal trapezoidal displays of the real United Imaging uMR Omega 3.0T.
    """
    w, h = 768, 384
    # Pure deep obsidian glass surround so beveled trapezoid edges blend invisibly
    img = Image.new("RGB", (w, h), (8, 10, 14))
    draw = ImageDraw.Draw(img)

    # Active minimalist OLED interface area centered inside the trapezoid
    # Leaves generous pure-black side margins for the curved/slanted trapezoid bounds
    x0, y0, x1, y1 = 128, 36, 640, 348
    draw.rounded_rectangle([(x0, y0), (x1, y1)], radius=10, fill=(14, 18, 25), outline=(32, 40, 54), width=2)

    # Left patient info block (exact minimalist typography from omega_value.jpg!)
    f_name = get_font(26, bold=False)
    f_meta = get_font(14, bold=False)
    f_sm = get_font(12, bold=False)
    f_bold = get_font(13, bold=True)

    draw.text((x0 + 28, y0 + 42), "Jane Doe", fill=(238, 242, 248), font=f_name)
    draw.text((x0 + 28, y0 + 86), "Female / 25Y     31543511434438", fill=(145, 156, 172), font=f_meta)
    draw.text((x0 + 28, y0 + 118), "uMR Omega 3.0T  ·  75cm Starlight  ·  ACS Neuro", fill=(86, 168, 232), font=f_sm)

    # Subtle horizontal divider above bottom touch bar
    bar_y = y1 - 54
    draw.line([(x0 + 2, bar_y), (x1 - 2, bar_y)], fill=(28, 36, 48), width=2)

    # Right vertical EasySense / Coil readiness telemetry pill (matching the green bars in photo!)
    rx0, ry0, rx1, ry1 = x1 - 92, y0 + 24, x1 - 22, bar_y - 18
    draw.rounded_rectangle([(rx0, ry0), (rx1, ry1)], radius=8, fill=(10, 14, 20), outline=(30, 40, 54), width=1)
    draw.text((rx0 + 12, ry0 + 10), "uAIFI", fill=(130, 145, 165), font=f_sm)
    # Dual glowing emerald status bars
    draw.rounded_rectangle([(rx0 + 16, ry0 + 38), (rx0 + 28, ry0 + 108)], radius=4, fill=(22, 48, 36))
    draw.rounded_rectangle([(rx0 + 16, ry0 + 58), (rx0 + 28, ry0 + 108)], radius=4, fill=(34, 197, 94))
    draw.rounded_rectangle([(rx0 + 40, ry0 + 38), (rx0 + 52, ry0 + 108)], radius=4, fill=(22, 48, 36))
    draw.rounded_rectangle([(rx0 + 40, ry0 + 48), (rx0 + 52, ry0 + 108)], radius=4, fill=(34, 197, 94))
    draw.text((rx0 + 11, ry1 - 26), "3.00 T", fill=(180, 215, 245), font=f_bold)

    # Bottom minimalist capacitive touch icon strip
    draw.text((x0 + 20, bar_y + 18), "Jane Doe", fill=(175, 186, 200), font=f_sm)
    draw.text((x0 + 20, bar_y + 33), "75 cm", fill=(110, 125, 145), font=get_font(10))

    # 6 crisp minimalist white/cyan control glyphs centered along bottom bar
    icon_x_start = x0 + 148
    for i in range(6):
        ix = icon_x_start + i * 38
        iy = bar_y + 27
        col = (96, 195, 255) if i in (1, 2) else (190, 200, 214)
        draw.ellipse([(ix - 9, iy - 9), (ix + 9, iy + 9)], outline=col, width=2)
        draw.ellipse([(ix - 2, iy - 2), (ix + 2, iy + 2)], fill=col)

    draw.text((x1 - 92, bar_y + 20), "880 mm", fill=(175, 186, 200), font=f_sm)

    out_path = os.path.join(OUT_DIR, "touchscreen_ui.jpg")
    img.save(out_path, quality=92, optimize=True)
    print(f"[Texture] Saved {out_path}")


def generate_starlight_canopy_texture():
    """
    Generates a serene, light-airy pearl-sky Starlight bore ceiling vault texture
    with delicate fiber-optic pinpoint stars (looks clean in white studio & glows in dark mode).
    """
    w, h = 512, 256
    yy, xx = np.mgrid[0:h, 0:w]
    nx = (xx / w) * 2 - 1
    ny = (yy / h) * 2 - 1
    glow = np.exp(-(nx ** 2 * 1.5 + ny ** 2 * 2.0))

    arr = np.zeros((h, w, 3), dtype=np.float32)
    arr[:, :, 0] = 212 + glow * 32
    arr[:, :, 1] = 232 + glow * 20
    arr[:, :, 2] = 248 + glow * 7

    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    draw = ImageDraw.Draw(img)

    rng = np.random.default_rng(2026)
    for _ in range(130):
        sx = int(rng.uniform(10, w - 10))
        sy = int(rng.uniform(10, h - 10))
        rad = int(rng.choice([1, 1, 2]))
        c = (255, 255, 255) if rng.random() > 0.35 else (125, 215, 255)
        draw.ellipse([(sx - rad, sy - rad), (sx + rad, sy + rad)], fill=c)

    out_path = os.path.join(OUT_DIR, "starlight_canopy.jpg")
    img.save(out_path, quality=92, optimize=True)
    print(f"[Texture] Saved {out_path}")


if __name__ == "__main__":
    for old_f in ("front_badge_plate.png", "bore_acoustic_albedo.png", "bore_acoustic_bump.png",
                  "mattress_albedo.png", "mattress_bump.png", "body_coil_albedo.png",
                  "brushed_metal_roughness.png", "touchscreen_ui.png", "starlight_canopy.png"):
        p = os.path.join(OUT_DIR, old_f)
        if os.path.exists(p):
            os.remove(p)

    generate_uih_brand_decal()
    generate_touchscreen_ui()
    generate_starlight_canopy_texture()
    print("[Texture] Minimalist Apple/UIH uMR Omega textures ready.")
