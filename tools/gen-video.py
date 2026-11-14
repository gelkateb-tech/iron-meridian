"""Generates the explosion video clips with the Gemini API (Gemini Omni 1.2 Flash, 720p, no sound, about 5 s) into
assets/art-src/fxv-<name>.mp4, and turns them into map sprite sheets (assets/art/fxv-<name>.webp + fxv-sheets.json).

CLIPS: one prompt per clip (nuclear, chemical, conventional, cruise): seen from straight above, a plain black background,
no ground, no text, a still camera. One try per clip, never an automatic retry: a clip that already exists is not sent
again unless --force is given. Every call is logged with model, clip, video length, tokens and estimated cost in
assets/art-src/gen-art-log.jsonl (the same log as tools/gen-art.py; rows with "kind": "video"; --cost sums them).
Before a call the logged video total plus this call's worst case must stay under BUDGET, or nothing is sent.

Request shape: generateContent answers "This model only supports Interactions API", so the clip is asked from
POST v1beta/interactions: {model, input: <prompt>, response_modalities: ["video"] (no "audio": no sound),
response_format: {type: "video", resolution: "720p", aspect_ratio: "16:9" (the only choices are 16:9 and 9:16), duration: "5s",
delivery: "inline"}, generation_config: {video_config: {task: "text_to_video"}}, background: true, store: true}, then
GET v1beta/interactions/<id> until it is done. (Field names found with free requests that the API rejects before generating:
it names unknown parameters and lists the allowed values.) The model adds a sound track anyway: the original is kept as it
came (its content-credentials metadata included); --silent <clip> <out.mp4> writes a copy without sound (video stream copied, not re-encoded).

The API key is never read, printed or stored here: the session's network proxy adds it to every request to
generativelanguage.googleapis.com (header x-goog-api-key). Run elsewhere, set GEMINI_API_KEY and it is sent in that header.

usage: python3 -I tools/gen-video.py <clip> [<clip> ...]      send the clips (paid; one try each)
       python3 -I tools/gen-video.py --print | --count | --model | --cost   (free)
       python3 -I tools/gen-video.py --sheet [<clip> ...]      sprite sheets from the saved clips (no API call)
       python3 -I tools/gen-video.py --collect <clip> <interaction id>   save a clip sent earlier (no new generation)
       python3 -I tools/gen-video.py --silent <clip> <out.mp4>    a copy of a clip without its sound track
       python3 -I tools/gen-video.py --from-raw <clip> <reply.json>   the same from a raw reply kept on disk (no API call)
options: --force   send a clip again although it exists (a second paid try: only when the owner asks)
         --raw <dir>  where the raw JSON replies are kept (default: the system temp folder)
Needs ffmpeg/ffprobe on the PATH for --sheet and for the length of a clip; numpy + PIL for --sheet.
"""
import sys, os, json, base64, time, tempfile, subprocess, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'art-src')
ART = os.path.join(ROOT, 'assets', 'art')
MODEL = 'gemini-omni-1.2-flash'   # "Gemini Omni 1.2 Flash"
API = 'https://generativelanguage.googleapis.com/v1beta/'
LOG = os.path.join(SRC, 'gen-art-log.jsonl')
# estimate only: about $0.07 per second of 720p video (owner's figure for Gemini Omni 1.2 Flash, Nov 2026). The reply's
# usageMetadata is logged as it comes; the real bill is in Google AI Studio.
USD_PER_S = 0.07
WORST_S = 8          # budget check: a clip is counted as this long before it is sent
BUDGET = 2.50        # stop when the logged video total would pass this

COMMON = ("Camera: perfectly still, locked off, looking straight down from high directly above (a top-down, overhead nadir view), "
          "centred on the explosion; no camera movement, no zoom, no shake. Background: pure solid black everywhere around it: no ground, "
          "no terrain, no buildings, no horizon, no sky, no stars, no light on any surface. The whole effect stays in the middle of the "
          "frame with black margin all around it at every moment; it never touches or leaves the edges of the frame. "
          "Realistic, photographic, natural fire and smoke physics, real-time speed (not slow motion). "
          "No text, no captions, no numbers, no watermark, no logo, no people, no vehicles. Silent: no sound, no music, no audio. "
          "A single continuous shot about 5 seconds long (between 4 and 6 seconds), 16:9 framing with the explosion in the middle, 720p.")

