---
name: tt-script
description: >-
  Write a TikTok video script from a raw idea or an existing Short: scored hook
  options, the spoken script timed for TikTok (including the 61-second floor for
  Creator Rewards), on-screen text inside TikTok's safe zone, and a loop ending.
  Use for "make a TikTok", "TikTok version", "TikTok script", "hook for TikTok",
  "will this earn on TikTok", or when a 3d-story-shorts video is going to TikTok.
---

# tt-script

A TikTok is decided in the first second and paid by the minute. Write for both.

Reuse the tools the other packs already ship. Do not eyeball a hook.

```bash
python3 ../ig-reel/hookscore.py --hook "one line"        # score one hook
python3 ../ig-reel/hookscore.py hooks.txt                # rank options
python3 ../ig-reel/beats.py script.txt --target 65       # timed beat sheet
```

## Before you write

1. Read `~/.claude/tiktok/voice.md` if it exists (same format as `../ig-reel/templates/voice.md`).
   If not, and the user has an Instagram or YouTube voice file, start from that and ask what is
   different on TikTok. Never write in a voice you have not read.
2. Never invent a number, a result, a quote or a source. Facts come with two sources
   (the `3d-story-shorts` rule). Mark a hypothesis as a hypothesis on screen.

## Decide the length first

Ask, or infer from the goal:

| Goal | Length | Why |
|---|---|---|
| Reach / growth | 20-45 s | Short videos finish more often; completion drives distribution. |
| **Creator Rewards money** | **61-90 s** | Third-party guides (Nov 2026) report only videos **over 1 minute** earn Creator Rewards, from qualified views (5 s+, not repeats). Check TikTok Studio's current terms before promising money. |
| Search / evergreen | 45-90 s | Room for the keyword to be spoken, shown and captioned. |

A 56-second video earns nothing in Creator Rewards. If the user wants money, the script must clear
61 s **without padding**: add a real beat (a second example, the "how we know" beat, a callback),
never a slower read or a dead outro.

## The shape

```
0:00-0:01  HOOK        motion in frame 1 + the claim, spoken AND on screen (different words)
0:01-0:05  THE STAKE   why the viewer should care, one line
...        BEATS       one idea each, the frame changes every 2-4 s, a number gets a counter
-6 s       THE TWIST   the turn the hook promised
-3 s       THE PAYOFF  deliver it, then ONE ask (follow for part 2 / comment a word / save)
LAST LINE  THE LOOP    end on a line the first line answers, so the replay is seamless
```

- No intro, no name, no "in this video". TikTok viewers swipe in under a second.
- Series beat retention: if the topic has more, end with "part 2" and make it.
- Spoken keyword: say the search phrase out loud in the first 5 s (TikTok search reads speech,
  on-screen text and the caption).

## On-screen text

- 6 words or fewer per card, up at frame 1.
- Keep text inside the safe zone. For one file posted to TikTok, Reels and Shorts, use the
  strictest box: **x 60-850, y 230-1440 on 1080x1920** (TikTok alone is roughly y 204-1578 and the
  right ~120 px clear; Instagram's interface covers more). `/tt-check` measures it.
- Burn in captions: most people start muted.

## Hand back

```
TIKTOK SCRIPT READY
hook:      "..."  scored NN (formula #N)
length:    NN s at 165 wpm  -> Creator Rewards: eligible length / too short by N s
beats:     N, frame change every N s
keyword:   "..." spoken at 0:0N, on screen at 0:0N
loop:      last line "..." -> first line "..."
next:      /tt-caption, then /tt-check final.mp4
```

Nothing is posted. The user uploads. Last line of every run: **ship it, or change it?**
