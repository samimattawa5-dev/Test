---
name: make-short
description: The house workflow for every new Short on the user's channels ("What if...?" blocky explainer channel and the history-mystery channel) - topic research, viral script with an animated explainer for every line, blocky or round cast, free voice, word-synced animated visuals, automatic checks, a 7-agent pre-render review against CRITERIA.md, fixes, one render, and an upload pack with captions, hashtags and an Arabic publish guide. Use whenever the user asks for a new video, "اعمل فيديو", "فيديو جديد", "ماذا لو", "what if", a new topic for a channel, or "same way as before".
---

# make-short - how every video is made

Talk to the user in **Arabic, short** (max ~20 words unless they ask for detail). Videos are in **English**.
Never start a step the user has said to stop. Ask before the full render only if they asked to review first.

## Channels (pick from what the user says; ask only if unclear)

| Channel | Look | Cast | Preset / world | Music mood |
|---|---|---|---|---|
| **What if...?** (`videos/<slug>/`, e.g. `med-refill`) | soft 3D, bright | `"castStyle": "blocky"` - our own cube-built characters (never Minecraft names, skins or look-alikes) | `science-explainer`, worlds per scene | wonder / playful |
| **History mystery** (e.g. `volcano-plague`) - follow `history-mystery-short` exactly | soft 3D, night tones | round cartoon cast (Hist, Clim, Mara, Tomas, Bo, folk) | `mystery` | tense |

## Steps

1. **Topic** - `viral-scriptwriter` agent: 6 under-covered topics with sources, crowding and a 1-10 score. User picks.
2. **Script** - `viral-scriptwriter`: `script.md` (hook options + scores, shot table, `## Fact list` with links and the hedge to keep, VIRAL CHECKLIST) and `lines.txt`.
   **Every line gets an ANIMATED EXPLAINER, not a static picture**: start state -> end state of the process being described,
   timed to its key words (the sea drains to salt, the Atlantic pours in over Gibraltar and the level rises, a counter climbs with the gauge).
3. **Settled decisions** - write `DECISIONS.md` (hook, scope, length > 61 s, cast, hedges). Reviewers may not flip these without new evidence.
4. **Voice** - Kokoro ONNX `bm_george` (Apache-2.0, free), speed 1.08-1.12, polish chain + `loudnorm`, see `3d-story-shorts`. `vo_lines.json` gives timings.
5. **Scenes** - `tools/make_story.py` builds `story.json` from the timings (one shot per line, split long lines on a key word).
   - Key words: `"mustShow"` + cues that pop on the word (`word-visuals` skill); processes use animated props:
     `ocean` (`level` rises/falls), `waterfall`, `saltflat`, `map` (`dry`, `refill`, `routes`, colours over time, `lat`/`view`),
     `volcano` (`big: true` eruption), `houses` (`dark` windows), counters, `timeline`, `chain` (cause chain), badges.
   - Overlays stay in the safe box x 65-950, y 115-1536; captions never on faces or map labels.
   - Last frame = frame 0 (loop): end card `instant: true`, `capUntil`.
6. **Automatic checks** (all must pass before any review):
   `node render.mjs --verify` (heads, faces, safe zone, overlay overlap, sizes) ·
   `python3 .claude/skills/claim-check/claims.py story.json script.md` ·
   `python3 .claude/skills/word-visuals/check.py story.json` ·
   quick looks with `SCALE=0.5 node render.mjs --frame 0,12.5,74.3`.
7. **Pre-render review** - `python3 .claude/skills/video-review/pack.py <folder> --prerender`, then 6 reviewers + `viral-predictor`
   in parallel, each told to read `.claude/skills/video-review/CRITERIA.md` and the folder's `DECISIONS.md` first.
   Report to the user as a small table (scores per agent + viral score). Fix, update `DECISIONS.md`, repeat while it improves.
   Build missing capabilities the agents name as SKILL GAP into the toolkit (and commit them).
8. **Render** - only after the review: `setsid nohup node render.mjs > out/render.log 2>&1 &` (detached; long renders get cut otherwise).
9. **Upload pack** - `upload-pack/make_upload.py`, then fill the captions (TikTok linted with `tt-caption/caption.py`, YouTube title + description with sources and DOI, Instagram max 5 hashtags, pinned first comment with sources), and write `PUBLISH_AR.md` (Arabic step-by-step: AI label on, no trim, cover from 0.5 s, posting time, reply to comments).
10. **Deliver** - `SendUserFile` the `final.mp4`, `PUBLISH_AR.md`, `UPLOAD.md`, `cover.jpg`; commit and push every step.

## Honesty rules
- Viral "percent" is an estimate with a band, never a promise; say so.
- Keep every hedge the sources use; scope claims exactly (e.g. "to Europe", "Italian cities").
- Label the AI voice on every platform.
