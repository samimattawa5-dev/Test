import json, re, sys
out = sys.argv[1]
L = json.load(open(f"{out}/vo_lines.json"))
END = L[-1]["t1"] + 0.3

WORDS = []
for ln in L:
    ws = ln["line"].split(); wt_ = [len(w) + 2 for w in ws]; tot = sum(wt_); t = ln["t0"]
    for w, x in zip(ws, wt_):
        d = (ln["t1"] - ln["t0"]) * x / tot; WORDS.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)}); t += d
def wt(word, after=0.0):
    for w in WORDS:
        if w["t0"] >= after and re.sub(r"[^a-z0-9-]", "", w["w"].lower()) == word.lower(): return w["t0"]
    raise SystemExit("word not found: " + word)
def lt(i): return L[i - 1]["t0"], L[i - 1]["t1"]

CAST = {
 "hist":  dict(color="#3c8a4f", glasses=True, hair=dict(style="tuft", color="#5a3a22"), skin="#e8b48c"),
 "clim":  dict(color="#ff8c3a", hair=dict(style="bob", color="#2a1a12"), skin="#c98e62"),
 "bo":    dict(color="#ffd86b", hair=dict(style="cap", color="#4a90e2"), skin="#f6c9a8", scale=0.7),
 "mara":  dict(color="#9b59b6", hair=dict(style="long", color="#5a3a22"), skin="#f9d7bd"),
 "tomas": dict(color="#2f6db5", hair=dict(style="cap", color="#f4f4ef"), skin="#c98e62"),
 "folk":  dict(color="#c0392b", hair=dict(style="bun", color="#3a2618"), skin="#8f5a3a"),
}
def ch(name, pos, anim, **k): return dict(cast=name, pos=pos, anim=anim, **k)
E = lambda **k: {**dict(type="earth", size=[3], pos=[0, 0, 0], spin=0.15, barren=False), **k}
MOON = lambda **k: {**dict(type="moon", size=[12], pos=[-1.5, 15, -34]), **k}
SHIP = lambda **k: {**dict(type="ship", size=[5], pos=[4.2, -0.3, -5.5], rot=[0, 0.25, 0], cross=True), **k}

# one shot per spoken line (21 lines), cut a hair before each line
b = [0] + [round(lt(i)[0] - 0.12, 2) for i in range(2, 22)] + [END]
s = lambda i: b[i - 1]; e = lambda i: b[i]   # shot i start / end

