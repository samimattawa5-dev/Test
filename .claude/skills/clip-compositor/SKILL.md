---
name: clip-compositor
description: >-
  Put finished video clips into a 3d-story-shorts video - full-screen cutaways
  or picture-in-picture - frame-accurate, with no extra framework. Our free
  replacement for Remotion-style compositing: use it to drop in Manim diagrams,
  HyperFrames motion-graphics clips, screen recordings or licensed B-roll.
  Use for "add this clip", "put the Manim animation in", "picture in picture",
  "cut to this footage", "insert B-roll".
---

# clip-compositor

Built because the Remotion skills were not installed (no licence file in their repo, and Remotion
itself needs a paid company licence for teams over 3). Our renderer already makes the picture;
this adds other clips on top in the same render, at exact times.

## Use

In `story.json` (top level):

```json
"inserts": [
  {"file": "clips/roche.mp4", "t0": 33.9, "t1": 38.5, "mode": "full"},
  {"file": "clips/graph.mp4", "t0": 12.0, "t1": 15.0, "mode": "pip", "w": 860, "y": 700, "from": 1.5}
]
```

| Field | Meaning |
|---|---|
| `file` | path inside the project folder (mp4/mov/webm) |
| `t0`, `t1` | global seconds when the clip is on screen |
| `mode` | `full` = fills 1080x1920 (letterboxed, never cropped) / `pip` = a box over the scene |
| `w`, `x`, `y` | pip size and position in px (x defaults to centred, y to 420) |
| `from` | start time inside the source clip (default 0) |

`node render.mjs` composites the inserts after drawing the frames and before the voice/music mix,
then prints `composited N insert(s)`. Missing files are skipped with a WARNING.

## Rules

- Keep pip boxes inside the safe zone (y 230-1440, right 120 px clear) and away from the
  caption band (about y 1240-1400); inserts sit ON TOP of captions and overlays.
- Only clips you made or may use (own Manim/HyperFrames renders, CC0, licensed B-roll). Write the
  source and licence of every insert in `script.md`; `/video-review`'s policy reviewer reads it.
- A full-screen insert replaces the 3D picture: keep the voice line about the same thing, and
  keep inserts short (2-5 s) so the characters stay the story.
- Making the clips: `manim-skill` for diagrams/maths, `hyperframes` for motion graphics and kinetic
  type; render them at 1080x1920 (full) or the pip size, 30 fps.
- Check with `node render.mjs --verify` (the 3D layer) and look at a frame inside each insert window.
