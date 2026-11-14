---
name: claim-check
description: >-
  Check every spoken line and on-screen text of a video script against its
  sourced fact list BEFORE voice and render: numbers not in the sources,
  dropped qualifiers ("one of the coldest" -> "coldest"), hypotheses stated as
  proven, loose time links ("around the same time"), and counters that roll
  through unsourced numbers. Use for "fact check my script", "is this
  accurate", before /video-review, or whenever a 3d-story-shorts story.json
  changes.
---

# claim-check

```bash
python3 claims.py story.json script.md     # script.md must contain "## Fact list"
```

Built after a video-review fact-checker blocked a video for exactly these four things. Run it
before generating the voice: a wording fix is free before the voice and costs credits after.

## What it flags (and the usual fix)

| Flag | Example | Fix |
|---|---|---|
| Hypothesis as fact | "They found the holes it left behind" | "holes a ring **could** have left" |
| Dropped qualifier | badge "COLDEST IN 500M YEARS", source: "among the coldest" | "ONE OF THE COLDEST IN 500M YEARS" |
| Time link | "Around the same time" (gap of ~20 million years) | "Millions of years later" |
| Rolling counter | 1 -> 25,000,000 shows 22,109,274 mid-roll | `"roll": false` on the overlay (pops the final value) |
| Unknown number | a number no source gives | add the source or drop the number |

It is a pointer, not a judge: every CHECK needs a look at the source, and a clean run does not
prove the script true. The fact-checker in `/video-review` still has the last word.

## The rules it enforces (put them in every script)

- Every number on screen or in the voice is in the fact list, with 2 sources.
- Keep the source's qualifier word for word: one of, among, about, may, suggests.
- A hypothesis stays a hypothesis in voice AND on screen; show "HYPOTHESIS" (or "THEORY") early,
  not only at the end.
- Dates that are millions of years apart are never "around the same time".
- Visual details that contradict the era (green forests 466 million years ago, when land plants
  barely existed) are flagged by the reviewers; fix them in the scene (barren continents).
