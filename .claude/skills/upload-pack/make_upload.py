#!/usr/bin/env python3
"""Write UPLOAD.md + cover.jpg for a finished 3d-story-shorts video.
Usage: python3 make_upload.py <video-folder> [--cover SECONDS]"""
import json, os, re, subprocess, sys

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    d = sys.argv[1]; cover_t = float(sys.argv[sys.argv.index("--cover") + 1]) if "--cover" in sys.argv else 0.2
    story = json.load(open(os.path.join(d, "story.json")))
    final = os.path.join(d, "final.mp4")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", final], capture_output=True, text=True).stdout.strip() or 0)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(cover_t), "-i", final, "-frames:v", "1", "-q:v", "2", os.path.join(d, "cover.jpg")])
    script = open(os.path.join(d, "script.md"), encoding="utf-8").read() if os.path.exists(os.path.join(d, "script.md")) else ""
    srcs = sorted(set(re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", script)))[:6]
    titles = [o["text"] for s in story["shots"] for o in s.get("overlays", []) if o["type"] == "title"]
    voice_ai = True  # every pipeline voice so far is TTS; set False only for a human recording
    credits = ""
    for p in ("tools/sfx/CREDITS.txt",):
        if os.path.exists(os.path.join(d, p)): credits = open(os.path.join(d, p)).read().strip()
    L = [f"# Upload: {story.get('title', '')}", "",
         f"- File: final.mp4, {dur:.1f} s, 1080x1920. Cover: cover.jpg (from {cover_t:.1f} s).",
         f"- On-screen hook: {titles[0] if titles else 'TODO'}",
         "- TikTok Creator Rewards: " + ("over 60 s - upload as rendered, no in-app trim" if dur > 60 else f"UNDER 60 s ({dur:.1f} s) - this upload will not earn Creator Rewards"),
         "", "## Disclosure (switch these ON)", ""]
    if voice_ai:
        L += ["- [ ] TikTok: More options -> **AI-generated content** ON",
              "- [ ] YouTube: Upload -> Details -> **Altered or synthetic content: Yes**",
              "- [ ] Instagram: Advanced settings -> **AI info / Label as AI** ON",
              "- [ ] Every caption ends with: `AI voiceover`"]
    L += ["", "## Sources to cite (caption or first comment)", ""] + [f"- {t}: {u}" for t, u in srcs]
    L += ["", "## TikTok", "", "Caption (write with /tt-caption, lint with caption.py):", "```", "TODO", "```",
          "", "## YouTube Shorts", "", "Title (/yt-package, under 60 chars): TODO", "", "Description (/yt-seo):", "```", "TODO", "```",
          "", "## Instagram Reels", "", "Caption (/ig-caption, max 5 hashtags):", "```", "TODO", "```",
          "", "## Licences", "", "- Music: original, generated in code (tools/make_bed.py).",
          "- Voice: " + ("AI text-to-speech - see the voice tool's licence (Kokoro: Apache-2.0)." if voice_ai else "human recording."),
          "- Sound effects:", "```", credits or "none", "```",
          "", "## Before you press publish", "", "- [ ] /video-review verdict is PUBLISH", "- [ ] tt-check: 0 fail",
          "- [ ] AI labels switched on (above)", "- [ ] Cover readable at thumbnail size", "- [ ] Captions pasted, no TODO left"]
    open(os.path.join(d, "UPLOAD.md"), "w").write("\n".join(L) + "\n")
    print(f"UPLOAD.md + cover.jpg written in {d}")

if __name__ == "__main__":
    main()
