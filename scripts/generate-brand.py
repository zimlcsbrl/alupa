"""Generate A Lupa's code-native artwork. Requires Pillow and fontTools.

Run from any directory: python scripts/generate-brand.py
Uses locally installed Georgia/Arial; no font binaries are distributed.
"""
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "apps/web/public"
BRAND = PUBLIC / "brand"
APP = ROOT / "apps/web/src/app"
BRAND.mkdir(parents=True, exist_ok=True)
FONTS = Path(os.environ.get("ALUPA_FONT_DIR", "C:/Windows/Fonts"))
GREEN, PAPER, YELLOW = "#245744", "#F7F5EF", "#E9C45A"

def symbol(color=GREEN, accent=YELLOW):
    return f'<circle cx="42" cy="42" r="27" fill="none" stroke="{color}" stroke-width="10"/><path d="M62 62L84 84" stroke="{color}" stroke-width="12" stroke-linecap="round"/><circle cx="42" cy="42" r="8" fill="{accent}"/>'

def svg(body, width, height, label):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{label}">{body}</svg>\n'

font = TTFont(FONTS / "georgiab.ttf")
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = 67 / font["head"].unitsPerEm
x = 0
paths = []
for char in "A Lupa":
    name = cmap[ord(char)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    paths.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
    x += glyphs[name].width
wordmark = f'<g transform="translate(112 72) scale({scale} {-scale})">{"".join(paths)}</g>'
for name, color, accent in [("logo", GREEN, YELLOW), ("logo-inverse", PAPER, YELLOW), ("logo-mono", GREEN, GREEN)]:
    (BRAND / f"{name}.svg").write_text(svg(symbol(color, accent) + f'<g fill="{color}">{wordmark}</g>', 390, 100, "A Lupa"), encoding="utf-8")
(BRAND / "symbol.svg").write_text(svg(symbol(), 100, 100, "A Lupa"), encoding="utf-8")
(APP / "icon.svg").write_text(svg(f'<rect width="100" height="100" rx="22" fill="{GREEN}"/>' + symbol(PAPER), 100, 100, "A Lupa"), encoding="utf-8")

def draw_symbol(draw, ox, oy, size, color=PAPER):
    def box(values):
        return tuple((ox if i % 2 == 0 else oy) + v * size / 100 for i, v in enumerate(values))
    w = round(size * .10)
    draw.ellipse(box((10, 10, 74, 74)), outline=color, width=w)
    draw.line(box((62, 62, 84, 84)), fill=color, width=round(size * .12))
    for cx, cy in [(62, 62), (84, 84)]:
        draw.ellipse(box((cx-6, cy-6, cx+6, cy+6)), fill=color)
    draw.ellipse(box((34, 34, 50, 50)), fill=YELLOW)

base = Image.new("RGB", (1024, 1024), GREEN)
draw_symbol(ImageDraw.Draw(base), 154, 154, 716)
for size in [192, 512]:
    base.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / f"icon-{size}.png")
base.resize((180, 180), Image.Resampling.LANCZOS).save(APP / "apple-icon.png")
favicon = Image.new("RGBA", (256, 256), GREEN)
draw_symbol(ImageDraw.Draw(favicon), 10, 10, 236)
favicon.save(APP / "favicon.ico", sizes=[(16,16), (32,32), (48,48), (64,64)])

# Social image: generous margins and large, readable editorial typography.
og = Image.new("RGB", (2400, 1260), PAPER)
d = ImageDraw.Draw(og)
def text(x, y, value, size, face="georgia.ttf", fill=GREEN):
    d.text((x*2, y*2), value, font=ImageFont.truetype(str(FONTS / face), size*2), fill=fill)
d.rectangle((0, 0, 24, 1260), fill=GREEN)
draw_symbol(d, 128, 100, 128, GREEN)
text(145, 51, "A Lupa", 42, "georgiab.ttf")
text(68, 183, "O público é da", 76)
d.rectangle((128, 568, 1320, 758), fill=YELLOW)
text(68, 282, "nossa conta.", 76)
text(70, 429, "Informação para entender,", 29, "arial.ttf")
text(70, 469, "conferir e cobrar.", 29, "arial.ttf")
d.line((140, 1090, 2260, 1090), fill="#DDDAD1", width=2)
text(70, 565, "DADOS PÚBLICOS. PERGUNTAS ABERTAS.", 17, "arial.ttf")
text(968, 558, "alupa.app", 25, "arial.ttf")
draw_symbol(d, 1650, 380, 510, GREEN)
og.resize((1200,630), Image.Resampling.LANCZOS).save(PUBLIC / "og.png", optimize=True)
print("Brand assets generated.")
