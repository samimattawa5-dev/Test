#!/usr/bin/env python3
"""Check a vertical video before uploading to TikTok (and Reels/Shorts).
Usage: python3 check.py final.mp4 [--story story.json] [--platform tiktok|all]"""
import json, re, subprocess, sys

ZONES = {  # (x0, x1, y0, y1) on 1080x1920 - conservative values, sources differ
    "tiktok": (40, 950, 210, 1570),
    "all": (60, 850, 230, 1440),
}

def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate:format=duration,bit_rate",
                          "-of", "json", path], capture_output=True, text=True, check=True).stdout
    return json.loads(out)

def loudness(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", err); p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", err)
    return (float(i[-1]) if i else None, float(p[-1]) if p else None)

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    path = sys.argv[1]; plat = "tiktok"
    if "--platform" in sys.argv: plat = sys.argv[sys.argv.index("--platform") + 1]
    res = []  # (status, text)
    info = probe(path); v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    if not v: res.append(("FAIL", "no video stream"))
    else:
        res.append(("PASS" if (v["width"], v["height"]) == (1080, 1920) else "FAIL", f"frame {v['width']}x{v['height']} (want 1080x1920)"))
        res.append(("PASS" if v["codec_name"] == "h264" else "WARN", f"video codec {v['codec_name']} (H.264 uploads cleanest)"))
        res.append(("PASS" if v.get("pix_fmt") == "yuv420p" else "WARN", f"pixel format {v.get('pix_fmt')} (want yuv420p)"))
    res.append(("PASS" if a and a["codec_name"] == "aac" else "FAIL", f"audio {a['codec_name'] if a else 'missing'} (want AAC)"))
    res.append(("PASS" if dur <= 600 else "FAIL", f"length {dur:.1f} s (TikTok upload limit 10 min)"))
    res.append(("PASS" if dur > 60 else "WARN", f"length {dur:.1f} s - Creator Rewards pays only videos over 1 minute" + ("" if dur > 60 else f" (short by {60.5 - dur:.1f} s)")))
    if a:
        lufs, peak = loudness(path)
        if lufs is not None: res.append(("PASS" if -16 <= lufs <= -12 else "WARN", f"loudness {lufs} LUFS (aim about -14)"))
        if peak is not None: res.append(("PASS" if peak <= -1 else "WARN", f"peak {peak} dBFS (keep under -1)"))
    if "--story" in sys.argv:
        story = json.load(open(sys.argv[sys.argv.index("--story") + 1]))
        x0, x1, y0, y1 = ZONES.get(plat, ZONES["tiktok"]); W, H = story.get("width", 1080), story.get("height", 1920)
        # burned-in captions (index.html: bottom 27%, font ~14% of width)
        cb = H * (1 - 0.27); ct = cb - W * 0.14 * 1.05
        res.append(("PASS" if ct >= y0 and cb <= y1 else "FAIL", f"captions at y {ct:.0f}-{cb:.0f} ({plat} zone y {y0}-{y1})"))
        for s in story["shots"]:
            for o in s.get("overlays", []):
                size = o.get("size", 112 if o["type"] == "title" else 170 if o["type"] == "counter" else 58)
                text = o.get("text") or (o.get("prefix", "") + f"{o.get('to', 0):,}")
                lines = 2 if (o["type"] == "title" and len(text) * size * 0.62 > 1000) else 1
                h = size * 1.1 * lines + (110 if o["type"] == "counter" else 30)
                w = min(1080, len(text) * size * 0.62 / lines + 60); left = (W - w) / 2
                top = o.get("y", 420); ok = top >= y0 and top + h <= y1 and left >= x0 - 1e-6 and left + w <= x1 + 40
                res.append(("PASS" if ok else "WARN", f"overlay '{text[:28]}' at {o['t0']}s: y {top:.0f}-{top + h:.0f}, x {left:.0f}-{left + w:.0f} (estimate)"))
    for st, t in res: print(f"{st:5} {t}")
    fails = sum(1 for st, _ in res if st == "FAIL"); warns = sum(1 for st, _ in res if st == "WARN")
    print(f"\n{fails} fail, {warns} warn -> " + ("FIX FIRST" if fails else "READY (read the warnings)" if warns else "READY"))
    print("Not checked here: AI-content label at upload, cover frame, sound licence.")
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
