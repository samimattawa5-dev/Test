---
name: word-visuals
description: Make every important spoken word show its picture at the moment it is said (sea -> sea, wave -> wave, tree -> tree, a number -> a counter) in a 3d-story-shorts video, and check that none is missing. Use when the user wants "every word to have a visual", "show what he says", word-synced visuals, or before review of any story.json.
---

# word-visuals

The rule: when the voice says a concrete word, the viewer sees that thing within half a second.
Sound-off viewers (most of the first second) then still follow the story.

## 1. Mark the key words in story.json

Top level:
```json
"mustShow": {"ocean": "sea plane with waves", "salt": "white salt crystals", "waterfall": "waterfall", "1345": "counter"}
```
Key = a word (or number) as spoken; value = what must be on screen. Take them from the
"key words -> visuals" column of script.md.

## 2. Give each one a cue

In a shot, `cues` pop a prop in exactly on its word (the builder turns `word` into a time):
```json
"cues": [{"word": "salt", "prop": {"type": "salt", "pos": [0,0,1]}}]
```
In tools/make_story.py use the helper pattern:
```python
def cue(word, line, prop, hold=None):
    t = wt(word, lt(line)[0])
    return {**prop, "appear": dict(t0=t - 0.05, t1=t + 0.3, grow=True), "cueWord": word}
```
`appear.grow` pops the prop in with a small overshoot and keeps its own scale. A word can also be
covered by an overlay (counter, badge, title) whose text contains it, or by a prop already in the
shot whose `cueWord` names it.

## 3. Check

```bash
python3 .claude/skills/word-visuals/check.py story.json
```
For every `mustShow` word that is spoken it looks for a cue prop (`cueWord`), an overlay whose text
contains the word, or a prop of a matching type in the same shot, timed within 0.6 s of the word.
It prints MISSING lines (fix them before review) and lists frequent content words that have no
`mustShow` entry yet, so nothing concrete is forgotten.
