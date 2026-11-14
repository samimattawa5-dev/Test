#!/usr/bin/env python3
"""Lint every spoken line and on-screen text of a story against its fact list.
Usage: python3 claims.py story.json script.md
Flags: numbers not in the fact list, dropped qualifiers ("one of", "about", "may"...),
hypotheses stated as proven, causal words, time links ("around the same time") and count-up
counters that show unsourced in-between values. Heuristic: it points, a human decides."""
import json, re, sys

QUAL = ["one of", "among", "about", "around", "roughly", "nearly", "almost", "up to", "may", "might",
        "could", "likely", "possibly", "suggest", "hypothesis", "theory", "scientists think", "~", "≈"]
SUPERLATIVE = re.compile(r"\b(coldest|hottest|biggest|largest|smallest|first|only|oldest|fastest|most|least|never|always|every)\b", re.I)
PROVEN = re.compile(r"\b(proved?|proven|confirmed|definitely|certainly|left behind|caused|because of|was formed by|the reason)\b", re.I)
TIMELINK = re.compile(r"\b(around the same time|at the same time|right after|immediately|then)\b", re.I)
NUM = re.compile(r"(?<![\w.])(\d[\d,]*(?:\.\d+)?)")
WORDNUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
           "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "hundred": 100, "thousand": 1000, "million": 10**6, "billion": 10**9}

def words_to_numbers(text):
    """'twenty-one' -> 21, 'twenty-five million' -> 25000000 (enough for script narration)."""
    out = []; toks = re.findall(r"[a-z]+|\d[\d,]*", text.lower().replace("-", " "))
    cur = None
    for t in toks + ["_end"]:
        if t in WORDNUM or re.fullmatch(r"\d[\d,]*", t):
            v = WORDNUM.get(t) or int(t.replace(",", ""))
            if cur is None: cur = v
            elif v in (100, 1000, 10**6, 10**9): cur *= v
            else: cur += v
        else:
            if cur is not None: out.append(cur); cur = None
    return out

def nums(text):
    vals = {float(n.replace(",", "")) for n in NUM.findall(text)}
    vals |= {float(v) for v in words_to_numbers(text)}
    return vals

def main():
    if len(sys.argv) < 3: print(__doc__); sys.exit(1)
    story = json.load(open(sys.argv[1])); facts = open(sys.argv[2], encoding="utf-8").read()
    m = re.search(r"## Fact list.*", facts, re.S); facts = m.group(0) if m else facts
    fl = facts.lower(); fact_nums = nums(facts) | {v * 1e6 for v in nums(facts)}
    hypo = any(w in fl for w in ("hypothesis", "may have", "suggests", "not yet sufficient", "aren't convinced"))
    items = []
    for s in story["shots"]:
        items.append((s["start"], "VO", s["line"]))
        for o in s.get("overlays", []):
            if o["type"] == "counter":
                items.append((o["t0"], "COUNTER", f"{o.get('prefix', '')}{o['to']:,}{o.get('suffix', '')} {o.get('label', '')}"))
                if o.get("roll", True) and abs(o["to"] - o.get("from", 0)) > 50:
                    items.append((o["t0"], "FLAG", f"counter rolls {o.get('from', 0):,} -> {o['to']:,}: in-between frames show numbers no source gives. Set \"roll\": false (pop the final value) or keep the roll under 1 s and say so."))
            else:
                items.append((o["t0"], o["type"].upper(), o.get("text", "")))
    issues = 0
    print(f"Fact list: {len(fact_nums)} numbers, hypothesis topic: {'yes' if hypo else 'no'}\n")
    for t, kind, text in items:
        if kind == "FLAG": print(f"[{t:5.1f}s] FIX    {text}"); issues += 1; continue
        low = text.lower(); notes = []
        for n in nums(text):
            if n not in fact_nums and n > 3: notes.append(f"number {n:,.0f} not found in the fact list")
        sup = SUPERLATIVE.findall(text)
        if sup and not any(q in low for q in ("one of", "among", "about", "nearly", "almost", "close to")):
            for w in set(x.lower() for x in sup):
                pat = re.search(r"(one of|among)[^.\n]{0,40}" + w, fl)
                if pat: notes.append(f'"{w}" without the qualifier the source uses ("{pat.group(0)[:40]}...")')
                elif w not in ("every",): notes.append(f'superlative "{w}" - check the source says exactly this')
        if hypo and PROVEN.search(text) and not any(q in low for q in ("may", "might", "could", "idea", "if")):
            notes.append(f'"{PROVEN.search(text).group(0)}" states the hypothesis as fact - add may/could or "scientists think"')
        tl = TIMELINK.search(text)
        if tl and tl.group(0).lower() != "then": notes.append(f'time link "{tl.group(0)}" - check the dates in the sources really line up')
        for n_note in notes: print(f"[{t:5.1f}s] CHECK  {kind}: \"{text[:70]}\" -> {n_note}"); issues += 1
        if not notes: print(f"[{t:5.1f}s] ok     {kind}: \"{text[:70]}\"")
    print(f"\n{issues} item(s) to check by hand. No item here is proof of an error; each needs a look at the source.")
    sys.exit(1 if issues else 0)

if __name__ == "__main__":
    main()
