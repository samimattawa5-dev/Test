---
name: history-mystery-short
description: Make a history-mystery Short exactly like "Did a Volcano Bring the Black Death to Europe?" (videos/volcano-plague) - same round cartoon cast, night-harbour mood, story structure, overlays, voice, music, checks, 7-agent review and upload pack. Use for any new video on the history channel, "متل فيديو البركان", "same as the volcano video", a hidden-cause history story, or when make-short picks the History mystery channel.
---

# history-mystery-short - the volcano-plague recipe

Reference build: `videos/volcano-plague/` (story, voice, decisions, upload pack). Example files are copied in
`template/` (`make_story_example.py`, `make_voice_example.py`, `DECISIONS_example.md`, `fill_upload_example.py`,
`PUBLISH_AR_example.md`). Start a new video by copying the 3d-story-shorts template into `videos/<slug>/`, then copy and
adapt these examples. General steps, checks and review loop: `make-short`. This file fixes the LOOK and the STRUCTURE.

## Look (keep identical across the channel)
- `"style": "soft"`, `"preset": "mystery"`, round cast (not blocky). Music: `tools/make_bed.py ... --mood tense`.
- Cast (copy `CAST` from the example): **Hist** (green, glasses, tuft), **Clim** (orange, bob), **Bo** (yellow, small, blue cap),
  **Mara** (purple, long hair), **Tomas** (blue, white cap), **folk** (red, bun). Fiction note in script.md: illustrative, not real people.
- Worlds: `harbour` (night, red Moon), `harbourday` (sunny quay), `studio` (map), `lab`, `ice`, `space` (globe), `rainfield`.
- Voice: Kokoro `bm_george`, speed 1.08, polish chain from the example; captions 3 words, red keywords, `capBottom` per shot.

## Story structure (about 72-76 s, 22-24 shots)
| Beat | Time | Pattern from the volcano video |
|---|---|---|
| Hook | 0-3.5 s | Night set with the red Moon, the subject visible (erupting volcano far on the horizon), title = strongest true claim with its hedge and exact scope ("A VOLCANO MAY HAVE BROUGHT THE BLACK DEATH TO EUROPE") + badge "HYPOTHESIS · 2025 STUDY"; no word captions under the title. |
| Paradox | 3.5-6 s | Second line states the irony ("Through the grain meant to save them") over its picture, badge carries it. |
| Stakes number | 6-9 s | Counter with every source hedge ("UP TO 60% · IN SOME REGIONS") over windows going dark. |
| Open question | by 10 s | Title "SOME ITALIAN CITIES MAY HAVE BEEN SPARED. WHY?". |
| Clues | 12-34 s | 3 clues, 2-4 s shots, `chain` overlay at the top gaining one link per clue (VOLCANO? -> COLD -> NO CROPS -> GRAIN SHIPS -> ?), study badge rides on clue 1, each number has a picture (ice-core band glows, tree ring lights up). |
| Turn | about 40 s | Hard cut on the turn word ("problem"): sunny quay -> night harbour, faces drop; chain's "?" turns red "PLAGUE?". |
| Gap | 42-45 s | `timeline` bar LAST SHIP -> VENICE: PLAGUE, fills and turns red, houses go dark. |
| Twist event | 45-52 s | Street goes dark + shutters; the mechanism appears only with its hedge ("MOST LIKELY: FLEAS IN THE GRAIN DUST"). |
| Map payoff | 52-58 s | Map: only sourced colours (red = reported cases, gold = also imported, green = "APPARENTLY NO IMPORTS NEEDED AFTER 1345"), keys as badges at the top, captions low. |
| Doubt | 59-64 s | "Nobody knows which ... And some historians are cautious." + HYPOTHESIS badge; globe with candidate markers only in the sourced region. |
| Comment question | 64-71 s | Two sides, no hindsight: "Your city is starving. Grain ships arrive. Nobody knows they carry plague. Open the port?" title + YES/NO badges. |
| Loop | last 1 s | Same camera, set and cast as frame 0; title + badge `instant: true`, `capUntil`; last line leads into frame 0 ("...begun with a sky like this"). |

## Lessons that are now rules (from 8 review rounds)
- Every map colour, legend, badge and prop (rats, fleas, a volcano's position) is a claim: it needs a numbered fact and the
  source's hedge, shown no earlier than the hedged line.
- Scope exactly as the source (to Europe, Italian cities); never "started" when the source says "brought".
- Counters do not roll through unsourced numbers (`roll: false`); years print without commas.
- Text inside x 65-950, y 115-1536; no overlay over another overlay, a face or a map label; `--verify` must say OK.
- Keep `DECISIONS.md` current after every round so reviewers do not flip settled choices.
- Upload: AI label on every platform, captions linted, sources + DOI in the description / pinned comment, `PUBLISH_AR.md`.