CLIPS = {
    'nuclear': ("A realistic video of a nuclear explosion seen from straight above, on a plain black background. It starts with a "
                "blinding white flash at the centre; then a thin bright shockwave ring spreads out fast from the centre in a perfect "
                "circle; then a huge boiling, churning orange and yellow fireball and its rolling cloud swell up in the middle, and "
                "over the rest of the clip the fire slowly dims and the cloud slowly turns into billowing grey smoke, lit softly from "
                "above so the grey smoke stays clearly visible against the black."),
    'chemical': ("A realistic video of a small blast and a gas cloud seen from straight above, on a plain black background. It starts "
                 "with a small, short blast at the centre (a brief burst of flame and a puff of dust); then a thick, sickly "
                 "yellow-green cloud of gas pours out and spreads low and wide in all directions, rolling and swirling, with soft "
                 "wispy edges that thin out, and drifts slowly towards one side. The gas is dense, opaque and pale yellow-green in "
                 "the middle, lit softly from above so it stays clearly visible against the black; it does not glow and is not fire."),
    'conventional': ("A realistic video of a big fiery explosion seen from straight above, on a plain black background. It starts with a quick bright flash; then a large orange fireball "
                     "bursts out and churns; then thick dark grey smoke rises from it towards the camera and drifts slowly towards "
                     "one side, lit softly from above so the dark grey smoke stays clearly visible against the black."),
    'cruise': ("A realistic video of a smaller, sharper explosion seen from straight above, on a plain black background, as from a "
               "cruise missile hit. It starts with a quick bright flash; then a compact, fast orange fireball bursts out and dies "
               "down; then a short puff of dark grey smoke spreads a little and thins away, lit softly from above so the dark grey "
               "smoke stays clearly visible against the black. The explosion fills less of the frame than a big bomb blast would."),
}

def prompt(name): return CLIPS[name] + '\n\n' + COMMON

def request(name):
    """the Interactions API request body (this model answers only there, not on generateContent)"""
    return {'model': MODEL, 'input': prompt(name), 'response_modalities': ['video'],   # video only: no audio modality, so no sound
            'response_format': {'type': 'video', 'resolution': '720p', 'aspect_ratio': '16:9', 'duration': '5s', 'delivery': 'inline'},
            'generation_config': {'video_config': {'task': 'text_to_video'}}, 'background': True, 'store': True}

def call(method, path, body=None, raw=False, timeout=1800):
    """one HTTP call to the API (path relative to API, or a full https URL on the same host); JSON reply, or bytes with raw"""
    headers = {'Content-Type': 'application/json'}
    if os.environ.get('GEMINI_API_KEY'): headers['x-goog-api-key'] = os.environ['GEMINI_API_KEY']
    url = path if path.startswith('https://') else API + path
    req = urllib.request.Request(url, json.dumps(body).encode() if body is not None else None, headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.read() if raw else json.load(r)
    except urllib.error.HTTPError as e:
        try: msg = json.load(e).get('error', {}).get('message', '')
        except Exception: msg = ''
        raise SystemExit(f'API error {e.code}: {msg}')

def logged_video_usd():
    rows = [json.loads(l) for l in open(LOG)] if os.path.exists(LOG) else []
    return sum(r.get('usd_est', 0) for r in rows if r.get('kind') == 'video')

def clip_path(name): return os.path.join(SRC, f'fxv-{name}.mp4')

def probe(path):
    """(seconds, width, height, has_audio) of a video file, by ffprobe"""
    out = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path],
                                    capture_output=True, text=True, check=True).stdout)
    v = next((s for s in out.get('streams', []) if s.get('codec_type') == 'video'), {})
    return (float(out.get('format', {}).get('duration') or v.get('duration') or 0), v.get('width'), v.get('height'),
            any(s.get('codec_type') == 'audio' for s in out.get('streams', [])))

def video_parts(reply):
    """(kind, {mimeType, data | fileUri}) of every video in a reply (Interactions steps[].content / outputs, or generateContent parts)"""
    outs = list(reply.get('outputs', []) or [])
    for st in reply.get('steps', []) or []:
        if st.get('type') == 'model_output': outs += st.get('content', []) or []
    for o in outs:
        if o.get('type') == 'video' or str(o.get('mime_type', '')).startswith('video/'):
            m = o.get('mime_type') or o.get('mimeType') or 'video/mp4'
            if o.get('data'): yield 'inline', {'mimeType': m, 'data': o['data']}
            elif o.get('uri'): yield 'file', {'mimeType': m, 'fileUri': o['uri']}
    for c in reply.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if p.get('thought'): continue
            if 'inlineData' in p and p['inlineData'].get('mimeType', '').startswith('video/'): yield 'inline', p['inlineData']
            elif 'fileData' in p: yield 'file', p['fileData']

