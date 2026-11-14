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

const final = path.join(ROOT, 'final.mp4');
if (fs.existsSync(final)) fs.copyFileSync(final, path.join(ROOT, 'final_previous.mp4'));
const bed = story.bed && fs.existsSync(path.join(ROOT, story.bed)) ? path.join(ROOT, story.bed) : null; // music + sfx, already ducked
let args;
if (hasAudio && bed) args = ['-y', '-i', silent, '-i', path.join(ROOT, story.audio), '-i', bed, '-filter_complex',
  '[1:a]aresample=48000,aformat=channel_layouts=stereo[v];[2:a]aresample=48000,aformat=channel_layouts=stereo[b];[v][b]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]',
  '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', final];
else if (hasAudio) args = ['-y', '-i', silent, '-i', path.join(ROOT, story.audio), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', final];
else args = ['-y', '-i', silent, '-c', 'copy', final];
const r = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
if (r.status !== 0) { say('mux failed:\n' + r.stderr.slice(-2000)); process.exit(1); }
say(`\n[4/4] ${hasAudio ? 'voiceover added' + (bed ? ' + music/sfx bed' : '') + ', loudness -14 LUFS' : 'no voiceover found (silent video)'}`);
say('DONE - final.mp4');
