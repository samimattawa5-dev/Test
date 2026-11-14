import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });
const checkOnly = process.argv.includes('--check');
const story = JSON.parse(fs.readFileSync(path.join(ROOT, 'story.json'), 'utf8'));
const scale = Number(process.env.SCALE || 1);           // e.g. SCALE=0.25 for fast previews
const maxSeconds = Number(process.env.MAX_SECONDS || 0); // e.g. 3 to render only the first 3s
const log = [];
const say = (m) => { console.log(m); log.push(m); fs.writeFileSync(path.join(OUT, 'check_log.txt'), log.join('\n')); };

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const launchOpts = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] };
if (process.env.CHROME_PATH) launchOpts.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(launchOpts);
const page = await browser.newPage({ viewport: { width: Math.round(story.width * scale), height: Math.round(story.height * scale) } });
page.on('pageerror', e => say('PAGE ERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') say('CONSOLE ERROR: ' + m.text()); });
await page.goto(`http://127.0.0.1:${port}/index.html?scale=${scale}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

const fps = story.fps || 30;
let total = await page.evaluate(() => window.__total);
if (maxSeconds) total = Math.min(total, maxSeconds);
const frames = Math.round(total * fps);
const hasAudio = story.audio && fs.existsSync(path.join(ROOT, story.audio));
say(`Story "${story.title}": ${story.shots.length} shots, ${total}s, ${frames} frames, audio: ${hasAudio ? story.audio : 'none'}`);

if (process.argv.includes('--stills')) {
  // pre-render review: stills at given times (STILLS="0,0.5,1"), default hook frames + one every 2 s, no video encode
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) fs.unlinkSync(path.join(dir, f));
  const times = process.env.STILLS ? process.env.STILLS.split(',').map(Number)
    : [0, 0.5, 1, 2, 3].map(x => 'h' + x).concat([...Array(Math.ceil(total / 2)).keys()].map(i => i * 2));
  for (const tt of times) { const hook = String(tt).startsWith('h'); const t = Number(String(tt).replace('h', ''));
    await page.evaluate((x) => window.renderFrame(x), Math.min(t, total - 0.05));
    await page.screenshot({ path: path.join(dir, (hook ? 'hook_' : 't_') + String(Math.round(t * 10)).padStart(4, '0') + '.png') }); }
  // motion score per shot longer than 3 s: how much the picture changes inside it (0 = frozen)
  const motion = []; for (const s of story.shots) { if (s.end - s.start < 3) continue; const m = await page.evaluate(([a, b]) => window.__motion(a, b), [s.start + 0.4, s.end - 0.4]);
    motion.push({ start: s.start, end: s.end, motion: Math.round(m * 1000) / 1000 }); }
  fs.writeFileSync(path.join(OUT, 'motion.json'), JSON.stringify(motion, null, 1));
  say(`STILLS ${times.length} -> ${dir}`); await browser.close(); server.close(); process.exit(0);
}

if (process.argv.includes('--verify')) {
  // after-render QA: every planned overlay visible in its window, captions present while words are spoken,
  // heads inside the frame (x 60-1020, y 150-1700), no head touching a prop
  const fails = []; const S = story.shots;
  for (const s of S) {
    for (const o of (s.overlays || [])) { const tm = (o.t0 + o.t1) / 2; const r = await page.evaluate((x) => window.__verify(x), tm);
      const ov = r.overlays.find(v => v.t0 === o.t0 && v.type === o.type);
      if (!ov || ov.op < 0.5) fails.push(`${tm.toFixed(1)}s overlay "${o.text || o.label}" not visible`);
      else if (ov.x0 < 20 || ov.x1 > story.width - 20) fails.push(`${tm.toFixed(1)}s overlay "${ov.text}" touches the frame edge (x ${ov.x0.toFixed(0)}-${ov.x1.toFixed(0)})`); }
    for (const w of (s.words || [])) { if (w.t1 - w.t0 < 0.12) continue; const tm = (w.t0 + w.t1) / 2;
      if (Math.round(tm * 2) % 3) continue; // sample about every 1.5 s of speech
      const r = await page.evaluate((x) => window.__verify(x), tm); if (!r.cap) fails.push(`${tm.toFixed(1)}s no caption while "${w.w}" is spoken`); }
    for (const tm of [s.start + 0.3, (s.start + s.end) / 2, s.end - 0.3]) { const r = await page.evaluate((x) => window.__verify(x), tm);
      for (const h of r.heads) if (!h.behind && (h.x < 60 || h.x > story.width - 60 || h.y < 150 || h.y > 1700)) fails.push(`${tm.toFixed(1)}s ${h.name} head at (${h.x.toFixed(0)}, ${h.y.toFixed(0)}) is cut by the frame`);
      for (const h of r.hits) fails.push(`${tm.toFixed(1)}s ${h}`); }
  }
  // text big enough for a phone: badges >= 44 px, titles >= 90 px, counter labels use 60 px
  for (const s of S) for (const o of (s.overlays || [])) { const sz = o.size ?? (o.type === 'title' ? 112 : o.type === 'counter' ? 170 : 58);
    if ((o.type === 'badge' && sz < 44) || (o.type === 'title' && sz < 90)) fails.push(`${o.t0.toFixed(1)}s ${o.type} "${o.text}" is ${sz}px - too small on a phone`); }
  // white-outs and flashes over spoken captions
  for (let tm = 0.2; tm < total; tm += 0.5) { const r = await page.evaluate((x) => window.__verify(x), tm);
    if (r.cap && r.flash > 0.6) fails.push(`${tm.toFixed(1)}s flash ${r.flash.toFixed(2)} over a caption`);
    if (r.whiteFrac > 0.85) fails.push(`${tm.toFixed(1)}s frame is ${(r.whiteFrac * 100).toFixed(0)}% near-white (white-out)`); 
    if (r.capBox) { const cb = r.capBox;
      if (cb.x0 < 20 || cb.x1 > story.width - 20) fails.push(`${tm.toFixed(1)}s caption "${cb.text}" runs off the frame`);
      for (const ov of r.overlays) if (ov.op > 0.5 && ov.x0 < cb.x1 && ov.x1 > cb.x0 && ov.y0 < cb.y1 && ov.y1 > cb.y0) fails.push(`${tm.toFixed(1)}s caption collides with ${ov.type} "${ov.text}"`);
      for (const h of r.heads) if (!h.behind && h.x > cb.x0 - 40 && h.x < cb.x1 + 40 && h.y > cb.y0 - 70 && h.y < cb.y1 + 40) fails.push(`${tm.toFixed(1)}s caption covers ${h.name}'s face`); } }
  // long holds: a shot over 5.5 s needs something new inside it (overlay, action, walk, appear, counter)
  for (const s of S) { const len = s.end - s.start, busy = (s.overlays || []).length + (s.characters || []).filter(c => c.actions || c.walk).length + (s.props || []).filter(p => p.appear || p.move || p.dotsReveal || p.ice || p.routes || p.dark || p.wilt || p.erupt !== undefined || p.hop || p.glowAt !== undefined).length;
    if (len > 5.5 && busy < 2) fails.push(`${s.start.toFixed(1)}s shot holds ${len.toFixed(1)} s with too little new on screen - cut it or add a beat`); }
  // art must match the numbers: a "21 ... 30°" claim needs 21 crater dots inside +-30 degrees
  for (const s of S) { const claim = (s.overlays || []).map(o => (o.text || '') + ' ' + (o.label || '') + ' ' + (o.to || '')).join(' ');
    const earth = (s.props || []).find(p => p.type === 'earth' && p.dots);
    if (earth && /21/.test(claim) && earth.dots !== 21) fails.push(`${s.start.toFixed(1)}s globe shows ${earth.dots} crater dots but the text says 21`);
    if (earth && /30°/.test(claim) && (earth.dotsLat ?? 0.25) * 180 / Math.PI > 30) fails.push(`${s.start.toFixed(1)}s crater dots reach ${((earth.dotsLat) * 180 / Math.PI).toFixed(0)}° but the text says within 30°`); }
  const uniq = [...new Set(fails)]; uniq.forEach(f => say('VERIFY FAIL ' + f));
  say(uniq.length ? `VERIFY: ${uniq.length} problem(s)` : 'VERIFY OK');
  await browser.close(); server.close(); process.exit(uniq.length ? 1 : 0);
}