def send(name, raw_dir, force):
    out = clip_path(name)
    if os.path.exists(out) and not force: raise SystemExit(f'{os.path.relpath(out, ROOT)} exists: one try per clip (--force only when the owner asks)')
    spent = logged_video_usd(); worst = WORST_S * USD_PER_S
    if spent + worst > BUDGET: raise SystemExit(f'budget: ${spent:.2f} logged + up to ${worst:.2f} would pass ${BUDGET:.2f}; nothing sent')
    print(f'{name}: sending (logged so far ${spent:.2f}) ...', flush=True); t0 = time.time()
    os.makedirs(raw_dir, exist_ok=True); rawp = os.path.join(raw_dir, f'fxv-{name}-reply-{int(time.time())}.json')
    reply = call('POST', 'interactions', request(name))
    with open(rawp, 'w') as f: json.dump(reply, f)   # kept first, so a paid reply is never lost to a parsing problem
    print(f'  interaction {reply.get("id")} {reply.get("status")} (if this stops: --collect {name} {reply.get("id")})', flush=True)
    finish(name, reply, rawp, t0)

def finish(name, reply, rawp, t0):
    """waits for a background interaction, saves its clip into assets/art-src/ and logs the call"""
    out = clip_path(name); fails = 0
    while reply.get('status') in ('in_progress', 'queued', 'pending', 'running') and reply.get('id'):
        time.sleep(15)
        try: reply = call('GET', f'interactions/{reply["id"]}', timeout=300); fails = 0
        except SystemExit as e:
            fails += 1; print(f'  poll: {e}', flush=True)
            if fails > 20: raise SystemExit(f'gave up polling; later: --collect {name} {reply["id"]}')
            continue
        with open(rawp, 'w') as f: json.dump(reply, f)
        print(f'  {reply.get("status")} after {int(time.time() - t0)} s', flush=True)
    secs = time.time() - t0
    data = None; mime = None
    for kind, d in video_parts(reply):
        mime = d.get('mimeType')
        if kind == 'inline': data = base64.b64decode(d['data'])
        else:
            uri = d['fileUri']; sep = '&' if '?' in uri else '?'
            data = call('GET', uri if 'alt=media' in uri else uri + sep + 'alt=media', raw=True)
        break
    dur = w = h = None; audio = None
    if data:
        ext = {'video/webm': '.webm', 'video/quicktime': '.mov'}.get(mime or '', '.mp4')
        out = out[:-4] + ext
        with open(out, 'wb') as f: f.write(data)
        try: dur, w, h, audio = probe(out)
        except Exception as e: print(f'  ffprobe failed: {e}')
    u = reply.get('usage') or reply.get('usageMetadata') or {}
    usd = (dur if dur else WORST_S) * USD_PER_S if (data or reply.get('status') == 'completed' or u) else 0.0
    row = {'kind': 'video', 'name': f'fxv-{name}', 'model': MODEL, 'file': data and os.path.relpath(out, ROOT), 'mime': mime,
           'seconds': dur and round(dur, 2), 'size': w and f'{w}x{h}', 'audio': audio, 'bytes': data and len(data),
           'request_s': round(secs, 1), 'usd_est': round(usd, 4), 'usage': u,
           'status': reply.get('status'), 'interaction': reply.get('id'), 'time': time.strftime('%Y-%m-%dT%H:%M:%S')}
    lines = open(LOG).read().splitlines() if os.path.exists(LOG) else []   # one row per interaction: a --collect replaces it
    same = [i for i, l in enumerate(lines) if row['interaction'] and f'"interaction": "{row["interaction"]}"' in l]
    if same:
        old = json.loads(lines[same[-1]]); row['request_s'] = old.get('request_s') if secs < 1 else row['request_s']
        lines[same[-1]] = json.dumps(row)
    else: lines.append(json.dumps(row))
    with open(LOG, 'w') as f: f.write('\n'.join(lines) + '\n')
    if data: print(f'{os.path.relpath(out, ROOT)}  {dur and round(dur, 2)} s {w}x{h} audio={audio} {len(data)} bytes in {secs:.0f} s (~${usd:.2f}); raw reply {rawp}')
    else: print(f'{name}: no video in the reply, status {row["status"]} {str(reply.get("error", ""))[:300]} (~${usd:.2f}); raw reply {rawp}')

