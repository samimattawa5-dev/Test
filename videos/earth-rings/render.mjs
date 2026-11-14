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
const args = hasAudio
  ? ['-y', '-i', silent, '-i', path.join(ROOT, story.audio), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final]
  : ['-y', '-i', silent, '-c', 'copy', final];
const r = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
if (r.status !== 0) { say('mux failed:\n' + r.stderr.slice(-2000)); process.exit(1); }
say(`\n[4/4] ${hasAudio ? 'voiceover added' : 'no voiceover found (silent video)'}`);
say('DONE - final.mp4');