if (checkOnly) {
  // one preview frame from the middle of every shot
  for (let i = 0; i < story.shots.length; i++) {
    const s = story.shots[i];
    await page.evaluate((t) => window.renderFrame(t), (s.start + s.end) / 2);
    const f = path.join(OUT, `preview_shot_${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    say(`preview ${f}`);
  }
  say('CHECK OK');
  await browser.close(); server.close(); process.exit(0);
}

const silent = path.join(ROOT, 'out', 'silent.mp4');
const enc = spawn(ffmpegPath, ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
  '-vf', `scale=${story.width}:${story.height}:flags=lanczos`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'veryfast', silent],
  { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = ''; enc.stderr.on('data', d => { ffErr += d; });
const done = new Promise(r => enc.on('close', r));
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.renderFrame(t), i / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
  if (i % 30 === 0) process.stdout.write(`\rframe ${i}/${frames}`);
}
enc.stdin.end();
const code = await done;
await browser.close(); server.close();
if (code !== 0) { say('ffmpeg failed:\n' + ffErr.slice(-2000)); process.exit(1); }

// clip-compositor: drop finished clips (Manim, HyperFrames, screen captures, B-roll) into the timeline.
// story.inserts = [{file, t0, t1, mode: 'full'|'pip', x, y, w, from}] - times are global seconds, from = start inside the clip
let picture = silent;
if (Array.isArray(story.inserts) && story.inserts.length) {
  const ins = story.inserts.filter(c => fs.existsSync(path.join(ROOT, c.file)));
  if (ins.length !== story.inserts.length) say('WARNING: some inserts are missing and were skipped');
  if (ins.length) {
    const inputs = ['-i', silent]; let fc = '', last = '[0:v]';
    ins.forEach((c, i) => {
      inputs.push('-ss', String(c.from || 0), '-i', path.join(ROOT, c.file));
      const sc = c.mode === 'pip' ? `scale=${c.w || 860}:-2` : `scale=${story.width}:${story.height}:force_original_aspect_ratio=decrease,pad=${story.width}:${story.height}:(ow-iw)/2:(oh-ih)/2:color=black`;
      fc += `[${i + 1}:v]${sc},setpts=PTS-STARTPTS+${c.t0}/TB[c${i}];`;
      const x = c.mode === 'pip' ? (c.x ?? '(W-w)/2') : 0, y = c.mode === 'pip' ? (c.y ?? 420) : 0;
      fc += `${last}[c${i}]overlay=x=${x}:y=${y}:eof_action=pass:enable='between(t,${c.t0},${c.t1})'[o${i}];`; last = `[o${i}]`;
    });
    picture = path.join(OUT, 'composited.mp4');
    const r = spawnSync(ffmpegPath, ['-y', ...inputs, '-filter_complex', fc.replace(/;$/, ''), '-map', last, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'veryfast', picture], { encoding: 'utf8' });
    if (r.status !== 0) { say('insert compositing failed:\n' + r.stderr.slice(-1500)); process.exit(1); }
    say(`composited ${ins.length} insert(s)`);
  }
}
const final = path.join(ROOT, 'final.mp4');
if (fs.existsSync(final)) fs.copyFileSync(final, path.join(ROOT, 'final_previous.mp4'));
const bed = story.bed && fs.existsSync(path.join(ROOT, story.bed)) ? path.join(ROOT, story.bed) : null; // music + sfx, already ducked
let args;
if (hasAudio && bed) args = ['-y', '-i', picture, '-i', path.join(ROOT, story.audio), '-i', bed, '-filter_complex',
  '[1:a]aresample=48000,aformat=channel_layouts=stereo[v];[2:a]aresample=48000,aformat=channel_layouts=stereo[b];[v][b]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]',
  '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', final];
else if (hasAudio) args = ['-y', '-i', picture, '-i', path.join(ROOT, story.audio), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', final];
else args = ['-y', '-i', picture, '-c', 'copy', final];
const r = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
if (r.status !== 0) { say('mux failed:\n' + r.stderr.slice(-2000)); process.exit(1); }
say(`\n[4/4] ${hasAudio ? 'voiceover added' + (bed ? ' + music/sfx bed' : '') + ', loudness -14 LUFS' : 'no voiceover found (silent video)'}`);
say('DONE - final.mp4');