# --------------------------------------------------------------------------------------------------------------------------------
# sprite sheets: the clip decoded at half size, black keyed out by brightness (colour un-mixed from black, so no dark fringe; a
# gain makes mid-grey smoke opaque instead of see-through), the black lead-in skipped, frames sampled evenly over the rest, one
# crop box for all frames of a clip, square about the first flash (the anchor, the middle of every frame) and as tight as the
# widest frame, faded to clear in a circle at its edge (whatever runs off the clip's frame goes soft, not cut), frames on a grid
# in one webp; fxv-sheets.json holds frame count, grid, frame size, fps and the anchor.
# --------------------------------------------------------------------------------------------------------------------------------
SHEET = {   # frames, frame size (px), key: alpha = ((brightness above black - t0)/(1 - t0))^gamma*gain, webp quality
    'nuclear': dict(frames=32, size=192, t0=0.04, gamma=0.7, gain=2.2, q=74),
    'chemical': dict(frames=32, size=192, t0=0.035, gamma=0.7, gain=2.2, q=74),
    'conventional': dict(frames=30, size=192, t0=0.04, gamma=0.6, gain=2.2, q=74),
    'cruise': dict(frames=24, size=176, t0=0.04, gamma=0.6, gain=2.2, q=74),
}

def frames_of(path):
    """every frame of a clip, at half size (uint8), and the clip's frame rate"""
    import numpy as np
    out = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate',
                                     '-of', 'json', path], capture_output=True, text=True, check=True).stdout)
    num, den = out['streams'][0]['r_frame_rate'].split('/'); fps = float(num) / float(den)
    _, w, h, _ = probe(path); w2, h2 = w // 2 // 2 * 2, h // 2 // 2 * 2
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-an', '-vf', f'scale={w2}:{h2}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h2, w2, 3), fps

def key(a, black, t0, gamma, gain):
    """(straight colour, alpha) of a frame on black: alpha from how far the brightest channel rises above the black level, the
    colour un-mixed from that black"""
    import numpy as np
    d = np.clip(a.astype(np.float32) - black, 0, None)
    m = d.max(-1) / max(1.0, 255 - black.max())
    alpha = np.clip(np.clip((m - t0) / (1 - t0), 0, 1) ** gamma * gain, 0, 1)
    aa = np.clip(alpha[..., None], 1e-3, 1)
    return np.clip(d / aa, 0, 255), alpha

