#!/usr/bin/env python3
"""Build a review pack for independent reviewers.

After the render:   python3 pack.py final.mp4 [--story story.json] [--script script.md] [--out review/]
BEFORE the render:  python3 pack.py <video-folder> --prerender [--out <folder>/review_pre]
  (stills straight from the scene engine via `node render.mjs --stills`; needs CHROME_PATH where
   Chromium is not on the default path. Saves a full render per review round.)

Writes hook_*.png (0, 0.5, 1, 2, 3 s), sheet_*.png (a frame every 2 s, 6 per sheet, labelled with
its exact time) and PACK.md (length, loudness, timed script, on-screen text, fact list, licences,
tt-check result after the render). Needs ffmpeg/ffprobe."""
import json, os, re, subprocess, sys

FONT = "fontcolor=white:fontsize=30:box=1:boxcolor=black@0.6:x=12:y=12"

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def tile(out, frames):
    """frames: list of (time, png) -> labelled sheet_NN.png, 6 per sheet."""
    tmp = os.path.join(out, "_f"); os.makedirs(tmp, exist_ok=True)
    for n, (t, src) in enumerate(frames):
        run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"scale=360:-2,drawtext=text='{t:.1f}s':{FONT}", f"{tmp}/{n:03d}.png"])
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", f"{tmp}/%03d.png", "-vf", "tile=6x1", f"{out}/sheet_%02d.png"])
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)

def frames_from_video(video, out, dur):
    tmp = os.path.join(out, "_v"); os.makedirs(tmp, exist_ok=True); frames = []
    for t in (0.0, 0.5, 1.0, 2.0, 3.0):
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video, "-frames:v", "1", "-vf", f"scale=540:-2,drawtext=text='{t:.1f}s':{FONT}", f"{out}/hook_{t:.1f}.png"])
    t = 0.0
    while t < dur - 0.05:
        p = f"{tmp}/{len(frames):03d}.png"; run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", p]); frames.append((t, p)); t += 2.0
    tile(out, frames)
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)

def frames_from_engine(folder, out):
    env = dict(os.environ, SCALE=os.environ.get("SCALE", "0.5"))
    r = run(["node", "render.mjs", "--stills"], cwd=folder, env=env)
    if r.returncode != 0: print(r.stdout[-800:], r.stderr[-800:]); sys.exit(1)
    st = os.path.join(folder, "out", "stills"); frames = []
    for f in sorted(os.listdir(st)):
        t = int(re.findall(r"(\d+)", f)[0]) / 10
        if f.startswith("hook_"):
            run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(st, f), "-vf", f"scale=540:-2,drawtext=text='{t:.1f}s':{FONT}", f"{out}/hook_{t:.1f}.png"])
        else: frames.append((t, os.path.join(st, f)))
    tile(out, sorted(frames))

