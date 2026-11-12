"""Generates the card art, page banners and carousel images in images/art/.

Run from the project root: python scripts/generate-art.py  (requires Pillow).
Only uses artwork that already lives in this repository.
"""
import random
from PIL import Image, ImageDraw, ImageFilter

OUT = 'images/art'

SECTIONS = {
    # name: (top colour, bottom colour, centre, left, right)
    'bloques': ((52, 120, 36), (10, 28, 8), 'images/diamante.webp', 'images/oro.webp', 'images/redstone.webp'),
    'mobs': ((120, 30, 30), (22, 6, 6), 'images/mobs/creeper.png', 'images/mobs/zombie.png', 'images/mobs/enderman.png'),
    'crafteos': ((150, 98, 48), (38, 22, 10), 'images/madera.webp', 'images/piedra.webp', 'images/cofre.webp'),
    'alquimia': ((96, 48, 150), (20, 8, 36), 'images/amatista.png', 'images/lapizlazuli.webp', 'images/redstone.webp'),
}


def gradient(size, top, bottom):
    w, h = size
    img = Image.new('RGB', size)
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(w):
            px[x, y] = c
    return img


def grain(img, seed, strength=10):
    rnd = random.Random(seed)
    px = img.load()
    block = 8
    for by in range(0, img.height, block):
        for bx in range(0, img.width, block):
            d = rnd.randint(-strength, strength)
            for y in range(by, min(by + block, img.height)):
                for x in range(bx, min(bx + block, img.width)):
                    r, g, b = px[x, y]
                    px[x, y] = (max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d)))
    return img


def load(path, size):
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').getbbox()
    if box:
        im = im.crop(box)
    im.thumbnail((size, size), Image.LANCZOS)
    return im


def shadow(canvas, im, pos, blur=14, opacity=140):
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, opacity))
    sh.putalpha(im.getchannel('A').point(lambda a: a * opacity // 255))
    layer.paste(sh, (pos[0] + 10, pos[1] + 14), sh)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def place(canvas, im, cx, bottom):
    pos = (int(cx - im.width / 2), int(bottom - im.height))
    shadow(canvas, im, pos)
    canvas.alpha_composite(im, pos)


def glow(canvas, cx, cy, radius, colour):
    layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=colour + (90,))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(radius // 2)))


def square(name):
    top, bottom, centre, left, right = SECTIONS[name]
    s = 640
    canvas = grain(gradient((s, s), top, bottom), hash(name) & 0xFFFF).convert('RGBA')
    glow(canvas, s // 2, s // 2, 230, tuple(min(255, c + 70) for c in top))
    # Mobs are tall figures, so they need a bigger bounding box than blocks.
    side, middle = (330, 470) if name == 'mobs' else (230, 380)
    place(canvas, load(left, side), 140, 540)
    place(canvas, load(right, side), 500, 540)
    place(canvas, load(centre, middle), 320, 590)
    canvas.convert('RGB').save(f'{OUT}/card-{name}.webp', quality=82, method=6)


def banner(name):
    top, bottom, centre, left, right = SECTIONS[name]
    w, h = 1600, 420
    canvas = grain(gradient((w, h), top, bottom), hash(name + 'b') & 0xFFFF).convert('RGBA')
    glow(canvas, w // 2, h // 2, 300, tuple(min(255, c + 60) for c in top))
    big = 1.6 if name == 'mobs' else 1
    items = [(left, 190, 140), (right, 230, 480), (centre, 260, 800), (left, 170, 1120), (right, 200, 1420)]
    items = [(path, int(size * big), cx) for path, size, cx in items]
    for path, size, cx in items:
        place(canvas, load(path, size), cx, h - 40)
    canvas.convert('RGB').save(f'{OUT}/banner-{name}.webp', quality=78, method=6)


def photo(src, name, crop_h=420):
    im = Image.open(src).convert('RGB')
    w = 1600
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    top = max(0, (im.height - crop_h) // 2)
    im.crop((0, top, w, top + crop_h)).save(f'{OUT}/banner-{name}.webp', quality=74, method=6)


def slide(src, name):
    im = Image.open(src).convert('RGB')
    w, h = 1600, 760
    scale = max(w / im.width, h / im.height)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    im = im.crop((x, y, x + w, y + h))
    im.save(f'{OUT}/slide-{name}.webp', quality=72, method=6)
    thumb = im.copy()
    thumb.thumbnail((200, 120), Image.LANCZOS)
    thumb.save(f'{OUT}/thumb-{name}.webp', quality=70, method=6)


if __name__ == '__main__':
    for n in SECTIONS:
        square(n)
        banner(n)
    photo('images/comunidad/jardin.webp', 'comunidad')
    photo('images/jugar/fondo.jpg', 'jugar')
    slide('images/hero-bg.webp', 'cuevas')
    slide('images/jugar/fondo.jpg', 'paisaje')
    slide('images/comunidad/jardin.webp', 'jardin')
