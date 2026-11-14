---
name: upload-pack
description: >-
  Prepare the upload of a finished Short to TikTok, YouTube Shorts and
  Instagram Reels: one UPLOAD.md with, per platform, the caption/title/
  description, hashtags, the exact AI-disclosure setting to switch on, the
  cover frame, the licence notes, and a tick list to confirm before pressing
  publish. Use for "prepare the upload", "what do I write when posting",
  "publish checklist", "AI label", or after /video-review says PUBLISH.
---

# upload-pack

Built after the review panel found that nothing in the toolkit made sure the AI label gets
switched on: `tt-check` measures the file, but disclosure happens in each app at upload time.
This skill writes it down per platform so it cannot be forgotten. It never uploads anything.

```bash
python3 make_upload.py <video-folder>      # writes <video-folder>/UPLOAD.md + cover.jpg
```

It reads `story.json` (title, overlays, voice/bed), `script.md` (facts, sources) and
`final.mp4`, and fills in what it can. Then YOU finish the text parts:

1. **TikTok caption:** write it with `/tt-caption` and lint it with its `caption.py`.
2. **Instagram caption:** `/ig-caption` (5 hashtags max).
3. **YouTube Shorts title + description:** `/yt-package` and `/yt-seo` (title under 60 chars).
Paste them into UPLOAD.md in place of the `TODO` lines.

## Disclosure rules written into UPLOAD.md (check the apps' current wording)
- AI voice (Kokoro, Higgsfield or any TTS) or AI-made realistic people/scenes: switch ON
  TikTok "AI-generated content", YouTube "Altered or synthetic content", Instagram "AI info".
  Cartoon visuals made in code are not realistic, but the voice is synthetic: switch the labels on.
- Add "AI voiceover" at the end of every caption.
- Sources: put the main source (e.g. "Study: Monash University, 2024") in the caption or first comment.
- TikTok Creator Rewards: upload the file as rendered (no in-app trim); it must stay over 60 s.

## Cover
`cover.jpg` is taken from frame 0.2 s (the hook frame with the title). If the title is not readable
at thumbnail size, pick another time: `python3 make_upload.py <folder> --cover 1.5`.