def loudness(path):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    return (re.findall(r"I:\s+(-?[\d.]+) LUFS", err) or ["?"])[-1], (re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err) or ["?"])[-1]

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    pre = "--prerender" in sys.argv
    if pre:
        folder = sys.argv[1]; out = arg("--out", os.path.join(folder, "review_pre"))
        story_p = arg("--story", os.path.join(folder, "story.json")); script_p = arg("--script", os.path.join(folder, "script.md")); video = None
    else:
        video = sys.argv[1]; folder = os.path.dirname(os.path.abspath(video)); out = arg("--out", "review")
        story_p = arg("--story"); script_p = arg("--script")
    os.makedirs(out, exist_ok=True)
    story = json.load(open(story_p)) if story_p and os.path.exists(story_p) else None
    script = open(script_p, encoding="utf-8").read() if script_p and os.path.exists(script_p) else ""
    if pre:
        frames_from_engine(folder, out); dur = story["shots"][-1]["end"]
        # the true last frame next to frame 0, so reviewers can check the loop (CRITERIA C7)
        last = round(dur - 0.02, 2); env = dict(os.environ, SCALE=os.environ.get("SCALE", "0.5"))
        run(["node", "render.mjs", "--frame", f"0,{last}"], cwd=folder, env=env)
        a0, a1 = os.path.join(folder, "out", "frame_0.png"), os.path.join(folder, "out", f"frame_{last:g}.png")
        if os.path.exists(a0) and os.path.exists(a1):
            run(["ffmpeg", "-v", "error", "-y", "-i", a0, "-i", a1, "-filter_complex", f"hstack,drawtext=text='frame 0  |  last frame {last}s':{FONT}", f"{out}/loop_first_last.png"])
        lufs, peak = loudness(os.path.join(folder, story.get("audio", "voiceover.wav")))
        L = [f"# Review pack (PRE-RENDER): {os.path.basename(os.path.abspath(folder))}", "",
             "`loop_first_last.png` shows frame 0 beside the true last frame (loop check, CRITERIA C7).", "",
             "**These are stills of the planned video, rendered straight from the scene. Motion between stills is not visible: judge story, framing, text, facts and pacing. The full render happens only after this review.**", "",
             f"- Length: {dur:.1f} s" + ("" if dur > 60 else f"  (under the 61 s Creator Rewards floor by {60.5 - dur:.1f} s)"),
             f"- Voice before mixing: {lufs} LUFS (the final mix is normalised to about -14 LUFS)", ""]
    else:
        info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration,size", "-of", "json", video]).stdout)
        dur = float(info["format"]["duration"]); frames_from_video(video, out, dur); lufs, peak = loudness(video)
        v = next((s for s in info["streams"] if s["codec_type"] == "video"), {}); a = next((s for s in info["streams"] if s["codec_type"] == "audio"), {})
        L = [f"# Review pack: {os.path.basename(video)}", "",
             f"- Length: {dur:.1f} s" + ("" if dur > 60 else f"  (under the 61 s Creator Rewards floor by {60.5 - dur:.1f} s)"),
             f"- Frame: {v.get('width')}x{v.get('height')} {v.get('codec_name')}; audio: {a.get('codec_name', 'none')}",
             f"- Loudness: {lufs} LUFS integrated, peak {peak} dBFS (target about -14, peak under -1)",
             f"- File size: {int(info['format']['size']) / 1e6:.1f} MB", ""]
    if story:
        L += ["## Spoken script and pictures, by shot", ""]
        for i, s in enumerate(story["shots"], 1):
            chars = ", ".join(f"{c.get('cast', '')} {c.get('expr', '')} {c.get('outfit', '')} ({c.get('anim', '')})".strip() for c in s.get("characters", []))
            L.append(f"{i:2}. [{s['start']:.1f}-{s['end']:.1f}s] \"{s['line']}\"  | world: {s.get('world')}" + (f" | characters: {chars}" if chars else ""))
        L += ["", "## On-screen text (besides word-by-word captions)", ""]
        for s in story["shots"]:
            for o in s.get("overlays", []):
                txt = o.get("text") or f"{o.get('prefix', '')}{o.get('to')}{o.get('suffix', '')} [{o.get('label', '')}]" + ("" if o.get("roll") is False else " (counts up)")
                L.append(f"- {o['t0']:.1f}-{o['t1']:.1f}s {o['type']}: {txt}")
        L += ["", f"- Style: {story.get('preset') or story.get('style', 'toon')}; captions: {json.dumps(story.get('captions', {}))[:160]}",
              f"- Voice file: {story.get('audio')}; music/SFX bed: {story.get('bed')}", ""]
    mj = os.path.join(folder, "out", "motion.json")
    if pre and os.path.exists(mj):
        L += ["## Motion inside long shots (mean picture change start->end; under 0.03 = nearly frozen)", ""] + [f"- {m['start']:.1f}-{m['end']:.1f}s: {m['motion']:.3f}" + ("  <- nearly frozen" if m["motion"] < 0.03 else "") for m in json.load(open(mj))] + [""]
    if script:
        m = re.search(r"## Fact list.*", script, re.S)
        L += ["## Fact list and sources (from script.md)", "", (m.group(0) if m else script)[:16000], ""]
    credits = None
    for p in (os.path.join(folder, "tools/sfx/CREDITS.txt"), "tools/sfx/CREDITS.txt"):
        if os.path.exists(p): credits = open(p).read(); break
    L += ["## Licences", "", "- Music: original, generated in code by tools/make_bed.py (no third-party music).",
          "- Voice: " + ((story or {}).get("voice") or "AI text-to-speech - name the model, voice and licence in story.json \"voice\"") + "; needs the platform AI label",
          "- Sound effects: " + (credits.strip().replace("\n", "\n  ") if credits else "unknown - ask the maker"), ""]
    chk = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tt-check", "check.py")
    if video and os.path.exists(chk):
        r = run([sys.executable, chk, video] + (["--story", story_p] if story else []))
        L += ["## tt-check", "", "```", r.stdout.strip(), "```", ""]
    dec = os.path.join(folder, "DECISIONS.md")
    if os.path.exists(dec): L += ["## Settled decisions (DECISIONS.md) - see CRITERIA.md section E", "", open(dec, encoding="utf-8").read(), ""]
    if pre:  # the automatic checks, so reviewers do not re-report what is already verified
        v = run(["node", "render.mjs", "--verify"], cwd=folder); c = run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "claim-check", "claims.py"), story_p, script_p])
        L += ["## Automatic checks", "", "```", (v.stdout + v.stderr).strip()[-1500:], "```", "", "claim-check (items to check by hand):", "```", "\n".join(x for x in c.stdout.splitlines() if "CHECK" in x or "FIX" in x or "item(s)" in x) or "none", "```", ""]
    crit = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CRITERIA.md")
    L += ["## Review criteria", "", f"Judge against {os.path.abspath(crit)} (platform facts, story rules, how to read a pre-render pack, score anchors).", ""]
    up = os.path.join(folder, "UPLOAD.md")
    L += ["## Upload plan (UPLOAD.md)", "", open(up).read() if os.path.exists(up) else "not written yet - run upload-pack/make_upload.py before publishing", ""]
    open(f"{out}/PACK.md", "w").write("\n".join(L))
    sheets = sorted(f for f in os.listdir(out) if f.startswith("sheet_"))
    print(f"pack -> {out}/  (PACK.md, {len(sheets)} sheets, hook frames{' , PRE-RENDER' if pre else ''})")

if __name__ == "__main__":
    main()