SH = [
 # 1 hook: red eclipsed Moon over the harbour, grain ship, the claim on frame 0
 dict(world="harbour", characters=[ch("bo", [-0.9, 0, 1.6], "point", expr="wow", wander=False), ch("tomas", [0.8, 0, 1.2], "lookup", expr="wow")],
      props=[MOON(), SHIP()], camera={"from": [0, 1.0, 9.5], "to": [0, 1.2, 8.6], "look": [-0.6, 6.5, -10]}, energy=1, shimmer=True,
      overlays=[dict(type="title", text="A VOLCANO BROUGHT THE PLAGUE?", t0=-0.6, t1=e(1) + 0.2, y=220, size=96),
                dict(type="badge", text="HYPOTHESIS · 2025 STUDY", t0=1.0, t1=e(1), y=600, size=46, accent="#444444")]),
 # 2 you've never heard of it: an unknown eruption somewhere in the tropics
 dict(world="space", props=[E(spin=0.3), dict(type="volcano", size=[0.5, 0.5], pos=[0.1, 0.05, 1.52], rot=[1.5, 0, 0], erupt=s(2) + 0.2)],
      camera={"from": [0.4, 0.4, 6.2], "to": [0.2, 0.2, 5.2], "look": [0, 0, 0.6]}, energy=1,
      overlays=[dict(type="badge", text="THE VOLCANO: UNKNOWN", t0=s(2) + 0.3, t1=e(2), y=420, size=50, accent="#6b4226")]),
 # 3 up to 60% in some regions: windows go dark, no people
 dict(world="harbour", props=[dict(type="houses", size=[9], n=5, pos=[0, 0, -2], dark=dict(t0=s(3) + 0.3, t1=e(3) - 0.4, n=6), shutters=True)],
      camera={"from": [0, 2.6, 8], "to": [0, 2.4, 7], "look": [0, 2.0, -2]}, energy=1,
      overlays=[dict(type="counter", **{"from": 60}, to=60, prefix="UP TO ", suffix="%", roll=False, size=130, label="IN SOME REGIONS", t0=wt("sixty", lt(3)[0]) - 0.2, t1=e(3), y=260)]),
 # 4 some big cities spared - why? (open loop, no names)
 dict(world="harbour", characters=[ch("mara", [-0.9, 0, 1.0], "shrug", expr="worried"), ch("tomas", [0.9, 0, 1.0], "shrug", expr="neutral")],
      props=[dict(type="houses", size=[12], n=6, pos=[0, 0, -6])], camera={"from": [-1.5, 2.2, 8], "to": [1.5, 2.2, 7.5], "look": [0, 1.6, -2]}, energy=1,
      overlays=[dict(type="title", text="WHY?", t0=wt("why", lt(4)[0]) - 0.2, t1=e(4), y=300, size=150, color="#FFE14D")]),
 # 5 2025: two researchers follow the clues
 dict(world="lab", characters=[ch("hist", [-1.0, 0, 0.9], "talk", to=[-0.7, 0, 1.1], walk=dict(t0=s(5), t1=s(5) + 1.1)), ch("clim", [1.0, 0, 0.9], "point", expr="grin")],
      props=[dict(type="box", color="#e9eef2", size=[3, 0.1, 1.3], pos=[0, 1.05, -1.2]), dict(type="box", color="#7d8a96", size=[2.8, 1, 1.1], pos=[0, 0.5, -1.2])],
      camera={"from": [0, 2.2, 8.8], "to": [0, 2.1, 8.0], "look": [0, 1.4, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 2025}, to=2025, roll=False, size=150, label="NEW STUDY", t0=s(5) + 0.2, t1=s(5) + 1.8, y=260),
                dict(type="badge", text="STUDY: BAUCH & BÜNTGEN · DEC 2025", t0=s(5) + 1.8, t1=e(5), y=300, size=48, accent="#2f6db5")]),
 # 6 clue 1: ice core with a sulphur band around 1345
 dict(world="ice", characters=[ch("clim", [-0.9, 0, 0.8], "kneel", expr="wow", face=25)],
      props=[dict(type="icecore", size=[0.32, 2.6], pos=[0.6, 1.2, 0.8], rot=[0, 0, 0.35], bandAt=0.12, glowAt=wt("spike", lt(6)[0]))],
      camera={"from": [0, 1.8, 6.2], "to": [0.2, 1.6, 5.4], "look": [0, 1.1, 0.5]}, energy=1,
      overlays=[dict(type="badge", text="CLUE 1: ICE CORES", t0=s(6) + 0.1, t1=wt("around", lt(6)[0]) - 0.1, y=420, size=50, accent="#2f9bff"),
                dict(type="counter", **{"from": 1345}, to=1345, prefix="AROUND ", roll=False, size=110, label="SULPHUR SPIKE", t0=wt("around", lt(6)[0]) - 0.1, t1=e(6), y=280)]),
 # 7 an eruption, or series of eruptions
 dict(world="space", props=[E(spin=0.25), dict(type="volcano", size=[0.5, 0.5], pos=[-0.35, 0.05, 1.48], rot=[1.5, 0, 0.2], erupt=s(7) + 0.1),
                            dict(type="volcano", size=[0.45, 0.45], pos=[0.4, -0.15, 1.45], rot=[1.6, 0, -0.25], erupt=s(7) + 1.1),
                            dict(type="volcano", size=[0.4, 0.4], pos=[0.05, -0.45, 1.42], rot=[1.8, 0, 0], erupt=s(7) + 1.9),
                            dict(type="shadowband", size=[3, 1.2], pos=[0, 0, 0], color="#c9c3b5", opacity=0.35, appear=dict(t0=s(7) + 1.2, t1=e(7)))],
      camera={"from": [0.3, 0.2, 6.8], "to": [0, 0.1, 5.6], "look": [0, -0.1, 0.5]}, energy=2,
      overlays=[dict(type="badge", text="ONE OR MORE ERUPTIONS · LIKELY TROPICAL", t0=s(7) + 0.2, t1=e(7), y=420, size=46, accent="#6b4226")]),
 # 8 clue 2: pale blue ring in Pyrenees trees
 dict(world="lab", characters=[ch("hist", [-0.45, 0, 1.2], "inspect", hold="magnifier", expr="wow")],
      props=[dict(type="treering", size=[2.2, 0.35], pos=[0.6, 1.7, -0.2], glowAt=wt("blue", lt(8)[0]))],
      camera={"from": [0, 1.9, 6.8], "to": [0.2, 1.8, 6.0], "look": [0.2, 1.5, 0]}, energy=1,
      overlays=[dict(type="badge", text="CLUE 2: PYRENEES TREE RINGS", t0=s(8) + 0.1, t1=e(8), y=380, size=50, accent="#2f9bff")]),
 # 9 cold, wet summers
 dict(world="rainfield", characters=[ch("bo", [-0.6, 0, 1.0], "shiver", expr="worried"), ch("mara", [0.6, 0, 0.8], "hug", expr="worried")],
      props=[dict(type="frost", size=[7], pos=[0, 0.05, 0], appear=dict(t0=s(9), t1=e(9), grow=True))] + [dict(type="sphere", color="#9fd3ff", size=[0.06], pos=[x, 0, z], fall=6) for x, z in [(-2, 0), (-1, -1), (0.5, 0.5), (1.6, -0.6), (0, 1.6), (-1.4, 1), (2.2, 1), (1, -2), (-2.4, -1.5)]],
      camera={"from": [0, 2.0, 7], "to": [0, 1.9, 6.4], "look": [0, 1.1, 0]}, energy=1,
      overlays=[dict(type="badge", text="COLD, WET SUMMERS", t0=s(9) + 0.1, t1=e(9), y=420, size=54, accent="#4a6a8a")]),
 # 10 clue 3: writers saw strange clouds and dark lunar eclipses
 dict(world="harbour", characters=[ch("hist", [0, 0, 1.2], "lookup", expr="wow", actions=[dict(t=s(10), anim="lookup"), dict(t=s(10) + 2.6, anim="talk")])],
      props=[MOON(pos=[1.5, 8, -30]), SHIP(pos=[-3, -0.3, -5])], camera={"from": [1.2, 1.2, 7.5], "to": [0.4, 1.4, 6.6], "look": [0.6, 4.5, -8]}, energy=1,
      overlays=[dict(type="badge", text="CLUE 3: WRITTEN ACCOUNTS", t0=s(10) + 0.2, t1=e(10), y=600, size=50, accent="#2f9bff")]),
 # 11 crops could have failed
 dict(world="rainfield", characters=[ch("mara", [0.4, 0, 1.4], "no", expr="worried")],
      props=[dict(type="wheat", size=[5], n=60, pos=[0, 0, -0.6], wilt=dict(t0=s(11) + 0.2, t1=e(11) - 0.3))],
      camera={"from": [0, 1.6, 6.5], "to": [0, 1.4, 5.6], "look": [0, 0.9, 0]}, energy=1,
      overlays=[dict(type="badge", text="CROPS COULD HAVE FAILED", t0=s(11) + 0.2, t1=e(11), y=420, size=50, accent="#8a6a2a")]),
 # 12 1347: Venice, Genoa and Pisa import Black Sea grain (map, routes draw on)
 dict(world="studio", props=[dict(type="map", size=[7.5], pos=[0, 0, 0], view=[4, 42],
        cities=[dict(id="tana", t0=s(12)), dict(id="venice", t0=wt("venice", lt(12)[0])), dict(id="genoa", t0=wt("genoa", lt(12)[0])), dict(id="pisa", t0=wt("pisa", lt(12)[0]))],
        routes=[dict(to="venice", t0=wt("imported", lt(12)[0]) - 0.3, t1=e(12) + 0.8), dict(to="genoa", t0=wt("imported", lt(12)[0]), t1=e(12) + 1.0), dict(to="pisa", t0=wt("imported", lt(12)[0]) + 0.2, t1=e(12) + 1.2)])],
      camera={"from": [0, 0, 14.5], "to": [0, 0, 13.2], "look": [0, 0, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 1347}, to=1347, roll=False, size=120, label="GRAIN FROM THE BLACK SEA", t0=s(12) + 0.2, t1=e(12), y=300)]),
 # 13 food for the hungry: sacks come ashore, people cheer
 dict(world="harbourday", characters=[ch("tomas", [-1.2, 0, 1.0], "throw", expr="grin"), ch("bo", [0.1, 0, 1.4], "jump", expr="grin", wander=False), ch("mara", [1.2, 0, 1.0], "cheer", expr="grin")],
      props=[SHIP(pos=[0, -0.3, -4.5])] + [dict(type="sack", size=[0.55], pos=[x, 0.3, z]) for x, z in [(-2.2, 0.2), (-1.8, -0.4), (2.0, 0.0), (2.4, -0.5), (0, -1.2)]],
      camera={"from": [0, 2.0, 8.6], "to": [0, 1.9, 7.8], "look": [0, 1.4, 0]}, energy=2, shimmer=True),
 # 14 less than two months after the last grain ships (music drops)
 dict(world="harbourday", props=[SHIP(pos=[-6, -0.3, -4.5], move=[0, -0.3, -4.5])] + [dict(type="sack", size=[0.55], pos=[x, 0.3, z]) for x, z in [(-2.2, 0.2), (2.0, 0.0)]],
      camera={"from": [0, 1.6, 9], "to": [0, 1.7, 8.2], "look": [0, 1.6, -3]}, drop=True,
      overlays=[dict(type="counter", **{"from": 2}, to=2, prefix="< ", suffix=" MONTHS", roll=False, size=120, label="AFTER THE LAST GRAIN SHIPS", t0=s(14) + 0.3, t1=e(14), y=280)]),
 # 15 the twist: Venice reports plague - map dot turns red, then shutters close
 dict(world="studio", props=[dict(type="map", size=[7.5], pos=[0, 0, 0], view=[4, 42],
        cities=[dict(id="tana"), dict(id="venice", redAt=wt("venice", lt(15)[0])), dict(id="genoa"), dict(id="pisa")],
        routes=[dict(to="venice", t0=0, t1=0.01, redAt=wt("venice", lt(15)[0])), dict(to="genoa", t0=0, t1=0.01), dict(to="pisa", t0=0, t1=0.01)])],
      camera={"from": [-1.6, 0.9, 5.5], "to": [-2.1, 1.1, 2.6], "look": [-2.1, 1.1, 0]}, kicks=[wt("venice", lt(15)[0])],
      overlays=[dict(type="title", text="THE TWIST", t0=s(15) - 0.1, t1=e(15), y=280, size=124, color="#FFE14D")]),
 # 16 fleas in the grain dust (no people)
 dict(world="harbour", props=[dict(type="sack", size=[1.6], pos=[0, 0.8, 0]), dict(type="rat", pos=[1.3, 0, 0.6], rot=[0, -2.4, 0])]
      + [dict(type="flea", pos=[x, 1.2, z], hop=dict(h=0.7 + 0.2 * k, speed=1.6 + 0.2 * k, phase=0.13 * k, dx=0.8)) for k, (x, z) in enumerate([(-0.4, 0.7), (0.2, 0.8), (0.5, 0.5), (-0.1, 0.9), (0.8, 0.7)])],
      camera={"from": [0.2, 1.4, 4.2], "to": [0.4, 1.2, 3.4], "look": [0.3, 0.9, 0]}, energy=1,
      overlays=[dict(type="badge", text="MOST LIKELY: FLEAS IN THE GRAIN DUST", t0=s(16) + 0.2, t1=e(16), y=420, size=46, accent="#6b4226")]),
 # 17 Milan and Rome did not import: they stay gold
 dict(world="studio", props=[dict(type="map", size=[7.5], pos=[0, 0, 0], view=[4, 42],
        cities=[dict(id="venice", redAt=0), dict(id="genoa", redAt=0), dict(id="pisa", redAt=0), dict(id="milan", t0=wt("milan", lt(17)[0])), dict(id="rome", t0=wt("rome", lt(17)[0]))],
        routes=[dict(to="venice", t0=0, t1=0.01, redAt=0), dict(to="genoa", t0=0, t1=0.01, redAt=0), dict(to="pisa", t0=0, t1=0.01, redAt=0)])],
      camera={"from": [-2.2, 0.8, 3.4], "to": [-2.3, 0.7, 2.9], "look": [-2.3, 0.7, 0]}, energy=1,
      overlays=[dict(type="badge", text="NO GRAIN IMPORTS NEEDED", t0=wt("did", lt(17)[0]), t1=e(17), y=300, size=50, accent="#c99a2e")]),
 # 18 most probably not affected: lamps stay lit, people wave
 dict(world="harbourday", characters=[ch("mara", [-1.0, 0, 1.0], "wave", expr="grin"), ch("folk", [0.2, 0, 1.3], "cheer", expr="grin"), ch("bo", [1.1, 0, 1.2], "jump", expr="grin", wander=False)],
      props=[dict(type="houses", size=[12], n=6, pos=[0, 0, -4])], camera={"from": [1.2, 2.0, 8.6], "to": [-0.8, 2.0, 8.0], "look": [0, 1.5, 0]}, energy=1,
      overlays=[dict(type="badge", text="MOST PROBABLY NOT AFFECTED", t0=s(18) + 0.1, t1=e(18), y=420, size=50, accent="#2fbf71")]),
 # 19 nobody knows which volcano
 dict(world="space", characters=[], props=[E(spin=0.3), dict(type="volcano", size=[0.5, 0.5], pos=[0.1, 0.05, 1.52], rot=[1.5, 0, 0])],
      camera={"from": [-0.4, 0.5, 6.5], "to": [0, 0.3, 5.6], "look": [0, 0, 0.6]}, energy=1,
      overlays=[dict(type="title", text="WHICH VOLCANO?", t0=s(19) + 0.1, t1=e(19), y=300, size=110, color="#FFE14D"),
                dict(type="badge", text="HYPOTHESIS · SOME HISTORIANS ARE CAUTIOUS", t0=s(19) + 0.6, t1=e(19), y=560, size=46, accent="#444444")]),
 # 20 the volcano, or the trade? (split argument)
 dict(world="lab", characters=[ch("clim", [-1.2, 0, 1.0], "point", expr="grin"), ch("mara", [0.4, 0, 1.2], "talk", expr="smile"), ch("hist", [1.4, 0, 0.9], "nod", expr="smile")],
      props=[dict(type="volcano", size=[0.6, 0.6], pos=[-1.9, 1.3, 0.3], erupt=s(20) + 0.3), dict(type="sack", size=[0.6], pos=[2.1, 0.3, 0.2])],
      camera={"from": [0.8, 2.1, 8.6], "to": [-0.6, 2.1, 8.0], "look": [0, 1.4, 0]}, energy=2,
      overlays=[dict(type="title", text="VOLCANO OR TRADE?", t0=s(20) + 0.2, t1=e(20), y=280, size=110, color="#FFE14D")]),
 # 21 look at that Moon again -> lands on frame 0
 dict(world="harbour", characters=[ch("bo", [-0.9, 0, 1.6], "point", expr="wow", wander=False), ch("tomas", [0.8, 0, 1.2], "lookup", expr="wow")],
      props=[MOON(), SHIP()], camera={"from": [0, 1.4, 10.6], "to": [0, 1.0, 9.5], "look": [-0.6, 6.5, -10]}, energy=1),
]
assert len(SH) == len(b) - 1, (len(SH), len(b))
shots = []
for i, sh in enumerate(SH):
    t0, t1 = b[i], b[i + 1]
    ws = [w for w in WORDS if t0 <= w["t0"] < t1]
    shots.append(dict(start=t0, end=t1, line=" ".join(w["w"] for w in ws), words=ws, characters=sh.pop("characters", []), **sh))
story = dict(title="A Volcano Brought the Plague?", preset="mystery", voice="Kokoro v1.0 (hexgrad/Kokoro-82M, Apache-2.0 incl. voice packs), voice bm_george, local ONNX",
             fps=30, width=1080, height=1920, audio="voiceover.wav", bed="bed.wav", cast=CAST,
             captions=dict(words=3, highlight=["VOLCANO", "PLAGUE", "BLACK", "DEATH", "SULPHUR", "ERUPTION", "ERUPTIONS", "GRAIN", "FLEAS", "VENICE", "GENOA", "PISA", "MILAN", "ROME", "MOON", "TRADE"]),
             shots=shots)
json.dump(story, open(f"{out}/story.json", "w"), indent=1)
print(len(shots), "shots,", round(END, 2), "s")
