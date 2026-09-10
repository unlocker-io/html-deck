#!/usr/bin/env python3
"""Assemble a self-contained HTML deck from a slides fragment.

  build.py --slides mes-slides.html --out mon-deck.html [--title "Titre"] [--extra-css fichier.css]
           [--shoot 1,4,5] [--chrome /chemin/vers/chrome]

The slides file only holds <section class="slide …"> elements. __LOGO__ tokens are replaced by
assets/logo.svg (inline SVG, fill=currentColor). The script refuses a deck above 6 MB and any
image that is not embedded (src without data:).
"""
import argparse, os, re, subprocess, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
MAX_BYTES = 6 * 1024 * 1024

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

def find_chrome(explicit):
    if explicit:
        return explicit
    for pat in (os.path.expanduser('~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome'),
                '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--slides', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--title', default='Deck')
    ap.add_argument('--extra-css', default=None)
    ap.add_argument('--shoot', default=None, help='slide numbers to capture, e.g. 1,4,5')
    ap.add_argument('--chrome', default=None)
    a = ap.parse_args()

    tpl = read(os.path.join(SKILL, 'templates', 'deck-template.html'))
    slides = read(a.slides)
    logo = read(os.path.join(SKILL, 'assets', 'logo.svg')).strip()
    slides = slides.replace('__LOGO__', logo)

    bad = [m.group(0) for m in re.finditer(r'<img[^>]+src="(?!data:)[^"]*"', slides)]
    if bad:
        sys.exit('Images not embedded (src must be a data: URI):\n  ' + '\n  '.join(b[:120] for b in bad))
    if '__IMG__' in slides:
        sys.exit('The slides file still contains __IMG__ tokens: replace them with data: URIs.')
    for token in ('vh', 'vw'):
        if re.search(r'\d' + token + r'\b', slides):
            print(f'WARNING: {token} unit found; the stage is fixed in px.', file=sys.stderr)

    html = (tpl.replace('__TITLE__', a.title)
               .replace('__ENGINE_CSS__', read(os.path.join(SKILL, 'assets', 'engine.css')))
               .replace('__EXTRA_CSS__', read(a.extra_css) if a.extra_css else '')
               .replace('__SLIDES__', slides)
               .replace('__ENGINE_JS__', read(os.path.join(SKILL, 'assets', 'engine.js'))))
    with open(a.out, 'w', encoding='utf-8') as f:
        f.write(html)
    size = os.path.getsize(a.out)
    n = len(re.findall(r'<section\b', slides))
    print(f'{a.out}: {n} slides, {size/1024/1024:.2f} MB')
    if size > MAX_BYTES:
        sys.exit(f'REFUSED: {size/1024/1024:.2f} MB > 6 MB. Shrink images (JPEG, 1600 px max, portraits 112 px).')

    if a.shoot:
        chrome = find_chrome(a.chrome)
        if not chrome:
            sys.exit('Chromium not found: pass --chrome <binary>.')
        outdir = os.path.splitext(a.out)[0] + '-shots'
        os.makedirs(outdir, exist_ok=True)
        url = 'file://' + os.path.abspath(a.out)
        for num in a.shoot.split(','):
            num = num.strip()
            png = os.path.join(outdir, f's{num}.png')
            subprocess.run([chrome, '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                            '--force-prefers-reduced-motion', '--window-size=1600,900',
                            '--virtual-time-budget=4000', f'--screenshot={png}', f'{url}#{num}'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
            print('shot', png)

if __name__ == '__main__':
    main()
