#!/usr/bin/env python3
"""Check that every key spoken word has its picture on screen when it is said.
Usage: python3 check.py story.json"""
import json, re, sys
from collections import Counter

STOP = set("""a an the and or but so of to in on at for from by with as is are was were be been being it its this that these those
there their they them he she we you your i me my our us his her not no yes may might could would will can do does did have has had
than then too very just also only more most some any all each every one two three four five six seven eight nine ten into out up
down over under after before about around again what which who whom why how when where if while because like look""".split())

def norm(w): return re.sub(r"[^a-z0-9]", "", w.lower())

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    story = json.load(open(sys.argv[1])); must = {norm(k): v for k, v in story.get("mustShow", {}).items()}
    missing = 0; seen = Counter()
    for i, sh in enumerate(story["shots"], 1):
        for w in sh.get("words", []):
            k = norm(w["w"])
            if not k: continue
            if k not in STOP and len(k) > 3: seen[k] += 1
            if k not in must: continue
            t = w["t0"]; ok = None
            for p in sh.get("props", []):
                if norm(p.get("cueWord", "")) == k: ok = f"cue prop {p.get('type')}"; break
                if norm(p.get("type", "")) == k or norm(p.get("type", "")).rstrip("s") == k.rstrip("s"): ok = f"prop {p.get('type')}"; break
            if not ok:
                for o in sh.get("overlays", []):
                    txt = norm(" ".join(str(o.get(x, "")) for x in ("text", "label", "prefix", "suffix", "to", "left", "right")))
                    if k in txt and o.get("t0", 0) - 0.6 <= t <= o.get("t1", 1e9): ok = f"{o['type']} overlay"; break
            if ok: print(f"[{t:5.1f}s] ok       '{w['w']}' -> {ok}")
            else: print(f"[{t:5.1f}s] MISSING  '{w['w']}' (shot {i}) needs: {must[k]}"); missing += 1
    extra = [w for w, n in seen.most_common() if w not in must][:25]
    print("\nContent words with no mustShow entry (add the concrete ones):", ", ".join(extra) or "none")
    print(f"\n{missing} key word(s) without a picture.")
    sys.exit(1 if missing else 0)

if __name__ == "__main__":
    main()