def sheet(name):
    import numpy as np
    from PIL import Image
    src = next((p for p in (clip_path(name), clip_path(name)[:-4] + '.webm', clip_path(name)[:-4] + '.mov') if os.path.exists(p)), None)
    if not src: raise SystemExit(f'no clip for {name}')
    cfg = SHEET[name]; A, fps = frames_of(src); N, h, w, _ = A.shape
    black = np.percentile(A[::4, ::4, ::4].reshape(-1, 3), 2, axis=0).astype(np.float32)   # the background's black level
    al = [key(f, black, cfg['t0'], 1, 1)[1] for f in A]
    lit = [float((x > 0.25).sum()) for x in al]
    i0 = next(i for i, v in enumerate(lit) if v > 4)                                    # the black lead-in skipped
    ys, xs = np.nonzero(al[i0] > 0.25); wt = al[i0][ys, xs]
    cx, cy = float((xs * wt).sum() / wt.sum()), float((ys * wt).sum() / wt.sum())     # the anchor: the first flash
    n = cfg['frames']; pick = [round(i0 + (N - 1 - i0) * k / (n - 1)) for k in range(n)]
    gy, gx = np.mgrid[0:h, 0:w]; edge = np.minimum.reduce([gx, gy, w - 1 - gx, h - 1 - gy]).astype(np.float32)
    efade = np.clip(edge / (0.1 * h), 0, 1)                                              # what reaches the clip's own edge goes soft there
    keyed = [(c, a * efade) for c, a in (key(A[i], black, cfg['t0'], cfg['gamma'], cfg['gain']) for i in pick)]
    tot = np.max([x[1] for x in keyed], 0); ys, xs = np.nonzero(tot > 0.06)
    half = max(cx - xs.min(), xs.max() + 1 - cx, cy - ys.min(), ys.max() + 1 - cy) * 1.04 + 2
    half = min(half, 0.56 * h)                                                           # at most a little more than the clip's height (a ring running wider fades out)
    box = (round(cx - half), round(cy - half), round(cx + half), round(cy + half))
    size = cfg['size']; cols = int(np.ceil(np.sqrt(n))); rows = int(np.ceil(n / cols))
    gy, gx = np.mgrid[0:size, 0:size]; r = np.hypot(gx + 0.5 - size / 2, gy + 0.5 - size / 2) / (size / 2)
    vig = np.clip((1 - r) / 0.16, 0, 1)[..., None]                                     # the circular edge fade
    out = Image.new('RGBA', (cols * size, rows * size), (0, 0, 0, 0))
    for j, (col, alpha) in enumerate(keyed):
        pm = np.dstack([col * alpha[..., None], alpha * 255]).astype(np.float32)        # premultiplied, so resizing bleeds no black into the edge
        chans = [np.asarray(Image.fromarray(pm[..., c]).crop(box).resize((size, size), Image.LANCZOS)) for c in range(4)]   # (outside the clip: clear)
        q = np.dstack(chans); q = q * vig
        Aq = np.clip(q[..., 3:], 1e-3, 255); rgb = np.where(q[..., 3:] > 0.5, np.clip(q[..., :3] * 255 / Aq, 0, 255), 0)
        out.paste(Image.fromarray(np.dstack([rgb, np.clip(q[..., 3:], 0, 255)]).astype(np.uint8), 'RGBA'), ((j % cols) * size, (j // cols) * size))
    dst = os.path.join(ART, f'fxv-{name}.webp'); out.save(dst, 'WEBP', quality=cfg['q'], method=6)
    dur = (pick[-1] - pick[0] + 1) / fps
    meta = {'frames': n, 'cols': cols, 'rows': rows, 'frame': size, 'fps': round((n - 1) / max(1e-3, (pick[-1] - pick[0]) / fps), 3),
            'seconds': round(dur, 2), 'anchor': [0.5, 0.5], 'span_px': round(2 * half * 2), 'clip_px': [w * 2, h * 2]}
    print(f'{os.path.relpath(dst, ROOT)}  {out.width}x{out.height}  {os.path.getsize(dst) // 1024} KB  {meta}')
    return meta

def sheets(names):
    jp = os.path.join(ART, 'fxv-sheets.json')
    meta = json.load(open(jp)) if os.path.exists(jp) else {}
    for n in names: meta[n] = sheet(n)
    with open(jp, 'w') as f: json.dump(meta, f, indent=1, sort_keys=True)
    print(os.path.relpath(jp, ROOT))

def main(a):
    if not a or a[0] in ('-h', '--help'): print(__doc__); return
    if a[0] == '--print':
        for n in CLIPS: print(f'--- {n}\n{json.dumps(request(n), indent=1)}\n')
        return
    if a[0] == '--model': print(json.dumps(call('GET', f'models/{MODEL}'), indent=1)); return
    if a[0] == '--count':   # free: the request without its input is checked by the API and refused ("Missing input.") before anything is made
        for n in CLIPS:
            r = request(n); del r['input']
            try: call('POST', 'interactions', r); print(n, 'UNEXPECTED: accepted without input')
            except SystemExit as e: print(n, e)
        return
    if a[0] == '--cost':
        rows = [json.loads(l) for l in open(LOG) if '"video"' in l] if os.path.exists(LOG) else []
        rows = [r for r in rows if r.get('kind') == 'video']
        for r in rows: print(f"{r['name']:<18} {r.get('seconds')} s  {r.get('size')}  ~${r.get('usd_est', 0):.2f}")
        print(f'{len(rows)} video calls, about ${sum(r.get("usd_est", 0) for r in rows):.2f} (estimate; the real bill is in Google AI Studio)'); return
    if a[0] == '--sheet': sheets(a[1:] or list(CLIPS)); return
    if a[0] == '--silent':
        src = next(p for p in (clip_path(a[1]), clip_path(a[1])[:-4] + '.webm') if os.path.exists(p))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:v', '-c:v', 'copy', '-an', a[2]], check=True); print(a[2]); return
    if a[0] == '--from-raw':   # a reply kept on disk (no API call): saves its clip and replaces its log row
        finish(a[1], json.load(open(a[2])), a[2], time.time()); return
    if a[0] == '--collect':   # a clip sent earlier whose waiting was interrupted: no new generation
        name, iid = a[1], a[2]; raw_dir = tempfile.gettempdir(); rawp = os.path.join(raw_dir, f'fxv-{name}-reply-{int(time.time())}.json')
        finish(name, call('GET', f'interactions/{iid}'), rawp, time.time()); return
    force = False; raw_dir = tempfile.gettempdir(); names = []; i = 0
    while i < len(a):
        if a[i] == '--force': force = True
        elif a[i] == '--raw': i += 1; raw_dir = a[i]
        elif a[i] in CLIPS: names.append(a[i])
        else: raise SystemExit(f'unknown clip or option: {a[i]} ({", ".join(CLIPS)})')
        i += 1
    os.makedirs(SRC, exist_ok=True)
    for n in names: send(n, raw_dir, force)

main(sys.argv[1:])
