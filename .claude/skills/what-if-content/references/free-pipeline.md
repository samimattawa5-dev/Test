# 100% FREE pipeline (no credits, no subscriptions)
| Need | Free tool | Notes |
|---|---|---|
| Characters | Build blocky characters in Blender via Python (own work, no license issues) or the CC0 pack | Costumes = extra cubes on head/torso (see costumes.md) |
| 3D / animation / render | Blender `bpy` (pip), Cycles CPU, 1080x1920 | EEVEE needs GPU → not in cloud; Cycles 16-32 samples is fine for blocky |
| Voice | Kokoro TTS (Apache-2.0), voices am_michael, am_adam, af_bella, af_heart… | Models from GitHub releases (huggingface is blocked here) |
| Music/SFX | Generate with Python/numpy (own) or CC0 only | No copyright risk |
| Edit/captions | FFmpeg (+ Pillow text) / free CapCut / DaVinci Resolve | |
| Thumbnails | Blender render + Pillow | |
| Upload | Manual in each app (free) | |
Avoid Higgsfield etc. (paid credits) unless the user approves.
Setup: `tools/setup_free_pipeline.sh` (verified: bpy 5.3, Kokoro TTS, ffmpeg all work in this container).
Blocked here: kenney.nl, opengameart.org, quaternius.com, huggingface.co → build assets ourselves or user downloads the pack locally.
