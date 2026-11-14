---
name: video-review
description: >-
  Review a finished short video before it is published: build a review pack
  (frames, transcript, on-screen text, audio and spec numbers, fact list), send
  it to a panel of independent reviewers with different jobs (target viewer,
  fact-checker, retention editor, visual critic, platform/policy), optionally
  collect votes from real people on a private review page, and return one
  verdict: PUBLISH, FIX FIRST or DO NOT PUBLISH, with the exact fixes. Use for
  "review my video", "is this ready to post", "is it publishable", "get
  feedback", "قابل للنشر", or right after a 3d-story-shorts render.
---

# video-review

The builder never grades its own video. Every reviewer starts cold, sees only the pack, and does
one job. The verdict comes from rules below, not from the average mood.

## 1. Build the pack

```bash
python3 pack.py final.mp4 --story story.json --script script.md --out review/
```

It writes `review/` with:
- `sheet_*.png` - a frame every 2 s, 6 per sheet, timestamped (what reviewers "watch")
- `hook_*.png` - frames at 0.0, 0.5, 1.0, 2.0, 3.0 s (the scroll decision)
- `PACK.md` - duration, size, codec, loudness, the spoken script with timings, every on-screen
  text with its time, the fact list from `script.md`, and the `tt-check` result if available.

Run `node render.mjs --verify` and `python3 ../claim-check/claims.py story.json script.md` first; fix their findings before spending a panel. Look at the sheets yourself too. If something is plainly broken (black frame, missing audio,
cut-off text), fix and re-render before spending a panel on it.

## 2. AI panel (6 independent reviewers)

Spawn six fresh subagents (Agent tool, run in parallel, no shared context). Give each ONLY: the
path to `review/`, its role prompt from `reviewers.md`, and the output format. Never give them the
build history or your own opinion - that is what makes them independent.

| Reviewer | Job | Can block? |
|---|---|---|
| Target viewer | Would I stop scrolling in 1 s? Would I watch to the end, rewatch, share? | no |
| Fact-checker | Every claim vs the sources in the pack; hypothesis framed as hypothesis? | **yes** |
| Retention editor | Hook, pacing, dead holds, the twist, the loop, the length | no |
| Visual critic | Characters, glitches, legibility, safe zone, consistency, audio mix | no |
| Platform & policy | AI label, music/SFX licences, ad-safety, misleading claims, Creator Rewards length | **yes** |
| Virality strategist | Comment / share / rewatch / follow triggers; what is missing to go viral | no |

Each returns: `SCORE n/10`, `VERDICT PUBLISH|FIX|BLOCK`, up to 3 issues with timestamps and the
exact fix, one thing that works, **MISSING FOR VIRAL** and **SKILL GAP**.

## 3. Real people (optional, recommended before a channel's first posts)

AI reviewers are not an audience. When the user wants real opinions:
1. Make a preview copy under 15 MB: `ffmpeg -i final.mp4 -vf scale=720:-2 -c:v libx264 -crf 28 -c:a aac -b:a 96k preview.mp4`.
2. Load the `artifact-capabilities` skill, then publish a private review page (Artifact) with the
   video (assets capability) and a short form stored in a shared database (db capability):
   hook stop (yes/no), watched to the end (yes/no), confusing moment (timestamp + note),
   would share (yes/no), overall 1-5, publish? (yes/no/fix).
3. The user sends the link to 3-10 people from the target audience. Read the answers with
   ArtifactData and add them to the verdict as a sixth voice: **"Real viewers"**.
Never invent viewer feedback. If nobody answered yet, say so and give the AI verdict alone.

## 4. Close the skill gaps

Collect every SKILL GAP the panel named and merge duplicates. For each one:
1. Check `.claude/skills/` first - the toolkit may already have it (say which skill, and why it was
   not used).
2. Search GitHub: `gh api -X GET search/repositories -f q="<capability> claude skill" -f sort=stars`.
   Clone the best 1-3 into the scratchpad, READ every SKILL.md and scan scripts for network calls,
   credentials and `curl | sh` before installing. Prefer MIT/Apache/CC0. Install into
   `.claude/skills/<name>/` with its LICENSE and an INSTALL_NOTE.md (source, date, what was left out).
3. Nothing suitable or safe? Build the skill yourself: SKILL.md (name, description with trigger
   phrases, steps, rules) + a small tool that actually runs, tested once on this video.
4. Link it from `3d-story-shorts/SKILL.md` so the next video uses it, and tell the user what was
   added and from where. Never install a skill that needs a paid key without asking.

## 5. Verdict rules

- **DO NOT PUBLISH** if the fact-checker or platform & policy reviewer says BLOCK (a false or
  unsourced claim, a missing licence, a policy problem). Name the blocker.
- **FIX FIRST** if any reviewer has a FIX with a concrete timestamped fix, or the mean score < 7,
  or real viewers say "watched to the end" < 50 %.
- **PUBLISH** otherwise. Still list the top fix for next time.

## Hand back

A table of the six reviewers, the verdict, the fixes, then **VIRAL GAPS** (what is missing) and
**SKILLS ADDED** (installed from GitHub / built here / already present).

```
VIDEO REVIEW  final.mp4  (56.5 s)
                    score  verdict  top issue
target viewer        8/10  PUBLISH  hook text appears 0.4 s late
fact-checker         9/10  PUBLISH  -
retention editor     6/10  FIX      0:23-0:27 static hold, cut 2 s
visual critic        7/10  FIX      0:41 runner leaves frame
platform & policy    8/10  PUBLISH  switch on AI label (voice)
real viewers         -     -        no answers yet (link sent?)

VERDICT: FIX FIRST - 2 fixes, about 10 minutes of work:
  1. ...
  2. ...
```

Then fix what the user approves, re-render, and re-run only the reviewers whose issues changed.
Nothing is published by this skill. Last line: **fix it, or ship it?**
