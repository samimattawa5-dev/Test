---
name: tt-check
description: >-
  Check a finished vertical video before it goes to TikTok (and Reels/Shorts):
  size, codec, length vs the Creator Rewards 1-minute floor, loudness, and
  whether every on-screen text from a 3d-story-shorts story.json sits inside
  the safe zone. Use for "is this ready for TikTok", "check before upload",
  "TikTok specs", "will this earn", or right after rendering final.mp4.
---

# tt-check

```bash
python3 check.py final.mp4                       # file checks
python3 check.py final.mp4 --story story.json    # + safe-zone check of captions and overlays
python3 check.py final.mp4 --platform all        # strictest box for posting one file everywhere
```

Needs ffmpeg/ffprobe (any recent version). Measures; it does not edit.

## What it checks

| Check | Pass |
|---|---|
| Frame | 1080x1920, 9:16 |
| Codec | H.264 video + AAC audio, yuv420p |
| Length | TikTok: up to 10 min. **Creator Rewards needs > 60 s** (third-party guides, Nov 2026 - verify in TikTok Studio) |
| Loudness | about -14 LUFS integrated, true peak under -1 dBFS |
| Safe zone | TikTok: y 210-1570, right 130 px clear. `--platform all`: y 230-1440, x 60-850 (Instagram's UI covers more) |

The safe-zone numbers differ between sources (TikTok publishes no single figure for organic posts);
these are the conservative ones. When a check fails, fix it in `story.json` (`y` of overlays,
caption position) and re-render, never by cropping the finished file.

## Before upload (say these, the tool cannot check them)

- Switch on **AI-generated content** if the voice, people or scenes are AI-made and realistic.
- Pick the **cover** frame: the hook frame with the title readable.
- Sound: our own score is safe. A trending sound from the library is fine on a personal account,
  but business accounts may only use the Commercial Music Library.
- Run `/tt-caption` for the text.

Nothing is posted. Last line: **ship it, or change it?**
