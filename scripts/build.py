#!/usr/bin/env python3
"""Assemble a self-contained HTML deck from a slides fragment.

  build.py --slides mes-slides.html --out mon-deck.html [--title "Titre"] [--extra-css fichier.css]
           [--shoot 1,4,5] [--chrome /chemin/vers/chrome]

The slides file only holds <section class="slide …"> elements. __LOGO__ tokens are replaced by
assets/logo.svg (inline SVG, fill=currentColor). The script refuses a deck above 6 MB and any
image that is not embedded (src without data:). --shoot drives Chromium over the DevTools
protocol (remote-debugging-pipe) and waits for document.fonts.ready plus a short settle before
capturing each slide, so SVG charts and web fonts are never rasterised mid-layout.
"""
import argparse, base64, json, os, re, select, signal, sys, glob, time

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)
MAX_BYTES = 6 * 1024 * 1024
SLIDE_TIMEOUT = 60

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

def _fork_chrome_pipe(chrome, extra_args):
    """Launch Chromium with fd 3 (commands in) / fd 4 (responses out) wired to a fresh pipe pair.
    Chromium's own stdout/stderr are redirected to /dev/null (it logs there directly, e.g.
    page-load-metrics warnings, which would otherwise leak into the caller's terminal)."""
    cmd_r, cmd_w = os.pipe()   # we write commands to cmd_w; Chromium reads cmd_r on fd 3
    evt_r, evt_w = os.pipe()   # Chromium writes responses to evt_w on fd 4; we read evt_r
    os.set_inheritable(cmd_r, True)
    os.set_inheritable(evt_w, True)
    pid = os.fork()
    if pid == 0:
        try:
            devnull = os.open(os.devnull, os.O_WRONLY)
            os.dup2(devnull, 1)
            os.dup2(devnull, 2)
            if devnull not in (1, 2):
                os.close(devnull)
            os.dup2(cmd_r, 3)
            os.dup2(evt_w, 4)
            for fd in (cmd_r, cmd_w, evt_r, evt_w):
                if fd not in (3, 4):
                    os.close(fd)
            os.execvp(chrome, [chrome] + extra_args)
        except Exception:
            pass
        os._exit(127)
    os.close(cmd_r)
    os.close(evt_w)
    return pid, cmd_w, evt_r

