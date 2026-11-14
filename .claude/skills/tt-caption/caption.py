#!/usr/bin/env python3
"""Lint a TikTok caption. Usage: python3 caption.py caption.txt [--keywords "a,b"]
Prints the part the feed shows before "more", then FAIL / WARN lines and a verdict."""
import re, sys

VISIBLE = 150
HARD = 2200
GENERIC = {"fyp", "foryou", "foryoupage", "viral", "xyzbca", "fypシ", "trending", "explore", "explorepage", "tiktok"}
ASKS = [r"\bcomment\b", r"\bfollow\b", r"\bsave\b", r"\bshare\b", r"\blink in bio\b", r"\bdm\b", r"\bsubscribe\b"]
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿]")

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    text = open(sys.argv[1], encoding="utf-8").read().strip()
    kws = []
    if "--keywords" in sys.argv:
        kws = [k.strip().lower() for k in sys.argv[sys.argv.index("--keywords") + 1].split(",") if k.strip()]
    fails, warns = [], []
    print("FEED SHOWS (before 'more'):")
    print("+" + "-" * 62 + "+")
    vis = text[:VISIBLE].replace("\n", " / ")
    for i in range(0, len(vis), 60):
        print("| " + vis[i:i + 60].ljust(60) + " |")
    print("+" + "-" * 62 + "+")
    n = len(text)
    if n > HARD: fails.append(f"{n} characters - over the {HARD} API limit")
    elif n > 600: warns.append(f"{n} characters - almost nothing needs more than ~300")
    first = text.splitlines()[0] if text else ""
    if first.startswith("#"): fails.append("line 1 starts with a hashtag - line 1 is the hook")
    if re.match(r"^\s*(hi|hey|hello)\b", first, re.I): fails.append("line 1 is a greeting")
    tags = re.findall(r"#(\w+)", text, re.U)
    bad = [t for t in tags if t.lower() in GENERIC]
    if bad: fails.append("generic hashtags that describe nothing: " + ", ".join("#" + t for t in bad))
    if len(tags) > 5: warns.append(f"{len(tags)} hashtags - keep 3-5 specific ones")
    if len(tags) < 3: warns.append(f"{len(tags)} hashtags - 3-5 specific topic labels help TikTok file the video")
    if re.search(r"https?://|www\.", text): fails.append("a link in the caption - not clickable, put it in bio or a comment")
    asks = sum(bool(re.search(a, text, re.I)) for a in ASKS)
    if asks > 1: warns.append(f"{asks} asks - keep one")
    if asks == 0: warns.append("no ask - add one (comment a word / follow for part 2 / save)")
    em = len(EMOJI.findall(text))
    if n and em / max(1, n) * 100 > 4: warns.append(f"{em} emoji - over 4 per 100 characters")
    body = re.sub(r"#\w+", "", text).lower()
    for k in kws:
        if k not in body: fails.append(f'keyword "{k}" is not in the caption text (hashtags do not count)')
        elif k not in body[:VISIBLE + 100]: warns.append(f'keyword "{k}" appears only after the first lines')
    for f in fails: print("FAIL  " + f)
    for w in warns: print("WARN  " + w)
    print(f"\n{n} chars, {len(tags)} hashtags, {asks} ask(s), {em} emoji")
    print("VERDICT: " + ("FIX FIRST" if fails else ("READY (check warnings)" if warns else "READY")))
    sys.exit(1 if fails else 0)

if __name__ == "__main__":
    main()
