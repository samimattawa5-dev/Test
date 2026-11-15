# Project: viral 3D Shorts for two channels

- Reply to the user in **Arabic, short** (about 20 words) unless they ask for detail. Videos are in English.
- For any new video, follow the `make-short` skill (`.claude/skills/make-short/SKILL.md`) step by step.
- Channels: **What if...?** (blocky original cast, `castStyle: "blocky"`) and **History mystery** (round cast).
- Reviews use `.claude/skills/video-review/CRITERIA.md` + the video's `DECISIONS.md`; run the pre-render review before any full render.
- Never use Minecraft names, skins or look-alike characters; our blocky cast is original.
- Commit and push to the working branch after each step.

## Progress log
- `videos/volcano-plague/` - "Did a Volcano Bring the Black Death to Europe?" - finished, `final.mp4` + `UPLOAD.md` + `PUBLISH_AR.md` ready to publish (last viral-predictor score 79/100 before round-9 fixes).
- `videos/med-refill/` - "What If the Ocean Poured Back Into a Dry Mediterranean?" - topic chosen; draft lines in `lines.txt`; script not finished yet (scriptwriter was stopped). Next: finish `script.md` with an animated explainer per line, then the `make-short` steps.
- Toolkit added: blocky cast, `word-visuals` skill, props ocean/waterfall/saltflat/tree/cliff, map dry/refill, chain/timeline overlays, overlap + safe-zone checks, `--frame` preview.