class CDP:
    """Minimal DevTools protocol client over a --remote-debugging-pipe fd pair (stdlib only)."""

    def __init__(self, chrome):
        args = ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
                '--force-prefers-reduced-motion', '--remote-debugging-pipe']
        self.pid, self._w, self._r = _fork_chrome_pipe(chrome, args)
        self._buf = b''
        self._next_id = 0

    def _read_one(self, deadline):
        while b'\x00' not in self._buf:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError('Chromium did not respond over the DevTools pipe in time.')
            ready, _, _ = select.select([self._r], [], [], remaining)
            if not ready:
                continue
            chunk = os.read(self._r, 1 << 16)
            if not chunk:
                raise RuntimeError(f'Chromium closed the DevTools pipe unexpectedly ({self._exitcode()}).')
            self._buf += chunk
        raw, self._buf = self._buf.split(b'\x00', 1)
        return json.loads(raw)

    def _exitcode(self):
        try:
            pid, status = os.waitpid(self.pid, os.WNOHANG)
            return f'exit status {status}' if pid else 'still running'
        except ChildProcessError:
            return 'already reaped'

    def send(self, method, params=None, session_id=None):
        self._next_id += 1
        msg = {'id': self._next_id, 'method': method, 'params': params or {}}
        if session_id:
            msg['sessionId'] = session_id
        os.write(self._w, json.dumps(msg).encode('utf-8') + b'\x00')
        return self._next_id

    def call(self, method, params=None, session_id=None, deadline=None):
        deadline = deadline if deadline is not None else time.monotonic() + SLIDE_TIMEOUT
        want_id = self.send(method, params, session_id)
        while True:
            msg = self._read_one(deadline)
            if msg.get('id') == want_id and msg.get('sessionId') == session_id:
                if 'error' in msg:
                    raise RuntimeError(f'{method} failed: {msg["error"]}')
                return msg.get('result', {})

    def navigate_and_wait(self, session_id, url, deadline):
        want_id = self.send('Page.navigate', {'url': url}, session_id=session_id)
        navigated = loaded = False
        while not (navigated and loaded):
            msg = self._read_one(deadline)
            if msg.get('sessionId') != session_id:
                continue
            if msg.get('id') == want_id:
                if 'error' in msg:
                    raise RuntimeError(f'Page.navigate failed: {msg["error"]}')
                navigated = True
            elif msg.get('method') == 'Page.loadEventFired':
                loaded = True

    def evaluate(self, session_id, expression, deadline):
        result = self.call('Runtime.evaluate',
                            {'expression': expression, 'awaitPromise': True, 'returnByValue': True},
                            session_id=session_id, deadline=deadline)
        if result.get('exceptionDetails'):
            raise RuntimeError(f'page script failed: {result["exceptionDetails"]}')
        return result.get('result', {}).get('value')

    def close(self):
        try:
            self.call('Browser.close', deadline=time.monotonic() + 5)
        except Exception:
            pass
        try:
            os.kill(self.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            for _ in range(50):
                pid, _ = os.waitpid(self.pid, os.WNOHANG)
                if pid:
                    break
                time.sleep(0.1)
            else:
                os.kill(self.pid, signal.SIGKILL)
                os.waitpid(self.pid, 0)
        except ChildProcessError:
            pass
        for fd in (self._w, self._r):
            try:
                os.close(fd)
            except OSError:
                pass

FONTS_SETTLED_JS = (
    "(async () => {"
    " await document.fonts.ready;"
    " await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));"
    " await new Promise(r => setTimeout(r, 300));"
    " return true;"
    " })()"
)

# Generic, family-agnostic check evaluated after the settle above: warn only when NO face ever
# reached 'loaded', or when any face is in 'error'. Google's stylesheet declares many unicode-range
# subsets that legitimately stay 'unloaded' (their ranges are never used on the page) — that is
# normal and must not warn.
FONTS_STATUS_JS = (
    "(() => {"
    " const faces = Array.from(document.fonts);"
    " return {"
    "   hasLoaded: faces.some(f => f.status === 'loaded'),"
    "   hasError: faces.some(f => f.status === 'error'),"
    " };"
    " })()"
)

def shoot_slides(chrome, url, nums, outdir):
    cdp = CDP(chrome)
    try:
        for num in nums:
            deadline = time.monotonic() + SLIDE_TIMEOUT
            target_id = cdp.call('Target.createTarget', {'url': 'about:blank'}, deadline=deadline)['targetId']
            try:
                session_id = cdp.call('Target.attachToTarget', {'targetId': target_id, 'flatten': True},
                                       deadline=deadline)['sessionId']
                cdp.call('Page.enable', session_id=session_id, deadline=deadline)
                cdp.call('Emulation.setDeviceMetricsOverride',
                         {'width': 1600, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False},
                         session_id=session_id, deadline=deadline)
                cdp.call('Emulation.setEmulatedMedia',
                         {'features': [{'name': 'prefers-reduced-motion', 'value': 'reduce'}]},
                         session_id=session_id, deadline=deadline)
                cdp.navigate_and_wait(session_id, f'{url}#{num}', deadline)
                cdp.evaluate(session_id, FONTS_SETTLED_JS, deadline)
                status = cdp.evaluate(session_id, FONTS_STATUS_JS, deadline)
                if not status['hasLoaded'] or status['hasError']:
                    print(f'WARNING: slide {num}: web fonts did not load; capture uses a fallback font.',
                          file=sys.stderr)
                shot = cdp.call('Page.captureScreenshot', {'format': 'png'}, session_id=session_id, deadline=deadline)
                png = os.path.join(outdir, f's{num}.png')
                with open(png, 'wb') as f:
                    f.write(base64.b64decode(shot['data']))
                print('shot', png)
            finally:
                try:
                    cdp.call('Target.closeTarget', {'targetId': target_id}, deadline=time.monotonic() + 5)
                except Exception:
                    pass  # don't mask an earlier error in this slide's capture
    finally:
        cdp.close()

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
        nums = [n.strip() for n in a.shoot.split(',')]
        try:
            shoot_slides(chrome, url, nums, outdir)
        except Exception as e:
            sys.exit(f'Screenshot capture failed: {e}')

if __name__ == '__main__':
    main()
