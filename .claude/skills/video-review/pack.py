#!/usr/bin/env python3
"""Build a review pack for independent reviewers.
Usage: python3 pack.py final.mp4 [--story story.json] [--script script.md] [--out review/]
Writes timestamped frame sheets, hook frames and PACK.md (specs, loudness, timed script,
on-screen text, fact list, licences, tt-check result). Needs ffmpeg/ffprobe."""
import json, os, re, subprocess, sys

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    video = sys.argv[1]; out = arg("--out", "review"); os.makedirs(out, exist_ok=True)
    story = json.load(open(arg("--story"))) if arg("--story") else None
    script = open(arg("--script"), encoding="utf-8").read() if arg("--script") and os.path.exists(arg("--script")) else ""
    info = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height:format=duration,size", "-of", "json", video]).stdout)
    dur = float(info["format"]["duration"])
    font = "fontcolor=white:fontsize=34:box=1:boxcolor=black@0.6:x=12:y=12"
    # hook frames
    for t in (0.0, 0.5, 1.0, 2.0, 3.0):
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", video, "-frames:v", "1", "-vf",
             f"scale=540:-2,drawtext=text='{t:.1f}s':{font}", f"{out}/hook_{t:.1f}.png"])
    # a frame every 2 s (exact seek per frame, labelled with that time), 6 per sheet
    tmp = os.path.join(out, "_f"); os.makedirs(tmp, exist_ok=True); n = 0; t = 0.0
    while t < dur - 0.05:
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf",
             f"scale=360:-2,drawtext=text='{t:.1f}s':{font}", f"{tmp}/{n:03d}.png"]); n += 1; t += 2.0
    run(["ffmpeg", "-v", "error", "-y", "-framerate", "1", "-i", f"{tmp}/%03d.png", "-vf", "tile=6x1", f"{out}/sheet_%02d.png"])
    for f in os.listdir(tmp): os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    lufs = (re.findall(r"I:\s+(-?[\d.]+) LUFS", err) or ["?"])[-1]; peak = (re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err) or ["?"])[-1]
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), {}); a = next((s for s in info["streams"] if s["codec_type"] == "audio"), {})
    L = [f"# Review pack: {os.path.basename(video)}", "",
         f"- Length: {dur:.1f} s" + ("" if dur > 60 else f"  (under the 61 s Creator Rewards floor by {60.5 - dur:.1f} s)"),
         f"- Frame: {v.get('width')}x{v.get('height')} {v.get('codec_name')}; audio: {a.get('codec_name', 'none')}",
         f"- Loudness: {lufs} LUFS integrated, peak {peak} dBFS (target about -14, peak under -1)",
         f"- File size: {int(info['format']['size']) / 1e6:.1f} MB", ""]
    if story:
        L += ["## Spoken script and pictures, by shot", ""]
        for i, s in enumerate(story["shots"], 1):
            chars = ", ".join(f"{c.get('expr', '')} {c.get('outfit', '')} ({c.get('anim', '')})".strip() for c in s.get("characters", []))
            L.append(f"{i:2}. [{s['start']:.1f}-{s['end']:.1f}s] \"{s['line']}\"  | world: {s.get('world')}" + (f" | characters: {chars}" if chars else ""))
        L += ["", "## On-screen text (besides word-by-word captions)", ""]
        for s in story["shots"]:
            for o in s.get("overlays", []):
                txt = o.get("text") or f"{o.get('prefix', '')}{o.get('from', 0)} -> {o.get('prefix', '')}{o.get('to')}{o.get('suffix', '')} [{o.get('label', '')}]"
                L.append(f"- {o['t0']:.1f}-{o['t1']:.1f}s {o['type']}: {txt}")
        L += ["", f"- Style: {story.get('style', 'toon')}; captions: {json.dumps(story.get('captions', {}))[:160]}",
              f"- Voice file: {story.get('audio')}; music/SFX bed: {story.get('bed')}", ""]
    if script:
        m = re.search(r"## Fact list.*", script, re.S)
        L += ["## Fact list and sources (from script.md)", "", (m.group(0) if m else script)[:6000], ""]
    credits = None
    for p in ("tools/sfx/CREDITS.txt", os.path.join(os.path.dirname(video), "tools/sfx/CREDITS.txt")):
        if os.path.exists(p): credits = open(p).read(); break
    L += ["## Licences", "", "- Music: original, generated in code by tools/make_bed.py (no third-party music).",
          "- Voice: " + ("AI text-to-speech (needs the platform's AI label)" if story else "unknown"),
          "- Sound effects: " + (credits.strip().replace("\n", "\n  ") if credits else "unknown - ask the maker"), ""]
    chk = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tt-check", "check.py")
    if os.path.exists(chk):
        r = run([sys.executable, chk, video] + (["--story", arg("--story")] if story else []))
        L += ["## tt-check", "", "```", r.stdout.strip(), "```", ""]
    open(f"{out}/PACK.md", "w").write("\n".join(L))
    sheets = sorted(f for f in os.listdir(out) if f.startswith("sheet_"))
    print(f"pack -> {out}/  (PACK.md, {len(sheets)} sheets, 5 hook frames)")

if __name__ == "__main__":
    main()
