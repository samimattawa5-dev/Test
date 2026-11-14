import json, re, sys
out = sys.argv[1]
L = json.load(open(f"{out}/vo_lines.json"))
END = L[-1]["t1"] + 0.3

# word timings: spread each line's words over its time by length
WORDS = []
for ln in L:
    ws = ln["line"].split(); wt = [len(w) + 2 for w in ws]; tot = sum(wt); t = ln["t0"]
    for w, x in zip(ws, wt):
        d = (ln["t1"] - ln["t0"]) * x / tot; WORDS.append({"w": w, "t0": round(t, 3), "t1": round(t + d, 3)}); t += d
def wt(word, after=0.0):
    for w in WORDS:
        if w["t0"] >= after and re.sub(r"[^a-z0-9-]", "", w["w"].lower()) == word.lower(): return w["t0"]
    raise SystemExit("word not found: " + word)
def lt(i): return L[i - 1]["t0"], L[i - 1]["t1"]

CAST = {
 "maya": dict(color="#ff9f43", outfit="labcoat", glasses=True, hair=dict(style="bob", color="#6b3e26")),
 "omar": dict(color="#4a90e2", outfit="labcoat", hair=dict(style="spiky", color="#222222"), skin="#c98e62"),
 "lina": dict(color="#c77dff", hold="clipboard", glasses=True, hair=dict(style="bun", color="#a0522d"), skin="#8f5a3a"),
 "sam":  dict(color="#4ecdc4", outfit="explorer", skin="#e8b48c"),
 "dad":  dict(color="#3c8a4f", hair=dict(style="tuft", color="#3a2a20"), skin="#e8b48c"),
 "mom":  dict(color="#ff7aa8", hair=dict(style="long", color="#3a2a20"), skin="#f6c9a8"),
 "kid":  dict(color="#ffd86b", hair=dict(style="cap", color="#e84a5f"), skin="#f6c9a8", scale=0.7),
}
E = lambda **k: {**dict(type="earth", size=[3], pos=[0, 0, 0], spin=0.25, barren=True), **k}
RING = lambda: dict(type="ring", color="#ffe6a8", size=[2.2, 3.6], rot=[0.35, 0, 0], pos=[0, 0, 0])
def ch(name, pos, anim, **k): return dict(cast=name, pos=pos, anim=anim, **k)

b = [0, 1.4, lt(2)[0] - 0.14, lt(3)[0] - 0.14, wt("all", lt(3)[0]) - 0.1, lt(4)[0] - 0.14, lt(5)[0] - 0.14, lt(6)[0] - 0.14,
     wt("random", lt(6)[0]) - 0.1, lt(7)[0] - 0.14, lt(8)[0] - 0.14, lt(9)[0] - 0.14, wt("thats", lt(9)[0]) - 0.1, lt(10)[0] - 0.14,
     lt(11)[0] - 0.14, wt("rocks", lt(11)[0]) - 0.1, lt(12)[0] - 0.14, lt(13)[0] - 0.14, lt(14)[0] - 0.14, lt(15)[0] - 0.14,
     wt("earth", lt(15)[0]) - 0.1, END]
