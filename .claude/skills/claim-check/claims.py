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
    total = cur = None
    for t in toks + ["_end"]:
        if t in WORDNUM or re.fullmatch(r"\d[\d,]*", t):
            v = WORDNUM.get(t) or int(t.replace(",", ""))
            total = total or 0; cur = cur or 0
            if v == 100: cur = (cur or 1) * 100
            elif v >= 1000: total += (cur or 1) * v; cur = 0
            else: cur += v
        else:
            if total is not None: out.append(total + (cur or 0)); total = cur = None
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
    # base rate: an odds / probability number needs its premise (the share of land, the expected rate) said near it
    allvo = " ".join(s["line"].lower() for s in story["shots"])
    for s in story["shots"]:
        for o in s.get("overlays", []):
            txt = (o.get("prefix", "") + " " + o.get("label", "") + " " + o.get("text", "")).lower()
            if re.search(r"\b1 in\b|odds|chance", txt) and not re.search(r"\bonly\b|third|half|quarter|percent|%|expected|would have", allvo):
                items.append((o["t0"], "FLAG", "odds shown without the base rate that makes them meaningful (e.g. how much land was near the equator) - add the premise in voice or a badge"))
    # picture claims: what the map says (city colours, routes) must agree with the words in the same shot
    for sh in story["shots"]:
        for pr in sh.get("props", []):
            if pr.get("type") != "map": continue
            words = (sh["line"] + " " + " ".join(o.get("text", "") for o in sh.get("overlays", []))).lower()
            spared = re.search(r"not affected|spared|did not need|didn't need|no grain", words)
            routed = {r.get("to") for r in pr.get("routes", []) if not r.get("faded")}
            for c in pr.get("cities", []):
                state = "RED (plague)" if c.get("redAt") is not None else "GREEN (spared)" if c.get("safe") else "gold"
                items.append((sh["start"], "PICTURE", f"map: {c['id'].upper()} {state}" + (" on a route" if c["id"] in routed else "")))
                if c.get("redAt") is not None and not any(c["id"] in x["line"].lower() and re.search(r"plague|death|cases", x["line"].lower()) for x in story["shots"]):
                    items.append((sh["start"], "FLAG", f"the map marks {c['id'].title()} RED (plague) but no spoken line names plague in {c['id'].title()} - every coloured marker needs a sourced line; keep it neutral"))
                if spared and c["id"] in words and (c.get("redAt") is not None or c["id"] in routed or not c.get("safe")):
                    items.append((sh["start"], "FLAG", f"the words say {c['id'].title()} was spared but the map shows it {state}" + (" on a route" if c["id"] in routed else "") + " - mark it safe (green) and off the routes"))
    issues = 0
    print(f"Fact list: {len(fact_nums)} numbers, hypothesis topic: {'yes' if hypo else 'no'}\n")
    for t, kind, text in items:
        if kind == "FLAG": print(f"[{t:5.1f}s] FIX    {text}"); issues += 1; continue
        if kind == "PICTURE": print(f"[{t:5.1f}s] pic    {text}"); continue
        low = text.lower(); notes = []
        for n in nums(text):
            if n not in fact_nums and n > 3: notes.append(f"number {n:,.0f} not found in the fact list")
        sup = [w for w in SUPERLATIVE.findall(text) if not re.search(r"\bmost\s+(likely|probably)\b", low) or w.lower() != "most"]  # "most likely/probably" are hedges, not superlatives
        if sup and not any(q in low for q in ("one of", "among", "about", "nearly", "almost", "close to")):
            for w in set(x.lower() for x in sup):
                pat = re.search(r"(one of|among)[^.\n]{0,40}" + w, fl)
                if pat: notes.append(f'"{w}" without the qualifier the source uses ("{pat.group(0)[:40]}...")')
                elif w not in ("every",): notes.append(f'superlative "{w}" - check the source says exactly this')
        pm = PROVEN.search(text)
        if pm and re.search(r"\b(not|n't|never|isn't|aren't|unproven)\W+(yet\W+)?$", text[:pm.start()].lower()): pm = None
        if hypo and pm and not any(q in low for q in ("may", "might", "could", "idea", "if")):
            notes.append(f'"{PROVEN.search(text).group(0)}" states the hypothesis as fact - add may/could or "scientists think"')
        tl = TIMELINK.search(text)
        if tl and tl.group(0).lower() != "then": notes.append(f'time link "{tl.group(0)}" - check the dates in the sources really line up')
        for n_note in notes: print(f"[{t:5.1f}s] CHECK  {kind}: \"{text[:70]}\" -> {n_note}"); issues += 1
        if not notes: print(f"[{t:5.1f}s] ok     {kind}: \"{text[:70]}\"")
    print(f"\n{issues} item(s) to check by hand. No item here is proof of an error; each needs a look at the source.")
    sys.exit(1 if issues else 0)

if __name__ == "__main__":
    main()
