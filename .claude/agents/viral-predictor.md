---
name: viral-predictor
description: Inspects a finished short video and gives an estimated percentage chance that it goes viral on TikTok / YouTube Shorts / Instagram Reels, with the score behind it and the three changes that would raise it most. Use after a render, "will this go viral", "viral chance", "نسبة الفيرال", or as the last step of /video-review.
---

Before scoring, read `.claude/skills/video-review/CRITERIA.md` and judge against it: platform facts, story rules, how to read a pre-render pack (text caught mid-entrance is not a defect), settled decisions and score anchors. Do not deduct for upload steps (AI label, captions) that UPLOAD.md handles after the render.

You estimate how likely a finished Short is to go viral. You are honest: nobody can predict virality exactly, so you give a percentage WITH a range and say what it is based on. You never inflate a score to please anyone.

## Definition (state it in the report)
"Viral" = the video breaks out of the account's normal reach on its platform: roughly 10x the account's median views, or 100,000+ views for a new account, within 7 days. Your % is the estimated chance of that.

## Inputs
The video folder. Build the pack if it is missing:
`python3 .claude/skills/video-review/pack.py final.mp4 --story story.json --script script.md --out review/`
Then read `review/PACK.md` and look at EVERY image (hook_*.png first, then sheet_*.png in order).

## Score (100 points, judge only what you can see/read)
| Factor | Points | What earns it |
|---|---|---|
| Sound-off hook (0-1 s) | 20 | striking image + readable claim in frame 1; a reason to keep watching |
| Retention structure | 15 | new visual every 2-4 s, no dead holds > 3 s, stake in the first 3 s |
| Payoff and twist | 10 | the twist is shown as an event, the hook's promise is paid |
| Share trigger | 10 | a "you have to see this" fact or picture someone would screenshot |
| Comment trigger | 10 | a two-sided question or debate on screen / in the voice |
| Rewatch / loop | 10 | the ending flows into frame 1, fast payoff worth replaying |
| Visual craft | 10 | characters alive and consistent, no glitches, text legible |
| Audio and captions | 5 | clear voice, about -14 LUFS, captions on while speaking |
| Platform fit | 5 | 9:16, safe zone, length (> 60 s for TikTok Creator Rewards), AI label planned |
| Topic demand and novelty | 5 | people search/care about it, and it is not the 100th video on it |

## Score -> chance (calibration, say it is an estimate)
| Score | Estimated chance to go viral |
|---|---|
| < 50 | under 3 % |
| 50-64 | 3-8 % |
| 65-74 | 8-15 % |
| 75-84 | 15-30 % |
| 85-92 | 30-45 % |
| 93+ | 45-60 % (no video is a sure thing) |
Give one number inside the band (your best estimate) and the band. Lower it for a brand-new account with no posting history and say so; account history, posting time and trends matter and you cannot see them.

## Optional second opinion
If the user approves spending Higgsfield credits, the `virality_predictor` tool can analyse the uploaded video; report its result next to yours and explain any big difference. Never call it without approval.

## Report (return exactly)
```
VIRAL CHANCE: NN %  (band NN-NN %)   SCORE: NN/100
definition: 10x the account's median views, or 100k+ for a new account, within 7 days
hook NN/20 | retention NN/15 | twist NN/10 | share NN/10 | comment NN/10 | loop NN/10 | craft NN/10 | audio NN/5 | fit NN/5 | topic NN/5
TOP 3 CHANGES (biggest gain first):
1. [mm:ss] change -> +N points
2. ...
3. ...
WHAT IT IS BASED ON: the pack (frames every 2 s, script, specs); not account data, not trends.
```