b = [round(x, 2) for x in b]
twist = wt("twist", lt(12)[0])
SH = [
 # 1 hook: the ring from the ground
 dict(world="duskfield", characters=[ch("dad", [-0.9, 0, -2.5], "point"), ch("kid", [-0.9, 1.3, -2.6], "cheer", expr="wow"), ch("mom", [1.0, 0, -2.5], "lookup", expr="wow")],
      props=[dict(type="skyring", size=[34], pos=[0, 9, -40], tilt=0.55)], camera={"from": [0, 0.6, 7.5], "to": [0, 0.7, 7.0], "look": [0, 13, -20]}, energy=1, shimmer=True,
      overlays=[dict(type="title", text="EARTH HAD A RING?", t0=0.05, t1=6.5, y=330, size=118)]),
 # 2 the ringed Earth
 dict(world="space", props=[E(), RING()], camera={"from": [0, 2, 12], "to": [6, 3.5, 9], "look": [0, 0, 0]}, flash=True, energy=1,
      overlays=[dict(type="badge", text="466 MILLION YEARS AGO", t0=1.6, t1=4.3, y=640, size=50, accent="#ff4d6d"),
                dict(type="badge", text="HYPOTHESIS · MONASH 2024", t0=4.3, t1=b[2], y=640, size=46, accent="#444444")]),
 # 3 clues in the rocks
 dict(world="desert", characters=[ch("maya", [-1.3, 0, 0.6], "inspect", hold="magnifier", expr="wow", to=[-0.9, 0, 1.0], walk=dict(t0=b[2], t1=b[2] + 1.6)),
                                   ch("omar", [0.6, 0, 0.2], "point", face=-30), ch("lina", [1.15, 0, 0.9], "nod", expr="smile", face=-20)],
      props=[dict(type="crater", size=[2.6], pos=[0.4, 0.05, -2]), dict(type="box", color="#b9774a", size=[6, 0.5, 1], pos=[0, 0.25, -4]), dict(type="box", color="#8a5a3a", size=[6, 0.5, 1], pos=[0, 0.75, -4]), dict(type="box", color="#c99a6a", size=[6, 0.5, 1], pos=[0, 1.25, -4])],
      camera={"from": [0, 2.2, 8.5], "to": [-0.5, 1.8, 7.2], "look": [0, 1.0, 0]}, energy=1),
 # 4 the team maps 21 craters
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.4], "talk", expr="grin"), ch("omar", [-0.6, 0, 0.9], "point"), ch("lina", [0.6, 0, 0.9], "nod"), ch("sam", [1.8, 0, 0.4], "cheer", actions=[dict(t=b[3], anim="idle"), dict(t=wt("twenty-one", lt(3)[0]), anim="cheer")])],
      props=[dict(type="box", color="#e9eef2", size=[3.2, 0.1, 1.4], pos=[0, 1.05, -1.2]), dict(type="box", color="#7d8a96", size=[3, 1, 1.2], pos=[0, 0.5, -1.2]), E(pos=[0, 1.75, -1.2], size=[1.1])],
      camera={"from": [0, 2.4, 9.5], "to": [0, 2.2, 8.6], "look": [0, 1.3, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 0}, to=21, label="IMPACT CRATERS", t0=wt("twenty-one", lt(3)[0]), t1=b[4], y=330, dur=0.9)]),
 # 5 same slice of time: Ordovician
 dict(world="desert", props=[dict(type="crater", size=[2.2], pos=[x, 0.05, z]) for x, z in [(-3, -2), (0, -3), (3, -2), (-2, 1), (2, 1), (0, -6), (-4, -5), (4, -5)]],
      characters=[ch("sam", [0, 0, 3], "wave", expr="grin")], camera={"from": [0, 2, 9], "to": [0, 9, 8], "look": [0, 0, -1]}, energy=2,
      overlays=[dict(type="badge", text="ORDOVICIAN PERIOD", t0=wt("ordovician", lt(3)[0]) - 0.2, t1=b[5], y=420, accent="#2f6db5")]),
 # 6 rewind plate tectonics
 dict(world="space", props=[E(spin=-2.5)], camera={"from": [0, 0.5, 9], "to": [0, 1.5, 7.5], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="badge", text="REWIND: PLATE TECTONICS", t0=b[5] + 0.3, t1=b[6], y=420, accent="#7a5aa8")]),
 # 7 all within 30 degrees
 dict(world="space", props=[E(dots=21, dotsLat=0.45), dict(type="shadowband", size=[3, 1.5], pos=[0, 0, 0], color="#ffb347", opacity=0.22, appear=dict(t0=b[6] + 0.3, t1=b[6] + 1.3))],
      camera={"from": [0, 3, 10], "to": [0, 1, 8], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="badge", text="ALL 21 WITHIN 30° OF THE EQUATOR", t0=wt("within", lt(5)[0]) - 0.2, t1=b[7], y=420, size=44, accent="#ff4d6d")]),
 # 8 darts test
 dict(world="lab", characters=[ch("lina", [-1.2, 0, 1.0], "throw", expr="grin"), ch("omar", [0.3, 0, 1.4], "shrug"), ch("maya", [1.5, 0, 0.8], "talk")],
      props=[E(pos=[0.6, 2.6, -2.2], size=[1.6], dots=30, dotsLat=1.4, spin=0.6)], camera={"from": [0, 2.3, 9], "to": [0.3, 2.3, 8], "look": [0, 1.6, 0]}, energy=2,
      overlays=[dict(type="badge", text="ONLY ~1/3 OF THE LAND NEAR THE EQUATOR", t0=b[7] + 0.4, t1=b[8], y=380, size=40, accent="#2f9bff")]),
 # 9 random rocks hit everywhere
 dict(world="space", props=[E(dots=40, dotsLat=1.4, spin=0.5)], camera={"from": [3, 1, 9], "to": [-2, 1.5, 8], "look": [0, 0, 0]}, energy=2,
      overlays=[dict(type="badge", text="RANDOM HITS: EVERYWHERE", t0=b[8] + 0.2, t1=b[9], y=420, accent="#555555")]),
 # 10 odds
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.6], "cheer", expr="grin"), ch("omar", [-0.6, 0, 1.0], "jump", expr="wow"), ch("lina", [0.6, 0, 1.0], "talk", expr="wow"), ch("sam", [1.8, 0, 0.6], "cheer", expr="grin")],
      props=[], camera={"from": [-1, 2.3, 9.5], "to": [1, 2.3, 9.0], "look": [0, 1.3, 0]}, energy=2,
      overlays=[dict(type="counter", **{"from": 1}, to=25000000, prefix="1 IN ", roll=False, size=118, label="ODDS BY CHANCE", t0=wt("one", lt(7)[0]) - 0.1, t1=b[10], y=300)]),
 # 11 rubble-pile asteroid approaches
 dict(world="space", props=[E(), dict(type="breakup", pos=[-7, 3, 2], move=[-3.2, 1.2, 1.6], at=999, spin=0.8)], camera={"from": [-6, 3, 11], "to": [-1, 2, 10], "look": [-2, 1, 0]}, energy=2,
      overlays=[dict(type="badge", text="RUBBLE-PILE ASTEROID", t0=wt("rubble-pile", lt(8)[0]) - 0.2, t1=b[11], y=420, accent="#8d7b6a")]),
 # 12 Roche limit
 dict(world="space", props=[E(), dict(type="roche", size=[5.2], pos=[0, 0, 0]), dict(type="breakup", pos=[-3.2, 1.2, 1.6], move=[-2.4, 0.4, 1.2], at=999, spin=0.8)],
      camera={"from": [0, 6, 10], "to": [0, 4, 9], "look": [-0.5, 0, 0]}, energy=2,
      overlays=[dict(type="badge", text="ROCHE LIMIT ≈ 3,100 KM", t0=wt("three", lt(9)[0]) - 0.2, t1=b[13], y=420, accent="#ff6b6b")]),
 # 13 near side vs far side
 dict(world="space", props=[E(), dict(type="roche", size=[5.2], pos=[0, 0, 0]), dict(type="breakup", pos=[-2.4, 0.4, 1.2], move=[-2.2, 0.1, 1.0], at=b[12] + 1.0, spread=0.25, spin=0.8)],
      camera={"from": [-4, 1.5, 5], "to": [-3.5, 1, 4.2], "look": [-2.2, 0.2, 1]}, energy=2),
 # 14 torn apart, ring forms
 dict(world="space", props=[E()] + [dict(type="rock", color="#b8a48c", size=[0.3], orbit=dict(radius=2.4 + 0.15 * (i % 4), speed=0.8, phase=i * 0.52, y=0.05 * (i % 3)), spin=3) for i in range(14)]
      + [dict(type="ring", color="#ffe6a8", size=[2.2, 3.4], rot=[0, 0, 0], pos=[0, 0, 0], appear=dict(t0=b[13] + 1.5, t1=b[14] - 0.3))],
      camera={"from": [0, 6, 10], "to": [0, 3, 9], "look": [0, 0, 0]}, energy=2, kicks=[b[13] + 0.2], flash=True, shimmer=True),
 # 15 chunks fall (dodge)
 dict(world="desert", characters=[ch("sam", [0, 0, 1.0], "run", expr="worried"), ch("omar", [1.3, 0, -0.2], "scared", expr="wow")],
      props=[dict(type="rock", color="#7a6a5a", size=[0.5], pos=[x, 0.3, z], fall=8) for x, z in [(-3, -1), (-1, -3), (1.5, -2), (3, -0.5), (-2, -5), (2.5, -4), (0, -1.5)]],
      camera={"from": [0, 2.4, 9.5], "to": [0, 2.0, 8.6], "look": [0, 1.2, 0]}, energy=2, kicks=[b[14] + 1.2, b[14] + 2.8]),
 # 16 meteorite debris in the rock layers
 dict(world="desert", characters=[ch("omar", [-0.6, 0, 0.6], "kneel", expr="grin", face=20), ch("lina", [0.9, 0, 0.6], "nod", expr="smile", face=-20)],
      props=[dict(type="box", color="#b9774a", size=[5, 0.45, 1], pos=[0, 0.22, -1.6]), dict(type="box", color="#6e4a35", size=[5, 0.45, 1], pos=[0, 0.67, -1.6]), dict(type="box", color="#c99a6a", size=[5, 0.45, 1], pos=[0, 1.12, -1.6])]
      + [dict(type="sphere", color="#3a2e2a", size=[0.12], pos=[-2 + i * 0.5, 0.67, -1.08]) for i in range(9)],
      camera={"from": [0, 1.8, 6.5], "to": [0, 1.4, 5.6], "look": [0, 0.8, 0]}, energy=1,
      overlays=[dict(type="badge", text="METEORITE DEBRIS IN THE ROCKS", t0=b[15] + 0.3, t1=b[16], y=420, size=44, accent="#6e4a35")]),
 # 17 twist: ring's shadow
 dict(world="space", props=[E(), RING(), dict(type="shadowband", size=[3, 0.9], pos=[0, 0, 0], appear=dict(t0=twist + 1.2, t1=twist + 3.0))],
      camera={"from": [3, 1.5, 10], "to": [-1, 1, 8.5], "look": [0, 0, 0]}, drop=True,
      overlays=[dict(type="title", text="THE TWIST", t0=twist - 0.1, t1=twist + 2.2, y=330, size=120, color="#ffd84d"),
                dict(type="badge", text="RING: ~40 MILLION YEARS?", t0=wt("forty", lt(12)[0]) - 0.2, t1=b[17], y=420, accent="#2f9bff")]),
 # 18 coldest
 dict(world="ice", characters=[ch("mom", [-1.6, 0, 0.6], "hug", outfit="scarf", scarf="#4a90e2", expr="worried"), ch("kid", [-0.8, 0, 1.0], "shiver", outfit="scarf", expr="worried"),
                               ch("dad", [0.5, 0, 0.8], "shiver", outfit="scarf", scarf="#e84a5f", expr="worried"), ch("lina", [1.6, 0, 0.5], "scared", outfit="scarf", expr="wow")],
      props=[dict(type="frost", size=[9], pos=[0, 0.02, 0], appear=dict(t0=b[17], t1=b[17] + 2.5, grow=True))] + [dict(type="sphere", color="#ffffff", size=[0.15], pos=[x, 0, z], fall=6) for x, z in [(-2, 0), (-0.5, -1), (1, 0.5), (2, -0.5), (0, 1.5), (-1.5, 1), (2.4, 1.2)]],
      camera={"from": [0, 2.6, 9.5], "to": [0, 2.0, 8.4], "look": [0, 1.1, 0]}, energy=1,
      overlays=[dict(type="badge", text="ONE OF THE COLDEST IN 500M YEARS", t0=wt("coldest", lt(13)[0]) - 0.3, t1=b[18], y=400, size=42, accent="#2f9bff")]),
 # 19 debate
 dict(world="lab", characters=[ch("maya", [-1.8, 0, 0.7], "nod", expr="grin"), ch("omar", [-0.6, 0, 1.0], "talk", expr="smile"), ch("lina", [0.6, 0, 1.0], "no", expr="worried"), ch("sam", [1.8, 0, 0.7], "shrug", expr="neutral")],
      props=[E(pos=[0, 3.4, -2.6], size=[1.0], spin=0.5), dict(type="ring", color="#ffe6a8", size=[0.75, 1.15], pos=[0, 3.4, -2.6], rot=[0.3, 0, 0])],
      camera={"from": [1, 2.3, 9.5], "to": [-1, 2.3, 9.0], "look": [0, 1.4, 0]}, energy=2,
      overlays=[dict(type="badge", text="HYPOTHESIS · NOT PROVEN YET", t0=wt("hypothesis", lt(14)[0]) - 0.3, t1=b[19], y=380, size=46, accent="#444444")]),
 # 20 look up tonight
 dict(world="duskfield", characters=[ch("dad", [-0.9, 0, -2.5], "point", expr="wow"), ch("kid", [-0.9, 1.3, -2.6], "cheer", expr="grin"), ch("mom", [1.0, 0, -2.5], "lookup", expr="wow")],
      props=[dict(type="skyring", size=[34], pos=[0, 9, -40], tilt=0.55)], camera={"from": [0, 0.8, 8], "to": [0, 0.5, 6.8], "look": [0, 13.5, -20]}, energy=1, shimmer=True),
 # 21 back to space: loop
 dict(world="space", props=[E(), RING()], camera={"from": [2, 1.5, 9], "to": [0, 3, 13], "look": [0, 0, 0]}, energy=1,
      overlays=[dict(type="title", text="PROOF OR COINCIDENCE?", t0=wt("proof", lt(15)[0]) - 0.1, t1=END, y=330, size=100, color="#ffd84d")]),
]
assert len(SH) == len(b) - 1, (len(SH), len(b))
shots = []
for i, s in enumerate(SH):
    t0, t1 = b[i], b[i + 1]
    ws = [w for w in WORDS if t0 <= w["t0"] < t1]
    s = dict(start=t0, end=t1, line=" ".join(w["w"] for w in ws) or "", words=ws, characters=s.pop("characters", []), **s)
    shots.append(s)
story = dict(title="Earth Had a Ring?", fps=30, width=1080, height=1920, audio="voiceover.wav", bed="bed.wav", mood="wonder", style="soft",
             cast=CAST, captions=dict(words=3, active="#FFE14D", key="#5CFFB0",
             highlight=["SATURN", "RING", "RINGS", "EQUATOR", "ASTEROID", "GRAVITY", "SHADOW", "COLDEST", "TWIST", "CRATERS", "FREEZE", "ROCHE", "ORDOVICIAN", "HYPOTHESIS", "TROPICS"]),
             shots=shots)
json.dump(story, open(f"{out}/story.json", "w"), indent=1)
print(len(shots), "shots,", END, "s")
