---
name: tt-caption
description: >-
  Write and lint a TikTok caption: the first line that survives the feed cut,
  the search keywords TikTok reads, 3-5 specific hashtags, one ask, and the AI
  disclosure reminder. Use for "TikTok caption", "TikTok description",
  "hashtags for TikTok", "TikTok SEO", or before uploading any TikTok.
---

# tt-caption

```bash
python3 caption.py caption.txt --keywords "earth rings,saturn"
```

The linter prints what the feed shows before "more" (~150 characters), then every FAIL and WARN.

## Before you write

Read `~/.claude/tiktok/voice.md` if it exists. Never invent a number or a claim.

## The shape

```
Line 1     the hook or the question, in the words people search. ~150 chars visible.
Line 2-3   context + the keyword phrase as a normal sentence.
The ask    one: comment a word, follow for part 2, or save.
Hashtags   3-5 specific ones at the end. Topic labels, not reach hacks.
```

## Rules (from the guides checked Nov 2026; verify limits in the app - sources disagree)

- **Length:** stay under **2,200 characters** (the API limit; the app reportedly allows more).
  Almost nothing needs more than 300.
- **Keywords beat hashtags.** TikTok search reads the caption text, the on-screen text and the
  speech. Put the phrase a person would type into line 1 or 2, spelled the way they type it.
- **3-5 hashtags**, specific to the topic. `#fyp #foryou #foryoupage #viral #xyzbca` describe
  nothing: the linter fails them.
- **No links** - captions are not clickable. Bio or comment.
- **One ask.** The linter counts them.
- **AI disclosure:** if the voice, the characters or the images are AI-generated and realistic,
  switch on TikTok's AI-generated content label when uploading. The caption is not the label.
- **Facts:** a hypothesis stays a hypothesis in the caption too ("may have", "scientists think").

## Hand back

The caption in a copy block, then:

```
CAPTION READY
visible:   NNN of ~150 characters before "more"
keywords:  "..." in line N
hashtags:  N
ask:       one - ...
AI label:  switch ON at upload (voice is AI-generated)
linter:    READY / N warnings
```

Nothing is posted. Last line: **ship it, or change it?**
