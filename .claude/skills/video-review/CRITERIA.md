# Review criteria (shared by every reviewer and the viral-predictor)

Every reviewer judges against THESE rules, not personal taste. If a rule here and your instinct
disagree, the rule wins; if you think a rule is wrong, say so under SKILL GAP, do not score against it.

## A. Facts about the platforms (do not guess these)

| Rule | Correct value |
|---|---|
| TikTok Creator Rewards | only videos **longer than 1 minute** earn; 61 s+ is safe |
| YouTube Shorts / Instagram Reels length | up to 3 minutes; length alone is not a defect |
| UI safe zone (9:16, 1080x1920) | keep text out of the bottom **20 %** (y > 1536), the right **12 %** (x > 950) and the top **6 %** |
| AI disclosure | TikTok, YouTube and Instagram require a label for **realistic** AI people, voices that imitate a real person, or realistic scenes. A cartoon with a generic synthetic narrator is not strictly required to be labelled; we label anyway. The label is an **upload step** (UPLOAD.md checklist), never a defect of the video: do not lower a video score for it. |
| Platform captions/hashtags | written AFTER the render in UPLOAD.md. "TODO" before the render is normal, not a defect. |
| Music / SFX | original code-generated music and CC0 SFX with sources listed are cleared. |

## B. Facts about the story

1. The **fact list in PACK.md is the only truth**. A claim is OK when a numbered fact supports it.
2. Keep the source's own hedges ("may", "up to", "most likely", "apparently") - and **only** those.
   Do not demand extra hedges the source does not use; do not accept fewer.
3. **Scope** must match the source: who, where, how strong (e.g. "brought to Europe" vs "started").
4. Every map colour, legend and badge is a claim and needs a fact, like spoken words.

## C. Story and retention rules (same for everyone, every round)

1. **Frame 0** shows the finished title (not mid-animation) with the strongest true claim, AND the
   claim's subject is visible in the picture.
2. The stake is clear by 3 s; an open question is raised by 10 s.
3. No hold over 3 s without something new (a number, an event, a camera move). Use the motion table:
   under 0.03 = frozen.
4. Every number on screen has a picture.
5. The turn ("but", "problem", the twist word) lands on a picture change, not only in the voice.
6. The comment question has two defensible sides without hindsight.
7. The last frame matches frame 0 so the video loops.

## D. Reading a PRE-RENDER pack correctly

- Stills are taken every 2 s. Text that entered less than 0.4 s before a still can be caught
  mid-animation (half-drawn, small or faded). Check the overlay start times in PACK.md before you
  report text as clipped, small or faded; report it only if it is still wrong 0.4 s after it starts.
- Motion between stills is invisible: use the motion table, do not call a shot frozen from one still.
- The automatic checks (`render.mjs --verify`, `claim-check`) results are in PACK.md. Frames
  marked VERIFY OK have no clipped heads, text over faces or text off-frame at the sampled times.

## E. Settled decisions

`DECISIONS.md` in the video folder (copied into PACK.md) lists choices already made in earlier
rounds and why (e.g. which hook). Do not reverse a settled decision unless you name **new
evidence** (a fact, a rule above, or something visibly broken). "I prefer the other hook" is not new evidence.

## F. Score anchors (all reviewers, out of 10)

- **9-10**: nothing in your area would stop a top channel from posting it today.
- **7-8**: publishable; only polish left in your area.
- **5-6**: one real problem in your area that costs viewers or trust.
- **3-4**: several real problems; would hurt the channel.
- **1-2**: broken or untrue.

Score only YOUR area. Do not lower your score for another reviewer's area.
